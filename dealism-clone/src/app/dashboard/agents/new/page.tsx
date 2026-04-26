"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewAgentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    systemPrompt: "You are a friendly, expert sales rep. You understand the business and help customers find what they need. You handle objections gracefully and keep conversations moving toward a sale.",
    tone: "friendly",
    language: "en",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed");
      return;
    }
    toast.success("Agent created");
    router.push("/dashboard/agents");
    router.refresh();
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/dashboard/agents" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>New agent</CardTitle>
          <CardDescription>Describe your business and selling style in plain language. The agent will learn.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="name">Agent name</Label>
              <Input id="name" placeholder="e.g. Sales Rep Priya" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="e.g. Handles product inquiries" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="prompt">System prompt / personality</Label>
              <Textarea id="prompt" rows={6} required value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} />
              <p className="mt-1 text-xs text-neutral-500">Describe what your business does, your tone, your best sales moves.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Tone</Label>
                <select
                  id="tone"
                  className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
              </div>
              <div>
                <Label htmlFor="lang">Language</Label>
                <select
                  id="lang"
                  className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? "Creating..." : "Create agent"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
