import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Smartphone, BookOpen, Plus, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [agents, channels, conversations, knowledge, dbUser] = await Promise.all([
    prisma.agent.count({ where: { userId: user.id } }),
    prisma.channel.count({ where: { userId: user.id } }),
    prisma.conversation.count({ where: { userId: user.id } }),
    prisma.knowledgeItem.count({ where: { userId: user.id } }),
    prisma.user.findUnique({ where: { id: user.id } }),
  ]);

  const recentConvos = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { lastMessageAt: "desc" },
    take: 5,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const daysLeft = dbUser?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(dbUser.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name || user.email.split("@")[0]} 👋</h1>
          <p className="mt-1 text-neutral-600">Here&apos;s what your AI sales team is up to.</p>
        </div>
        {dbUser?.plan === "trial" && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
            <span className="font-semibold text-orange-700">{daysLeft} days left</span>
            <span className="text-orange-600"> in your free trial.</span>{" "}
            <Link href="/price" className="font-medium text-orange-700 underline">Upgrade</Link>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard icon={Bot} label="Agents" value={agents} href="/dashboard/agents" />
        <StatCard icon={Smartphone} label="Channels" value={channels} href="/dashboard/channels" />
        <StatCard icon={MessageSquare} label="Conversations" value={conversations} href="/dashboard/conversations" />
        <StatCard icon={BookOpen} label="Knowledge" value={knowledge} href="/dashboard/knowledge" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent conversations</CardTitle>
            <CardDescription>Your latest customer interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentConvos.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                <p>No conversations yet.</p>
                <p className="text-sm">Connect a channel to start receiving messages.</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {recentConvos.map((c) => (
                  <li key={c.id} className="py-3">
                    <Link href={`/dashboard/conversations/${c.id}`} className="flex items-center justify-between hover:bg-neutral-50 rounded-lg px-2 -mx-2 py-1">
                      <div>
                        <div className="font-medium">{c.contactName || c.contactNumber}</div>
                        <div className="text-xs text-neutral-500 truncate max-w-sm">
                          {c.messages[0]?.content || "No messages yet"}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400">
                        {new Date(c.lastMessageAt).toLocaleDateString()}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/agents/new"><Plus className="h-4 w-4 mr-2" />Create agent</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/channels/new"><Smartphone className="h-4 w-4 mr-2" />Connect WhatsApp</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/knowledge"><BookOpen className="h-4 w-4 mr-2" />Add knowledge</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage this period</CardTitle>
            <CardDescription>
              {dbUser?.conversationsUsed ?? 0} / {dbUser?.conversationsQuota ?? 0} conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                style={{
                  width: `${Math.min(100, ((dbUser?.conversationsUsed ?? 0) / Math.max(1, dbUser?.conversationsQuota ?? 1)) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="group">
      <Card className="hover-lift">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Icon className="h-5 w-5 text-neutral-400" />
            <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-orange-500 transition-colors" />
          </div>
          <div className="mt-4 text-3xl font-bold">{value}</div>
          <div className="text-sm text-neutral-500">{label}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
