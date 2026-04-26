"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";
import { Trash2, UserPlus } from "lucide-react";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

interface Props {
  currentUserId: string;
  currentRole: string;
  workspaceName: string;
  members: Member[];
  invitations: Invitation[];
}

export function TeamClient({ currentUserId, currentRole, members, invitations }: Props) {
  const router = useRouter();
  const { t } = useT();
  const canManage = currentRole === "owner" || currentRole === "admin";

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    const res = await fetch("/api/workspaces/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      acceptUrl?: string;
    };
    setPending(false);
    if (!res.ok) {
      setError(data.error || t("team.inviteError"));
      return;
    }
    setInviteEmail("");
    setInfo(data.acceptUrl ? `${t("team.inviteSent")} ${data.acceptUrl}` : t("team.inviteSent"));
    router.refresh();
  }

  async function changeRole(memberId: string, role: string) {
    const res = await fetch(`/api/workspaces/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error || t("team.roleChangeError"));
      return;
    }
    router.refresh();
  }

  async function removeMember(memberId: string) {
    if (!confirm(t("team.confirmRemoveMember"))) return;
    const res = await fetch(`/api/workspaces/members/${memberId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error || t("team.removeError"));
      return;
    }
    router.refresh();
  }

  async function revokeInvite(id: string) {
    const res = await fetch(`/api/workspaces/invitations/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <form onSubmit={sendInvite} className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium">{t("team.inviteEmail")}</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder="teammate@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t("team.inviteRole")}</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
              className="mt-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="member">{t("team.roleMember")}</option>
              <option value="admin">{t("team.roleAdmin")}</option>
            </select>
          </div>
          <Button type="submit" disabled={pending} variant="primary">
            <UserPlus className="h-4 w-4 mr-1" />
            {pending ? t("team.sending") : t("team.sendInvite")}
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-600 break-all">{info}</p>}

      <div>
        <h3 className="text-sm font-semibold">{t("team.members")}</h3>
        <ul className="mt-2 divide-y divide-neutral-100 rounded-lg border border-neutral-200">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{m.user.name || m.user.email}</div>
                <div className="text-xs text-neutral-500">{m.user.email}</div>
              </div>
              <div className="flex items-center gap-3">
                {canManage && m.role !== "owner" && m.userId !== currentUserId ? (
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                  >
                    <option value="member">{t("team.roleMember")}</option>
                    <option value="admin">{t("team.roleAdmin")}</option>
                  </select>
                ) : (
                  <span className="text-xs uppercase text-neutral-500">{m.role}</span>
                )}
                {canManage && m.role !== "owner" && m.userId !== currentUserId && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-neutral-400 hover:text-red-600"
                    aria-label={t("team.remove")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {canManage && invitations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">{t("team.pendingInvitations")}</h3>
          <ul className="mt-2 divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {invitations.map((i) => (
              <li key={i.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="font-medium">{i.email}</div>
                  <div className="text-xs text-neutral-500">
                    {t("team.role")}: {i.role} • {t("team.expires")}{" "}
                    {new Date(i.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => revokeInvite(i.id)}
                  className="text-neutral-400 hover:text-red-600"
                  aria-label={t("team.revoke")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
