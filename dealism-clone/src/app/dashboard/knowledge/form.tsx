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

export function KnowledgeForm({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"text" | "url">("text");
  const [form, setForm] = useState({
    title: "",
    content: "",
    sourceUrl: "",
    agentId: "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sourceType: mode }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed");
      return;
    }
    toast.success("Knowledge added — generating embeddings...");
    setForm({ title: "", content: "", sourceUrl: "", agentId: form.agentId });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add knowledge</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button type="button" variant={mode === "text" ? "primary" : "outline"} size="sm" onClick={() => setMode("text")}>Text / FAQ</Button>
          <Button type="button" variant={mode === "url" ? "primary" : "outline"} size="sm" onClick={() => setMode("url")}>URL</Button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {agents.length > 0 && (
            <div>
              <Label>Agent (optional)</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                value={form.agentId}
                onChange={(e) => setForm({ ...form, agentId: e.target.value })}
              >
                <option value="">All agents</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <Label>Title</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Shipping policy" />
          </div>
          {mode === "url" && (
            <div>
              <Label>URL</Label>
              <Input type="url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://..." />
            </div>
          )}
          <div>
            <Label>Content</Label>
            <Textarea rows={6} required={mode !== "url"} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder={mode === "url" ? "Leave blank to auto-scrape the URL" : "Paste FAQs, policies, product info..."} />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Add to knowledge base"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
