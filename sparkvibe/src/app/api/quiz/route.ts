import { quizQuestions } from "@/data/quiz";
import { NextRequest } from "next/server";

export async function GET() {
  return Response.json({ questions: quizQuestions });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // In production, save to database (Supabase)
  return Response.json({ success: true, data: body });
}
