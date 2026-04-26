/**
 * Workspace / team-collab helpers.
 *
 * Every user has a personal workspace they own, and may belong to others
 * via Memberships. Resources (Agent, Channel, KnowledgeItem, Conversation)
 * are scoped to a workspace — when a teammate creates an Agent, every
 * member of that workspace can see/use it.
 *
 * The "active" workspace is tracked on User.activeWorkspaceId (defaults
 * to the user's personal workspace when null).
 */
import { prisma } from "./prisma";

export type WorkspaceRole = "owner" | "admin" | "member";

const WORKSPACE_ROLES: readonly WorkspaceRole[] = ["owner", "admin", "member"];

/**
 * Coerce a free-form Membership.role string (Prisma stores it as String,
 * not enum) into a known WorkspaceRole. Anything unexpected — typo,
 * future role added without a migration, manual DB edit — collapses to
 * the most restrictive role so privileged routes never silently treat
 * garbage as admin.
 */
export function normalizeWorkspaceRole(raw: string | null | undefined): WorkspaceRole {
  if (!raw) return "member";
  const lower = raw.toLowerCase();
  return (WORKSPACE_ROLES as readonly string[]).includes(lower)
    ? (lower as WorkspaceRole)
    : "member";
}

export interface ActiveWorkspace {
  id: string;
  name: string;
  ownerId: string;
  role: WorkspaceRole;
}

/**
 * Returns (or creates on first access) the user's personal workspace.
 * Every user gets exactly one — created lazily when first looked up.
 */
export async function ensurePersonalWorkspace(userId: string): Promise<{
  id: string;
  name: string;
}> {
  // Look for any workspace the user OWNS. The first one chronologically
  // is treated as their personal workspace.
  const owned = await prisma.workspace.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  });
  if (owned) return { id: owned.id, name: owned.name };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Personal";

  const ws = await prisma.workspace.create({
    data: {
      name: `${displayName}'s Workspace`,
      ownerId: userId,
      memberships: { create: { userId, role: "owner" } },
    },
  });
  return { id: ws.id, name: ws.name };
}

/**
 * Returns the user's currently-active workspace plus their role in it.
 * Falls back to the personal workspace if `activeWorkspaceId` is unset
 * or no longer accessible.
 */
export async function getActiveWorkspace(userId: string): Promise<ActiveWorkspace> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeWorkspaceId: true },
  });

  if (user?.activeWorkspaceId) {
    const m = await prisma.membership.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: user.activeWorkspaceId,
          userId,
        },
      },
      include: { workspace: true },
    });
    if (m) {
      return {
        id: m.workspace.id,
        name: m.workspace.name,
        ownerId: m.workspace.ownerId,
        role: normalizeWorkspaceRole(m.role),
      };
    }
    // Membership revoked — fall through to personal workspace.
  }

  const personal = await ensurePersonalWorkspace(userId);
  // Personal workspace owner is always the user themselves.
  return { id: personal.id, name: personal.name, ownerId: userId, role: "owner" };
}

/**
 * List all workspaces the user is a member of. Used by the workspace
 * switcher in the dashboard.
 */
export async function listUserWorkspaces(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
}

/** True if the role can manage members and settings. */
export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

/** True if the role is the workspace's ultimate owner (can transfer / delete). */
export function isWorkspaceOwner(role: WorkspaceRole): boolean {
  return role === "owner";
}
