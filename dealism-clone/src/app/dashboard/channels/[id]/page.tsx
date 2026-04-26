import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { ChannelDetail } from "./detail";

export const dynamic = "force-dynamic";

export default async function ChannelPage({ params }: { params: { id: string } }) {
  const { workspace } = await requireUserWithWorkspace();
  const channel = await prisma.channel.findUnique({
    where: { id: params.id },
    include: { agent: true },
  });
  if (!channel) notFound();
  if (channel.workspaceId !== workspace.id) redirect("/dashboard/channels");

  const agents = await prisma.agent.findMany({ where: { workspaceId: workspace.id } });

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/dashboard/channels" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>
      <ChannelDetail channel={channel} agents={agents} />
    </div>
  );
}
