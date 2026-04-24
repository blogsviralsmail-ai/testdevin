import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const user = await apiRequireUser();
    const body = await req.json();
    const { title, content: rawContent, sourceUrl, agentId, sourceType } = body as {
      title: string;
      content: string;
      sourceUrl?: string;
      agentId?: string;
      sourceType: "text" | "url" | "faq";
    };

    let content = rawContent;
    if (sourceType === "url" && sourceUrl && !content) {
      try {
        const res = await fetch(sourceUrl);
        const html = await res.text();
        content = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000);
      } catch {
        return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 });
      }
    }

    if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });

    const embedding = await generateEmbedding(content).catch(() => null);

    const item = await prisma.knowledgeItem.create({
      data: {
        userId: user.id,
        agentId: agentId || null,
        title,
        content,
        sourceType: sourceType || "text",
        sourceUrl: sourceUrl || null,
        embedding: embedding ? JSON.stringify(embedding) : null,
      },
    });

    return NextResponse.json({ item });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
