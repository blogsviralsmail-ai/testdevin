import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { BillingClient } from "./client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();
  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const razorpayConfigured = Boolean(
    (await prisma.setting.findUnique({ where: { key: "razorpay_key_id" } }))?.value,
  );
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold">Billing</h1>
      <p className="mt-1 text-neutral-600">
        Current plan: <strong>{fresh?.plan ?? "trial"}</strong> — used{" "}
        {fresh?.conversationsUsed ?? 0} / {fresh?.conversationsQuota ?? 0} conversations.
      </p>
      {!razorpayConfigured && (
        <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Razorpay is not configured yet. The owner can add API keys in <code>/admin/settings</code>.
          Until then checkout is disabled.
        </div>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {plans.map((p) => (
          <BillingClient
            key={p.id}
            plan={{
              id: p.id,
              name: p.name,
              slug: p.slug,
              priceMonthly: p.priceMonthly,
              priceAnnual: p.priceAnnual,
              conversationsQuota: p.conversationsQuota,
              features: p.features ?? "",
              isPopular: p.isPopular,
              current: fresh?.plan === p.slug,
            }}
            razorpayConfigured={razorpayConfigured}
          />
        ))}
      </div>
    </div>
  );
}
