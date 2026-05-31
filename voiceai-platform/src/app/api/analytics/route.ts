import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/db";

export async function GET() {
  try {
    const analytics = getAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
