"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { Agent } from "@prisma/client";

export function AgentEditForm({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: agent.name,
    description: agent.description ?? "",
    systemPrompt: agent.systemPrompt,
    tone: agent.tone ?? "friendly",
    language: agent.language,
    isActive: agent.isActive,
    temperature: agent.temperature,
  });
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Saved");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this agent?")) return;
    const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed");
      return;
    }
    toast.success("Agent deleted");
    router.push("/dashboard/agents");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit {agent.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Description</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <Label>System prompt</Label>
          <Textarea rows={8} value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Tone</Label>
            <select className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
          </div>
          <div>
            <Label>Language</Label>
            <select className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
          <div>
            <Label>Temperature</Label>
            <Input type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })} />
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <span className="text-sm">Active</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Button variant="primary" onClick={save} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button variant="destructive" onClick={remove}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}
