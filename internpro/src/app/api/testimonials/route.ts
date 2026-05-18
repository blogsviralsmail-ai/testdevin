import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get("public") === "true";

  const testimonials = await prisma.testimonial.findMany({
    where: isPublic ? { isPublished: true } : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(testimonials);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();

  // Students can submit, admin can add manually
  if (session.role === "student") {
    data.userId = session.id;
    data.name = data.name || session.name;
  } else if (!["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testimonial = await prisma.testimonial.create({ data });
  return NextResponse.json(testimonial);
}
