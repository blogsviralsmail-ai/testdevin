import { prisma } from "@/lib/prisma";

// Cache permissions for a role (in-memory, resets on server restart)
const cache = new Map<string, { permissions: string[]; expiry: number }>();

export async function getRolePermissions(roleName: string): Promise<string[]> {
  const now = Date.now();
  const cached = cache.get(roleName);
  if (cached && cached.expiry > now) return cached.permissions;

  const role = await prisma.role.findUnique({
    where: { name: roleName },
    include: { permissions: true },
  });

  if (!role) {
    // No Role record yet — return empty so layout falls back to role-based filtering only
    if (roleName === "admin" || roleName === "organization") return ["*"];
    return [];
  }

  const perms = role.permissions.map(p => p.permission);
  cache.set(roleName, { permissions: perms, expiry: now + 60000 }); // 1 min cache
  return perms;
}

export function hasPermission(userPermissions: string[], required: string): boolean {
  if (userPermissions.includes("*")) return true;
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  if (userPermissions.includes("*")) return true;
  return required.some(p => userPermissions.includes(p));
}
