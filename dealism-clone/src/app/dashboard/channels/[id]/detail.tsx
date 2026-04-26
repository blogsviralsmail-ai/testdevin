"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Channel, Agent } from "@prisma/client";

export function ChannelDetail({ channel, agents }: { channel: Channel & { agent: Agent | null }; agents: Agent[] }) {
  const router = useRouter();
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [status, setStatus] = useState(channel.status);
  const [phone, setPhone] = useState(channel.phoneNumber);
  const [agentId, setAgentId] = useState(channel.agentId ?? "");

  const isTelegram = channel.type === "telegram";

  const poll = useCallback(async () => {
    const res = await fetch(`/api/channels/${channel.id}/status`);
    if (res.ok) {
      const data = await res.json();
      setStatus(data.status);
      setPhone(data.phoneNumber);
      if (data.qrCode) {
        const img = await QRCode.toDataURL(data.qrCode, { width: 300 });
        setQrImage(img);
      } else if (data.status === "connected") {
        setQrImage(null);
      }
    }
  }, [channel.id]);

  useEffect(() => {
    poll();
    const i = setInterval(poll, 3000);
    return () => clearInterval(i);
  }, [poll]);

  async function start() {
    const res = await fetch(`/api/channels/${channel.id}/start`, { method: "POST" });
    if (res.ok) {
      toast.success(isTelegram ? "Connecting Telegram bot..." : "Starting... scan QR code");
      poll();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Failed");
    }
  }

  async function stop() {
    const res = await fetch(`/api/channels/${channel.id}/stop`, { method: "POST" });
    if (res.ok) {
      toast.success("Disconnected");
      setStatus("disconnected");
      setQrImage(null);
    } else toast.error("Failed");
  }

  async function updateAgent(newAgentId: string) {
    setAgentId(newAgentId);
    const res = await fetch(`/api/channels/${channel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: newAgentId || null }),
    });
    if (res.ok) toast.success("Agent updated");
  }

  async function remove() {
    if (!confirm("Delete this channel?")) return;
    const res = await fetch(`/api/channels/${channel.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.push("/dashboard/channels");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{channel.name}</CardTitle>
            <CardDescription>{isTelegram ? "Telegram bot channel" : "WhatsApp channel"}</CardDescription>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status === "connected" ? "bg-green-100 text-green-700" : status === "connecting" ? "bg-yellow-100 text-yellow-700" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Assigned agent</Label>
          <select
            className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
            value={agentId}
            onChange={(e) => updateAgent(e.target.value)}
          >
            <option value="">— None —</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {status !== "connected" ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-8 text-center">
            {!isTelegram && qrImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImage} alt="WhatsApp QR code" className="mx-auto w-56 h-56" />
                <p className="mt-4 text-sm text-neutral-600 max-w-sm mx-auto">
                  Open WhatsApp on your phone → Settings → <b>Linked Devices</b> → <b>Link a device</b>, then scan this code.
                </p>
                <Button variant="outline" onClick={stop} className="mt-4">Cancel</Button>
              </>
            ) : (
              <>
                <p className="text-neutral-600">
                  {isTelegram
                    ? "Click below to start polling Telegram for messages. Customers can DM your bot directly."
                    : "Click below to generate your connection QR code."}
                </p>
                <Button variant="primary" onClick={start} className="mt-4">
                  {isTelegram ? "Start bot" : "Start connection"}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
            <h4 className="font-semibold text-green-900">Connected</h4>
            {phone && (
              <p className="mt-1 text-sm text-green-700">
                {isTelegram ? `@${phone} — share this link: https://t.me/${phone}` : `+${phone}`}
              </p>
            )}
            <Button variant="outline" onClick={stop} className="mt-4">Disconnect</Button>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button variant="destructive" onClick={remove}>Delete channel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
