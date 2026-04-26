"use client";
import { useRouter } from "next/navigation";
import { Trash } from "lucide-react";
import { toast } from "sonner";

export function DeleteKnowledgeButton({ id }: { id: string }) {
  const router = useRouter();
  async function onClick() {
    if (!confirm("Delete this knowledge item?")) return;
    const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.refresh();
    } else toast.error("Failed");
  }
  return (
    <button onClick={onClick} className="text-neutral-400 hover:text-red-500 shrink-0">
      <Trash className="h-4 w-4" />
    </button>
  );
}
