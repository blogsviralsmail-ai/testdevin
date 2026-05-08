import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { resume, coverNote } = await request.json();

  const existing = await prisma.jobApplication.findUnique({ where: { jobId_userId: { jobId: id, userId: session.id } } });
  if (existing) return NextResponse.json({ error: "Already applied" }, { status: 400 });

  const application = await prisma.jobApplication.create({
    data: { jobId: id, userId: session.id, resume, coverNote },
  });

  return NextResponse.json(application);
}
