import { NextRequest, NextResponse } from "next/server";
import { registerUser, createToken } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, collegeName, degree, year, address, state, referralCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const user = await registerUser({
      name, email, password, phone,
      role: "student",
      collegeName, degree, year, address, state,
    });

    // Auto-create enrollment (application) in the first active batch
    const firstBatch = await prisma.batch.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (firstBatch) {
      await prisma.enrollment.create({
        data: {
          studentId: user.id,
          batchId: firstBatch.id,
          status: "applied",
        },
      });
    }

    // Track referral if code provided
    if (referralCode) {
      const agent = await prisma.agent.findUnique({ where: { referralCode } });
      if (agent) {
        await prisma.referral.create({
          data: { agentId: agent.id, studentId: user.id, status: "pending" },
        });
      }
    }

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    const token = createToken(sessionUser);
    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.name, user.email).catch(() => {});

    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
