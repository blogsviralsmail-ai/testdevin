import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin") redirect("/dashboard");
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar isAdmin userEmail={session.user.email} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
