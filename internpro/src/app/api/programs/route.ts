import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  const published = searchParams.get("published");

  const where: Record<string, unknown> = {};
  if (orgId) where.orgId = orgId;
  if (published === "true") where.isPublished = true;

  const programs = await prisma.program.findMany({
    where,
    include: {
      organization: { select: { name: true, logo: true } },
      batches: { select: { id: true, name: true, isActive: true, _count: { select: { enrollments: true } } } },
      _count: { select: { batches: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(programs);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, domain, mode, duration, feeType, feeAmount, stipendAmount, maxSeats, thumbnail } = body;
    let { orgId } = body;

    if (!orgId) {
      let org = await prisma.organization.findFirst({ where: { adminId: session.id } });
      if (!org && session.role === "admin") {
        org = await prisma.organization.findFirst();
      }
      if (org) orgId = org.id;
    }

    if (!title || !domain || !duration || !orgId) {
      return NextResponse.json({ error: "Title, domain, duration, and organization are required" }, { status: 400 });
    }

    const slug = slugify(title) + "-" + Date.now().toString(36);

    const program = await prisma.program.create({
      data: {
        title,
        slug,
        description: description || null,
        domain,
        mode: mode || "online",
        duration: parseInt(duration),
        feeType: feeType || "free",
        feeAmount: parseFloat(feeAmount || "0"),
        stipendAmount: parseFloat(stipendAmount || "0"),
        maxSeats: parseInt(maxSeats || "50"),
        thumbnail: thumbnail || null,
        orgId,
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create program";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
