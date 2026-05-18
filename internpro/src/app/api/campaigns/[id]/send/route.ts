import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  // Get target users
  const where = campaign.targetRole === "all" ? {} : { role: campaign.targetRole };
  const users = await prisma.user.findMany({ where, select: { email: true, name: true } });

  let sentCount = 0;
  for (const user of users) {
    const html = campaign.htmlContent.replace(/\{\{name\}\}/g, user.name);
    const sent = await sendEmail({ to: user.email, subject: campaign.subject, html });
    if (sent) sentCount++;
  }

  await prisma.emailCampaign.update({
    where: { id },
    data: { status: "sent", sentAt: new Date(), sentCount },
  });

  return NextResponse.json({ success: true, sentCount, totalTargeted: users.length });
}
