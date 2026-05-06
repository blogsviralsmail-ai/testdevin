import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        avatar: true, collegeName: true, degree: true, year: true,
        address: true, dob: true, createdAt: true,
      },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, phone, collegeName, degree, year, address, dob, avatar } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (collegeName !== undefined) updateData.collegeName = collegeName;
    if (degree !== undefined) updateData.degree = degree;
    if (year !== undefined) updateData.year = year;
    if (address !== undefined) updateData.address = address;
    if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        avatar: true, collegeName: true, degree: true, year: true,
        address: true, dob: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
