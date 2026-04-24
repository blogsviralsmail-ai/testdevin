import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Bot, Edit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const user = await requireUser();
  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { conversations: true, channels: true, knowledgeItems: true } } },
  });

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="mt-1 text-neutral-600">AI sales reps that work 24/7 for you.</p>
        </div>
        <Button asChild variant="primary">
          <Link href="/dashboard/agents/new"><Plus className="h-4 w-4 mr-2" />New agent</Link>
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-neutral-300" />
            <h3 className="mt-4 font-semibold">No agents yet</h3>
            <p className="mt-1 text-sm text-neutral-500">Create your first AI sales rep in under a minute.</p>
            <Button asChild variant="primary" className="mt-6">
              <Link href="/dashboard/agents/new">Create agent</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <Card key={a.id} className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <Link href={`/dashboard/agents/${a.id}`} className="text-neutral-400 hover:text-neutral-700">
                    <Edit className="h-4 w-4" />
                  </Link>
                </div>
                <h3 className="mt-4 font-semibold">{a.name}</h3>
                <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{a.description || "AI sales agent"}</p>
                <div className="mt-4 flex gap-4 text-xs text-neutral-500">
                  <span>{a._count.channels} channels</span>
                  <span>{a._count.conversations} chats</span>
                  <span>{a._count.knowledgeItems} KB items</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.isActive ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${a.isActive ? "bg-green-500" : "bg-neutral-400"}`} />
                    {a.isActive ? "Active" : "Paused"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
