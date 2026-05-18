import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.emailCampaign.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(campaigns);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, subject, htmlContent, targetRole, scheduledAt } = await request.json();
  if (!title || !subject || !htmlContent) return NextResponse.json({ error: "Title, subject, content required" }, { status: 400 });

  const campaign = await prisma.emailCampaign.create({
    data: { title, subject, htmlContent, targetRole: targetRole || "all", scheduledAt: scheduledAt ? new Date(scheduledAt) : null, createdBy: session.id },
  });

  return NextResponse.json(campaign);
}
