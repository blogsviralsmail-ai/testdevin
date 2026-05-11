import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetExpiry: { gte: new Date() } },
    });

    if (!user) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, plainPassword: password, resetToken: null, resetExpiry: null },
    });

    return NextResponse.json({ message: "Password reset successfully. You can now log in." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reset password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
