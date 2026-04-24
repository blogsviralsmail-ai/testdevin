"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import type { Agent } from "@prisma/client";

export function NewChannelForm({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [name, setName] = useState("My WhatsApp");
  const [type] = useState<"whatsapp">("whatsapp");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agentId) {
      toast.error("Please create an agent first");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, agentId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Failed");
      return;
    }
    router.push(`/dashboard/channels/${data.channel.id}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect WhatsApp</CardTitle>
        <CardDescription>Link your WhatsApp via QR scan (same as Dealism).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Agent</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              required
            >
              {agents.length === 0 && <option value="">No agents — create one first</option>}
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <Button type="submit" variant="primary" size="lg" disabled={loading}>
            {loading ? "Creating..." : "Create channel & scan QR"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
