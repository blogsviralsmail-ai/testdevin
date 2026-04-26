"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import type { Agent } from "@prisma/client";

type ChannelType = "whatsapp" | "telegram";

export function NewChannelForm({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [type, setType] = useState<ChannelType>("whatsapp");
  const [name, setName] = useState("My WhatsApp");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [telegramToken, setTelegramToken] = useState("");
  const [loading, setLoading] = useState(false);

  function changeType(t: ChannelType) {
    setType(t);
    setName(t === "telegram" ? "My Telegram Bot" : "My WhatsApp");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agentId) {
      toast.error("Please create an agent first");
      return;
    }
    if (type === "telegram" && !telegramToken.trim()) {
      toast.error("Telegram bot token is required");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, agentId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      toast.error(data.error || "Failed");
      return;
    }
    if (type === "telegram") {
      const tokRes = await fetch(`/api/channels/${data.channel.id}/telegram-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: telegramToken }),
      });
      if (!tokRes.ok) {
        const err = await tokRes.json();
        setLoading(false);
        toast.error(err.error || "Invalid bot token");
        return;
      }
    }
    setLoading(false);
    router.push(`/dashboard/channels/${data.channel.id}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect a channel</CardTitle>
        <CardDescription>Connect WhatsApp via QR scan, or a Telegram bot via BotFather token.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Channel type</Label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`cursor-pointer rounded-xl border-2 p-3 text-sm ${
                  type === "whatsapp" ? "border-orange-500 bg-orange-50" : "border-neutral-200"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={type === "whatsapp"}
                  onChange={() => changeType("whatsapp")}
                />
                <div className="font-medium">WhatsApp</div>
                <div className="text-xs text-neutral-500">QR scan (Linked Devices)</div>
              </label>
              <label
                className={`cursor-pointer rounded-xl border-2 p-3 text-sm ${
                  type === "telegram" ? "border-orange-500 bg-orange-50" : "border-neutral-200"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={type === "telegram"}
                  onChange={() => changeType("telegram")}
                />
                <div className="font-medium">Telegram</div>
                <div className="text-xs text-neutral-500">Bot token from @BotFather</div>
              </label>
            </div>
          </div>

          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {type === "telegram" && (
            <div>
              <Label>Bot Token</Label>
              <Input
                type="password"
                placeholder="123456:ABC-DEF1234ghIkl..."
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-neutral-500">
                Get from{" "}
                <a className="text-orange-600 underline" href="https://t.me/BotFather" target="_blank" rel="noreferrer">
                  @BotFather
                </a>
                : send <code>/newbot</code>, follow prompts, paste token here.
              </p>
            </div>
          )}

          <div>
            <Label>Agent</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              required
            >
              {agents.length === 0 && <option value="">No agents — create one first</option>}
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="primary" size="lg" disabled={loading}>
            {loading ? "Creating..." : type === "telegram" ? "Create Telegram channel" : "Create channel & scan QR"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
