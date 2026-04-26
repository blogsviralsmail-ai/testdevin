import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { UserActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { agents: true, conversations: true } } },
  });
  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-3xl font-bold">Users</h1>
      <p className="mt-1 text-neutral-600">Manage platform users.</p>
      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Plan</th>
                  <th className="p-3 text-left">Usage</th>
                  <th className="p-3 text-left">Agents</th>
                  <th className="p-3 text-left">Convos</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-neutral-100">
                    <td className="p-3">
                      <div className="font-medium">{u.name || u.email}</div>
                      <div className="text-xs text-neutral-500">{u.email}</div>
                    </td>
                    <td className="p-3 capitalize">{u.plan}</td>
                    <td className="p-3">{u.conversationsUsed} / {u.conversationsQuota}</td>
                    <td className="p-3">{u._count.agents}</td>
                    <td className="p-3">{u._count.conversations}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "admin" ? "bg-orange-100 text-orange-700" : "bg-neutral-100"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-neutral-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <UserActions userId={u.id} role={u.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
