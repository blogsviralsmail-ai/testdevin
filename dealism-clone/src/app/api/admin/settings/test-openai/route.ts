import { NextResponse } from "next/server";
import { apiRequireAdmin } from "@/lib/auth";
import { getOpenAIClient } from "@/lib/openai";

export async function POST() {
  try {
    await apiRequireAdmin();
    const client = await getOpenAIClient();
    if (!client) return NextResponse.json({ error: "No API key configured" }, { status: 400 });
    const res = await client.models.list();
    const sample = res.data.slice(0, 3).map((m) => m.id).join(", ");
    return NextResponse.json({ ok: true, sample });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
