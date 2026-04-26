import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PlansEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  await requireAdmin();
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold">Plans</h1>
      <p className="mt-1 text-neutral-600">Manage pricing tiers shown on the public /price page.</p>
      <div className="mt-8">
        <PlansEditor initialPlans={plans} />
      </div>
    </div>
  );
}
