import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get("public") === "true";

  if (!isPublic && !session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session && ["admin", "organization"].includes(session.role);

  const jobs = await prisma.jobPosting.findMany({
    where: isPublic ? { isActive: true } : {},
    include: {
      applications: isAdmin
        ? { include: { user: { select: { name: true, email: true, phone: true } } }, orderBy: { createdAt: "desc" } }
        : session ? { where: { userId: session.id } } : false,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs.map(j => ({
    ...j,
    applicationCount: (j as Record<string, unknown>).applications ? ((j as Record<string, unknown>).applications as unknown[]).length : 0,
    hasApplied: session ? ((j.applications as unknown[])?.length > 0) : false,
    applications: isAdmin ? j.applications : undefined,
  })));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const job = await prisma.jobPosting.create({ data: { ...data, postedBy: session.id } });
  return NextResponse.json(job);
}
