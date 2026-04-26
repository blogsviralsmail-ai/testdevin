import { requireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManageWorkspace } from "@/lib/workspace";
import { t } from "@/lib/i18n";
import { TeamClient } from "./team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { user, workspace } = await requireUserWithWorkspace();

  const [members, invitations] = await Promise.all([
    prisma.membership.findMany({
      where: { workspaceId: workspace.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    canManageWorkspace(workspace.role)
      ? prisma.invitation.findMany({
          where: { workspaceId: workspace.id, acceptedAt: null },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="p-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">{t("team.title")}</h1>
        <p className="mt-1 text-neutral-600">{t("team.subtitle")}</p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{workspace.name}</CardTitle>
          <CardDescription>
            {t("team.workspaceCardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamClient
            currentUserId={user.id}
            currentRole={workspace.role}
            workspaceName={workspace.name}
            members={members.map((m) => ({
              id: m.id,
              userId: m.userId,
              role: m.role,
              user: m.user,
            }))}
            invitations={invitations.map((i) => ({
              id: i.id,
              email: i.email,
              role: i.role,
              expiresAt: i.expiresAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
