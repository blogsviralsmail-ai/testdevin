import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const members = await prisma.teamMember.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { name, role, bio, photo, order } = body;
  const member = await prisma.teamMember.create({
    data: { name, role: role || "", bio: bio || "", photo: photo || "", order: order || 0 },
  });
  return NextResponse.json(member);
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { id, name, role, bio, photo, order } = body;
  const member = await prisma.teamMember.update({
    where: { id },
    data: { name, role, bio, photo, order },
  });
  return NextResponse.json(member);
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.teamMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
