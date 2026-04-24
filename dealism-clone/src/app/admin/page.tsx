import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Bot, MessageSquare, BookOpen, Sliders } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [userCount, agentCount, convCount, kbCount, openaiKey] = await Promise.all([
    prisma.user.count(),
    prisma.agent.count(),
    prisma.conversation.count(),
    prisma.knowledgeItem.count(),
    prisma.setting.findUnique({ where: { key: "openai_api_key" } }),
  ]);

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="mt-1 text-neutral-600">Platform overview and controls.</p>

      {!openaiKey?.value && (
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-orange-900">⚠️ OpenAI API key not configured</h3>
              <p className="text-sm text-orange-800">Agents can&apos;t respond until you add a key.</p>
            </div>
            <Link href="/admin/settings" className="rounded-full bg-orange-600 text-white text-sm font-semibold px-4 py-2">
              Configure now
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat icon={Users} label="Total users" value={userCount} href="/admin/users" />
        <Stat icon={Bot} label="Total agents" value={agentCount} />
        <Stat icon={MessageSquare} label="Total conversations" value={convCount} />
        <Stat icon={BookOpen} label="KB items" value={kbCount} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/admin/settings" className="group">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sliders className="h-5 w-5 text-orange-500" />API Keys & Settings</CardTitle>
              <CardDescription>Configure OpenAI, branding, feature flags.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/plans" className="group">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Manage plans & pricing</CardTitle>
              <CardDescription>Edit pricing tiers shown on /price.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; href?: string }) {
  const body = (
    <Card className="hover-lift">
      <CardContent className="p-6">
        <Icon className="h-5 w-5 text-neutral-400" />
        <div className="mt-4 text-3xl font-bold">{value}</div>
        <div className="text-sm text-neutral-500">{label}</div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
