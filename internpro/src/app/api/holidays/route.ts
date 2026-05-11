import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyHolidayAdded } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const holidays = await prisma.holiday.findMany({
    where: { isActive: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(holidays);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, date, type, description } = body;

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
  }

  const holiday = await prisma.holiday.create({
    data: { title, date: new Date(date), type: type || "public", description: description || null },
  });

  // Notify all students about new holiday
  notifyHolidayAdded(title, date, type || "public").catch(() => {});

  return NextResponse.json(holiday, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, title, date, type, description } = body;

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const holiday = await prisma.holiday.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(date && { date: new Date(date) }),
      ...(type && { type }),
      description: description || null,
    },
  });

  return NextResponse.json(holiday);
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.holiday.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
