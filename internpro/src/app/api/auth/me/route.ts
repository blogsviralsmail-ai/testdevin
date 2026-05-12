import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, phone, currentPassword, newPassword, avatar } = body;

  const updateData: Record<string, unknown> = {};

  if (name && name !== session.name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone || null;
  if (avatar) updateData.avatar = avatar;

  if (email && email !== session.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    updateData.email = email;
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    updateData.password = await bcrypt.hash(newPassword, 10);
    updateData.plainPassword = newPassword;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ message: "No changes" });
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: updateData,
    select: { id: true, name: true, email: true, phone: true, role: true, avatar: true },
  });

  return NextResponse.json({ user: updated, message: "Profile updated" });
}
