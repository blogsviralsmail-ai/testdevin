"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  role: string;
  ownerId: string;
}

/**
 * Inline workspace switcher rendered in the dashboard sidebar.
 * Loads memberships once on mount; switching writes
 * `User.activeWorkspaceId` and refreshes the route tree.
 */
export function WorkspaceSwitcher() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setWorkspaces(data.workspaces ?? []);
        setActiveId(data.activeWorkspaceId ?? data.workspaces?.[0]?.id ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function switchTo(id: string) {
    setOpen(false);
    if (id === activeId) return;
    const res = await fetch("/api/workspaces", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: id }),
    });
    if (res.ok) {
      setActiveId(id);
      router.refresh();
    }
  }

  if (workspaces.length === 0) return null;
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
      >
        <span className="truncate">{active.name}</span>
        <ChevronsUpDown className="h-4 w-4 text-neutral-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 rounded-lg border border-neutral-200 bg-white shadow-lg">
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => switchTo(w.id)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                w.id === active.id ? "bg-orange-50 text-orange-700" : ""
              }`}
            >
              <span className="truncate">{w.name}</span>
              <span className="ml-2 shrink-0 text-xs uppercase text-neutral-400">{w.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
