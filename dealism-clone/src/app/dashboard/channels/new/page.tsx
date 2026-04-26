import { requireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewChannelForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewChannelPage() {
  const { workspace } = await requireUserWithWorkspace();
  const agents = await prisma.agent.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { name: "asc" },
  });
  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/channels" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>
      <NewChannelForm agents={agents} />
    </div>
  );
}
