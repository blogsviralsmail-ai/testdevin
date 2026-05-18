import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateOfferLetterForEnrollment } from "@/lib/generate-offer-letter";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { enrollmentId } = await request.json();
    if (!enrollmentId) return NextResponse.json({ error: "Missing enrollmentId" }, { status: 400 });

    const result = await generateOfferLetterForEnrollment(enrollmentId, session.id, session.name);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: "Offer letter generated", letterNumber: result.letterNumber });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
