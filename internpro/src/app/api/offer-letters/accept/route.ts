import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { offerId, signatureUrl } = body;

    if (!offerId || !signatureUrl) {
      return NextResponse.json({ error: "Offer letter ID and signature are required" }, { status: 400 });
    }

    const letter = await prisma.offerLetter.findUnique({
      where: { id: offerId },
      include: { enrollment: { select: { studentId: true } } },
    });

    if (!letter) {
      return NextResponse.json({ error: "Offer letter not found" }, { status: 404 });
    }

    if (session.role === "student" && letter.enrollment.studentId !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (letter.isAccepted) {
      return NextResponse.json({ error: "Offer letter already accepted" }, { status: 400 });
    }

    // Update the HTML to embed the student's signature in the acceptance section
    let updatedHtml = letter.htmlContent || "";
    if (updatedHtml && signatureUrl) {
      // Replace "Signature: ________________________" with actual signature image
      updatedHtml = updatedHtml.replace(
        /Signature:\s*_{4,}/,
        `Signature: <img src="${signatureUrl}" alt="Student Signature" style="height:40px;display:inline-block;vertical-align:middle;margin-left:8px;" />`
      );
      // Replace "Date: ________________________" with actual acceptance date
      const acceptDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
      updatedHtml = updatedHtml.replace(
        /Date:\s*_{4,}/,
        `Date: ${acceptDate}`
      );
    }

    const updated = await prisma.offerLetter.update({
      where: { id: offerId },
      data: {
        isAccepted: true,
        acceptedAt: new Date(),
        signatureUrl,
        htmlContent: updatedHtml || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Offer letter accept error:", error);
    return NextResponse.json({ error: "Failed to accept offer letter" }, { status: 500 });
  }
}
