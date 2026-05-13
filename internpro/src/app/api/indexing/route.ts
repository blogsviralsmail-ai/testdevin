import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { batchNotifyUrls, notifyUrlUpdate, getUrlNotificationStatus } from "@/lib/google-indexing";

const BASE_URL = "https://internship.kkhsmedia.com";
const API_SECRET = process.env.INDEXING_API_SECRET || "kkhs-indexing-2026";

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${API_SECRET}`) return true;

  const secret = req.nextUrl.searchParams.get("secret");
  return secret === API_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, url, urls } = body;

    if (action === "submit_all") {
      const programs = await prisma.program.findMany({
        where: { isPublished: true },
        select: { id: true, slug: true },
      });

      const jobUrls = [`${BASE_URL}/vacancies`];
      for (const p of programs) {
        if (p.slug) {
          jobUrls.push(`${BASE_URL}/vacancies/${p.slug}`);
        }
      }

      const results = await batchNotifyUrls(jobUrls);
      return NextResponse.json({
        message: `Submitted ${results.length} URLs`,
        results,
      });
    }

    if (action === "update" && url) {
      const result = await notifyUrlUpdate(url);
      return NextResponse.json(result);
    }

    if (action === "batch_update" && urls && Array.isArray(urls)) {
      const results = await batchNotifyUrls(urls);
      return NextResponse.json({ results });
    }

    if (action === "status" && url) {
      const status = await getUrlNotificationStatus(url);
      return NextResponse.json(status);
    }

    return NextResponse.json(
      { error: "Invalid action. Use: submit_all, update, batch_update, status" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = req.nextUrl.searchParams.get("url");
    if (url) {
      const status = await getUrlNotificationStatus(url);
      return NextResponse.json(status);
    }

    return NextResponse.json({
      endpoints: {
        "POST /api/indexing": {
          actions: {
            submit_all: "Submit all published job posting URLs",
            update: "Submit a single URL (pass 'url' in body)",
            batch_update: "Submit multiple URLs (pass 'urls' array in body)",
            status: "Check notification status (pass 'url' in body)",
          },
        },
        "GET /api/indexing?url=...": "Check notification status for a URL",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
