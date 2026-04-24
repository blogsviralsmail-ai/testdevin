import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-1 text-neutral-600">Manage your account and preferences.</p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your name and email.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialName={dbUser?.name ?? ""}
              email={dbUser?.email ?? ""}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan & Usage</CardTitle>
            <CardDescription>Current: <b className="capitalize">{dbUser?.plan}</b></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p>Conversations used: <b>{dbUser?.conversationsUsed}</b> / {dbUser?.conversationsQuota}</p>
              {dbUser?.trialEndsAt && <p className="mt-1">Trial ends: {new Date(dbUser.trialEndsAt).toLocaleDateString()}</p>}
            </div>
            <a href="/price" className="mt-4 inline-block text-sm font-medium text-orange-600 hover:underline">Upgrade plan →</a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
