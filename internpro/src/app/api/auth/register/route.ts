import { NextRequest, NextResponse } from "next/server";
import { registerUser, createToken } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, collegeName, degree, year, address, state, referralCode, programId, preferredMode } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const user = await registerUser({
      name, email, password, phone,
      role: "student",
      collegeName, degree, year, address, state,
    });

    // Auto-create enrollment in the selected program's batch (or first active batch)
    let targetBatch = null;
    if (programId) {
      targetBatch = await prisma.batch.findFirst({
        where: { programId, isActive: true },
        orderBy: { createdAt: "desc" },
      });
    }
    if (!targetBatch) {
      targetBatch = await prisma.batch.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
    }
    if (targetBatch) {
      await prisma.enrollment.create({
        data: {
          studentId: user.id,
          batchId: targetBatch.id,
          status: "applied",
          preferredMode: preferredMode || null,
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
    logActivity("registered", "user", user.id, `New student registered: ${user.name} (${user.email})`, user.id, user.name).catch(() => {});

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
