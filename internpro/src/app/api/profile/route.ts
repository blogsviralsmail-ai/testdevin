import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true, name: true, email: true, phone: true, avatar: true,
      collegeName: true, degree: true, year: true, address: true, state: true, dob: true,
      bio: true, skills: true, linkedinUrl: true, portfolioUrl: true, role: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const fields = ["name", "email", "phone", "avatar", "collegeName", "degree", "address", "state", "bio", "skills"];
  const filled = fields.filter(f => !!(user as Record<string, unknown>)[f]);
  const profileComplete = Math.round((filled.length / fields.length) * 100);

  return NextResponse.json({ user, profileComplete });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowedFields = ["name", "phone", "bio", "skills", "linkedinUrl", "portfolioUrl", "address", "state", "collegeName", "degree", "year", "avatar"];

  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data,
    select: {
      id: true, name: true, email: true, phone: true, avatar: true,
      collegeName: true, degree: true, year: true, address: true, state: true,
      bio: true, skills: true, linkedinUrl: true, portfolioUrl: true,
    },
  });

  return NextResponse.json({ user: updated });
}
