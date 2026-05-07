import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { sendLoginNotificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { user, token } = await loginUser(email, password);

    // Send login notification (non-blocking)
    sendLoginNotificationEmail(user.name, user.email).catch(() => {});

    // Track login session for login hours
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    await prisma.loginSession.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      update: {},
      create: { userId: user.id, date: today, loginTime: timeStr },
    }).catch(() => {});

    // Session persistence: 30 days (user stays logged in until explicit logout)
    const response = NextResponse.json({ user });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
