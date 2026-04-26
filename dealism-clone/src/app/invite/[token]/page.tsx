import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AcceptInviteForm } from "./accept-form";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const inv = await prisma.invitation.findUnique({
    where: { token: params.token },
    include: { workspace: true },
  });
  if (!inv) notFound();

  if (inv.acceptedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invitation already accepted</CardTitle>
            <CardDescription>This invitation has already been used.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard" className="text-orange-600 hover:underline">
              Go to dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inv.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invitation expired</CardTitle>
            <CardDescription>
              Ask the workspace owner to send you a fresh invitation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const session = await getSession();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;

  if (!sessionUserId) {
    // Need to log in or register first. Send to register with an email
    // hint and a redirect back to this page once authenticated.
    const next = `/invite/${params.token}`;
    redirect(`/register?email=${encodeURIComponent(inv.email)}&next=${encodeURIComponent(next)}`);
  }

  // Logged in but as a different email — show a message.
  const sessionEmail = (session!.user as { email?: string }).email;
  if (sessionEmail && sessionEmail.toLowerCase() !== inv.email.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Wrong account</CardTitle>
            <CardDescription>
              This invitation is for <strong>{inv.email}</strong> but you&rsquo;re signed in
              as <strong>{sessionEmail}</strong>. Please sign out and sign in with the
              invited email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/api/auth/signout" className="text-orange-600 hover:underline">
              Sign out
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Join {inv.workspace.name}</CardTitle>
          <CardDescription>
            You&rsquo;ve been invited to join the <strong>{inv.workspace.name}</strong>{" "}
            workspace as a {inv.role}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInviteForm token={params.token} />
        </CardContent>
      </Card>
    </div>
  );
}
