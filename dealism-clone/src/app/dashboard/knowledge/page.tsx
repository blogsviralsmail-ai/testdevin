import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { KnowledgeForm } from "./form";
import { BookOpen } from "lucide-react";
import { DeleteKnowledgeButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const user = await requireUser();
  const [items, agents] = await Promise.all([
    prisma.knowledgeItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.agent.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Knowledge base</h1>
        <p className="mt-1 text-neutral-600">Teach your agent about your business. The AI uses this to answer questions accurately.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <KnowledgeForm agents={agents} />
        </div>
        <div className="lg:col-span-2">
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-neutral-300" />
                <h3 className="mt-4 font-semibold">No knowledge yet</h3>
                <p className="mt-1 text-sm text-neutral-500">Add product info, FAQs, or a website URL.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-neutral-100">
                  {items.map((it) => (
                    <li key={it.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 uppercase">
                            {it.sourceType}
                          </span>
                          <h4 className="font-semibold truncate">{it.title}</h4>
                        </div>
                        <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{it.content}</p>
                        {it.sourceUrl && (
                          <Link href={it.sourceUrl} target="_blank" className="mt-1 text-xs text-orange-600 hover:underline truncate block">
                            {it.sourceUrl}
                          </Link>
                        )}
                      </div>
                      <DeleteKnowledgeButton id={it.id} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
