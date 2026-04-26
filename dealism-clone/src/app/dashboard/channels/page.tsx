import Link from "next/link";
import { requireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChannelsPage() {
  const { workspace } = await requireUserWithWorkspace();
  const channels = await prisma.channel.findMany({
    where: { workspaceId: workspace.id },
    include: { agent: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channels</h1>
          <p className="mt-1 text-neutral-600">Connect WhatsApp, Instagram, or web chat to your agents.</p>
        </div>
        <Button asChild variant="primary">
          <Link href="/dashboard/channels/new"><Plus className="h-4 w-4 mr-2" />Connect channel</Link>
        </Button>
      </div>

      {channels.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-12 text-center">
            <Smartphone className="h-12 w-12 mx-auto text-neutral-300" />
            <h3 className="mt-4 font-semibold">No channels connected</h3>
            <p className="mt-1 text-sm text-neutral-500">Connect WhatsApp via QR scan to start receiving messages.</p>
            <Button asChild variant="primary" className="mt-6">
              <Link href="/dashboard/channels/new">Connect WhatsApp</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.status === "connected" ? "bg-green-100 text-green-700" : c.status === "connecting" ? "bg-yellow-100 text-yellow-700" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{c.name}</h3>
                <p className="text-sm text-neutral-500 capitalize">{c.type}</p>
                {c.phoneNumber && <p className="mt-1 text-sm text-neutral-700">+{c.phoneNumber}</p>}
                {c.agent && <p className="mt-2 text-xs text-neutral-500">Agent: {c.agent.name}</p>}
                <Link href={`/dashboard/channels/${c.id}`} className="mt-4 inline-block text-sm font-medium text-orange-600 hover:underline">
                  Manage →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
