import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { SettingsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  // Defense-in-depth: the admin layout already guards this route, but the
  // page also loads sensitive API keys (OpenAI, Razorpay) so we re-check here
  // in case the layout wrapping ever changes.
  await requireAdmin();
  const settings = await prisma.setting.findMany();
  const byKey = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold">API Keys & Settings</h1>
      <p className="mt-1 text-neutral-600">Configure integrations and platform defaults. Saved in database (encrypted-at-rest is up to your DB).</p>
      <div className="mt-8">
        <SettingsForm initial={byKey} />
      </div>
    </div>
  );
}
