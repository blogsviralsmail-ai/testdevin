"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserActions({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();

  async function toggleAdmin() {
    const newRole = role === "admin" ? "user" : "admin";
    if (!confirm(`Set role to ${newRole}?`)) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast.success("Role updated");
      router.refresh();
    } else toast.error("Failed");
  }

  async function del() {
    if (!confirm("Delete this user and all their data? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.refresh();
    } else toast.error("Failed");
  }

  return (
    <div className="flex gap-2">
      <button onClick={toggleAdmin} className="text-xs text-orange-600 hover:underline">
        {role === "admin" ? "Demote" : "Promote"}
      </button>
      <button onClick={del} className="text-xs text-red-600 hover:underline">Delete</button>
    </div>
  );
}
