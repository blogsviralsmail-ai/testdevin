"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import type { Agent } from "@prisma/client";

type ChannelType = "whatsapp" | "telegram" | "messenger" | "line" | "viber";

const TYPE_META: Record<ChannelType, { label: string; subtitle: string; defaultName: string }> = {
  whatsapp: { label: "WhatsApp", subtitle: "QR scan (Linked Devices)", defaultName: "My WhatsApp" },
  telegram: { label: "Telegram", subtitle: "Bot token from @BotFather", defaultName: "My Telegram Bot" },
  messenger: { label: "Messenger", subtitle: "Facebook Page (Meta Graph API)", defaultName: "My FB Page" },
  line: { label: "LINE", subtitle: "Messaging API channel", defaultName: "My LINE Bot" },
  viber: { label: "Viber", subtitle: "Public Account / Bot", defaultName: "My Viber Bot" },
};

export function NewChannelForm({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [type, setType] = useState<ChannelType>("whatsapp");
  const [name, setName] = useState(TYPE_META.whatsapp.defaultName);
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  // Per-provider credential fields
  const [telegramToken, setTelegramToken] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [lineAccessToken, setLineAccessToken] = useState("");
  const [lineSecret, setLineSecret] = useState("");
  const [viberAuthToken, setViberAuthToken] = useState("");

  function changeType(t: ChannelType) {
    setType(t);
    setName(TYPE_META[t].defaultName);
  }

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
    if (!res.ok) {
      setLoading(false);
      toast.error(data.error || "Failed");
      return;
    }
    const id = data.channel.id;

    let credPath: string | null = null;
    let credBody: Record<string, string> | null = null;
    if (type === "telegram") {
      if (!telegramToken.trim()) {
        setLoading(false);
        toast.error("Bot token required");
        return;
      }
      credPath = `/api/channels/${id}/telegram-token`;
      credBody = { token: telegramToken };
    } else if (type === "messenger") {
      if (!pageAccessToken || !verifyToken) {
        setLoading(false);
        toast.error("Page access token + verify token required");
        return;
      }
      credPath = `/api/channels/${id}/credentials`;
      credBody = { pageAccessToken, verifyToken };
    } else if (type === "line") {
      if (!lineAccessToken || !lineSecret) {
        setLoading(false);
        toast.error("Channel access token + secret required");
        return;
      }
      credPath = `/api/channels/${id}/credentials`;
      credBody = { channelAccessToken: lineAccessToken, channelSecret: lineSecret };
    } else if (type === "viber") {
      if (!viberAuthToken) {
        setLoading(false);
        toast.error("Auth token required");
        return;
      }
      credPath = `/api/channels/${id}/credentials`;
      credBody = { authToken: viberAuthToken };
    }

    if (credPath && credBody) {
      const cr = await fetch(credPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credBody),
      });
      if (!cr.ok) {
        const err = await cr.json();
        setLoading(false);
        toast.error(err.error || "Credential rejected");
        return;
      }
    }

    setLoading(false);
    router.push(`/dashboard/channels/${id}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect a channel</CardTitle>
        <CardDescription>WhatsApp QR, Telegram BotFather, Messenger Page, LINE, or Viber.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Channel type</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(Object.keys(TYPE_META) as ChannelType[]).map((t) => (
                <label
                  key={t}
                  className={`cursor-pointer rounded-xl border-2 p-3 text-sm ${
                    type === t ? "border-orange-500 bg-orange-50" : "border-neutral-200"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={type === t}
                    onChange={() => changeType(t)}
                  />
                  <div className="font-medium">{TYPE_META[t].label}</div>
                  <div className="text-xs text-neutral-500">{TYPE_META[t].subtitle}</div>
                </label>
              ))}
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
                From{" "}
                <a className="text-orange-600 underline" href="https://t.me/BotFather" target="_blank" rel="noreferrer">
                  @BotFather
                </a>
                : send <code>/newbot</code>, follow prompts, paste token.
              </p>
            </div>
          )}

          {type === "messenger" && (
            <>
              <div>
                <Label>Page Access Token</Label>
                <Input
                  type="password"
                  value={pageAccessToken}
                  onChange={(e) => setPageAccessToken(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Webhook Verify Token (you choose this)</Label>
                <Input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} required />
                <p className="mt-1 text-xs text-neutral-500">
                  Use the same value when configuring the webhook URL in Meta Developer Console.
                </p>
              </div>
            </>
          )}

          {type === "line" && (
            <>
              <div>
                <Label>Channel Access Token (long-lived)</Label>
                <Input
                  type="password"
                  value={lineAccessToken}
                  onChange={(e) => setLineAccessToken(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Channel Secret</Label>
                <Input
                  type="password"
                  value={lineSecret}
                  onChange={(e) => setLineSecret(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {type === "viber" && (
            <div>
              <Label>Bot Auth Token</Label>
              <Input
                type="password"
                value={viberAuthToken}
                onChange={(e) => setViberAuthToken(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-neutral-500">
                From Viber Bot Admin Panel → your bot → Authentication token.
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
            {loading ? "Creating..." : type === "whatsapp" ? "Create channel & scan QR" : `Create ${TYPE_META[type].label} channel`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
