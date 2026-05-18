import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: fetch all site content (admin) or single by slug (public)
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (slug) {
    const content = await prisma.siteContent.findUnique({ where: { slug } });
    if (!content || !content.isPublished) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json(content);
  }

  // List all - admin only
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pages = await prisma.siteContent.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(pages);
}

// POST: create new site content (admin only)
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, title, content, isPublished } = await req.json();
  if (!slug || !title || !content) {
    return NextResponse.json({ error: "slug, title, and content are required" }, { status: 400 });
  }

  const existing = await prisma.siteContent.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A page with this slug already exists" }, { status: 400 });
  }

  const page = await prisma.siteContent.create({
    data: { slug, title, content: typeof content === "string" ? content : JSON.stringify(content), isPublished: isPublished ?? true },
  });

  return NextResponse.json(page);
}

// PUT: update site content (admin only)
export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, title, content, isPublished } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const page = await prisma.siteContent.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(content && { content: typeof content === "string" ? content : JSON.stringify(content) }),
      ...(isPublished !== undefined && { isPublished }),
    },
  });

  return NextResponse.json(page);
}

// DELETE: delete site content (admin only)
export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.siteContent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
