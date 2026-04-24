import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentEditForm } from "./edit-form";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditAgentPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const agent = await prisma.agent.findUnique({ where: { id: params.id } });
  if (!agent) notFound();
  if (agent.userId !== user.id) redirect("/dashboard/agents");

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/dashboard/agents" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>
      <AgentEditForm agent={agent} />
    </div>
  );
}
