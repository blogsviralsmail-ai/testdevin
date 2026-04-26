import Link from "next/link";
import { requireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const { workspace } = await requireUserWithWorkspace();
  const convos = await prisma.conversation.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      channel: true,
      agent: true,
    },
  });

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-3xl font-bold">Conversations</h1>
      <p className="mt-1 text-neutral-600">Live customer chats handled by your AI agents.</p>

      {convos.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-neutral-300" />
            <h3 className="mt-4 font-semibold">No conversations yet</h3>
            <p className="mt-1 text-sm text-neutral-500">Connect a channel to start receiving messages.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardContent className="p-0">
            <ul className="divide-y divide-neutral-100">
              {convos.map((c) => (
                <li key={c.id}>
                  <Link href={`/dashboard/conversations/${c.id}`} className="flex items-center justify-between p-4 hover:bg-neutral-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold shrink-0">
                        {(c.contactName || c.contactNumber || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.contactName || c.contactNumber}</div>
                        <div className="text-sm text-neutral-500 truncate">{c.messages[0]?.content ?? "No messages"}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-xs text-neutral-400">{new Date(c.lastMessageAt).toLocaleDateString()}</div>
                      {c.status === "needs_human" && (
                        <span className="mt-1 inline-block rounded-full bg-red-100 text-red-700 text-xs px-2 py-0.5">Needs human</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
