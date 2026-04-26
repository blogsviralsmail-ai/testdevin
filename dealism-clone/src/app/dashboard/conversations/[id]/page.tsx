import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { ConversationView } from "./view";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const { workspace } = await requireUserWithWorkspace();
  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      agent: true,
      channel: true,
    },
  });
  if (!convo) notFound();
  if (convo.workspaceId !== workspace.id) redirect("/dashboard/conversations");

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard/conversations" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>
      <ConversationView convo={convo} />
    </div>
  );
}
