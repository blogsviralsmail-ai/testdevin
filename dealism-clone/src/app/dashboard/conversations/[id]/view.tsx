"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { Conversation, Message, Agent, Channel } from "@prisma/client";

type ConvoWithAll = Conversation & { messages: Message[]; agent: Agent | null; channel: Channel | null };

export function ConversationView({ convo }: { convo: ConvoWithAll }) {
  const router = useRouter();
  const [messages, setMessages] = useState(convo.messages);
  const [autoReply, setAutoReply] = useState(convo.isAutoReply);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/conversations/${convo.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [convo.id]);

  async function toggleAutoReply() {
    const newVal = !autoReply;
    setAutoReply(newVal);
    await fetch(`/api/conversations/${convo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAutoReply: newVal }),
    });
    toast.success(newVal ? "Auto-reply enabled" : "Manual mode");
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${convo.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setSending(false);
    if (!res.ok) {
      toast.error("Failed to send");
      return;
    }
    setText("");
    const data = await res.json();
    setMessages(data.messages);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{convo.contactName || convo.contactNumber}</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">
              via {convo.channel?.name ?? "unknown"} • {convo.agent?.name ?? "no agent"}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoReply} onChange={toggleAutoReply} />
            Auto-reply
          </label>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[500px] overflow-y-auto p-6 space-y-3 bg-neutral-50">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "assistant" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xl rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "assistant"
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                    : "bg-white border border-neutral-200"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className={`mt-1 text-[10px] ${m.role === "assistant" ? "text-white/70" : "text-neutral-400"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form onSubmit={sendMessage} className="flex gap-2 border-t p-4">
          <Input
            placeholder="Type a reply or let AI handle it..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="primary" disabled={sending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
