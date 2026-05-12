import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRolePermissions } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const permissions = await getRolePermissions(session.role);
  return NextResponse.json({ role: session.role, permissions });
}
