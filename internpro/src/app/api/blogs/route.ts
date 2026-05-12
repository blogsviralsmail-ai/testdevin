import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const published = searchParams.get("published");
  const category = searchParams.get("category");
  const fields = searchParams.get("fields");

  const where: Record<string, unknown> = {};
  if (published === "true") where.isPublished = true;
  if (category) where.category = category;

  // "listing" mode excludes content field (saves ~95% bandwidth for 1000+ articles)
  if (fields === "listing") {
    const blogs = await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        author: true,
        category: true,
        tags: true,
        state: true,
        city: true,
        views: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(blogs);
  }

  const blogs = await prisma.blogPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(blogs);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, content, excerpt, coverImage, category, tags, state, city, isPublished } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36);

  const blog = await prisma.blogPost.create({
    data: {
      title,
      slug,
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, "").substring(0, 160),
      coverImage: coverImage || null,
      category: category || "General",
      tags: tags || null,
      state: state || null,
      city: city || null,
      author: user.name || "Admin",
      isPublished: isPublished || false,
    },
  });

  return NextResponse.json(blog);
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, title, content, excerpt, coverImage, category, tags, state, city, isPublished } = body;

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const blog = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(coverImage !== undefined && { coverImage }),
      ...(category && { category }),
      ...(tags !== undefined && { tags }),
      ...(state !== undefined && { state }),
      ...(city !== undefined && { city }),
      ...(isPublished !== undefined && { isPublished }),
    },
  });

  return NextResponse.json(blog);
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const ids = searchParams.get("ids");

  if (ids) {
    const idList = ids.split(",");
    await prisma.blogPost.deleteMany({ where: { id: { in: idList } } });
    return NextResponse.json({ deleted: idList.length });
  }

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
