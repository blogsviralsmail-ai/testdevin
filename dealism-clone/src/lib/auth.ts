import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
        (token as { roleCheckedAt?: number }).roleCheckedAt = Date.now();
        return token;
      }
      // Refresh role from DB periodically so admin promote/demote and account
      // deletion take effect without forcing the user to log out first.
      const id = token.id as string | undefined;
      if (!id) return token;
      const checkedAt = (token as { roleCheckedAt?: number }).roleCheckedAt ?? 0;
      if (Date.now() - checkedAt < 60_000) return token;
      const fresh = await prisma.user.findUnique({ where: { id }, select: { role: true } });
      if (!fresh) {
        // User was deleted — invalidate by dropping id/role so guards redirect to login.
        delete (token as { id?: string }).id;
        delete (token as { role?: string }).role;
        return token;
      }
      token.role = fresh.role;
      (token as { roleCheckedAt?: number }).roleCheckedAt = Date.now();
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  // Also check id because a deleted user keeps session.user (email/name)
  // until the JWT expires; only the id is dropped by our jwt callback.
  if (!session?.user || !(session.user as { id?: string }).id) redirect("/login");
  return session.user as { id: string; email: string; name?: string | null; role: string };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

// For API routes — throw so the route can handle with 401/403
export async function apiRequireUser() {
  const session = await getSession();
  // Require id too — see requireUser() above.
  if (!session?.user || !(session.user as { id?: string }).id) throw new Error("Unauthorized");
  return session.user as { id: string; email: string; name?: string | null; role: string };
}

export async function apiRequireAdmin() {
  const user = await apiRequireUser();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}
