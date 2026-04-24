import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/openai";
import { assertSafeExternalUrl, safeFetch } from "@/lib/url-safety";

const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB
const FETCH_TIMEOUT_MS = 10_000;

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
        const validated = await assertSafeExternalUrl(sourceUrl);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        let html: string;
        try {
          // safeFetch pins the TCP connection to the already-validated IP,
          // closing the DNS-rebinding TOCTOU window between our lookup and
          // the actual HTTP connect.
          const res = await safeFetch(validated, {
            signal: controller.signal,
            headers: { "user-agent": "DealismClone-KnowledgeFetcher/1.0" },
          });
          if (!res.ok) throw new Error(`Upstream ${res.status}`);
          const buf = await res.arrayBuffer();
          if (buf.byteLength > MAX_HTML_BYTES) throw new Error("Response too large");
          html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
        } finally {
          clearTimeout(timer);
        }
        content = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch URL";
        return NextResponse.json({ error: msg }, { status: 400 });
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
