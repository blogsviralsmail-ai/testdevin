"use client";

import { useState } from "react";
import { Calendar, Globe, Workflow, Phone, MessageSquare, Wrench, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const integrations = [
  { name: "Google Calendar", desc: "Read availability and write bookings", category: "Calendar & CRM", icon: Calendar, connected: true },
  { name: "HubSpot", desc: "Sync post-call data into HubSpot CRM", category: "Calendar & CRM", icon: Globe, connected: true },
  { name: "Salesforce", desc: "Update contacts and leads from calls", category: "Calendar & CRM", icon: Globe, connected: false },
  { name: "Cal.com", desc: "Schedule meetings from voice calls", category: "Calendar & CRM", icon: Calendar, connected: false },
  { name: "Zapier", desc: "Connect to 6,000+ apps via webhooks", category: "Automation", icon: Workflow, connected: true },
  { name: "Make", desc: "Wire into Make scenarios", category: "Automation", icon: Workflow, connected: false },
  { name: "n8n", desc: "Connect to self-hostable workflows", category: "Automation", icon: Workflow, connected: false },
  { name: "Twilio", desc: "Elastic SIP trunks for telephony", category: "Telephony", icon: Phone, connected: true },
  { name: "RingCentral", desc: "SIP trunks with credential auth", category: "Telephony", icon: Phone, connected: false },
  { name: "Vonage", desc: "SIP trunks with UserKey auth", category: "Telephony", icon: Phone, connected: false },
  { name: "Exotel", desc: "Import phone numbers, AI call flows", category: "Telephony", icon: Phone, connected: false },
  { name: "Slack", desc: "Automated alerts and notifications", category: "Messaging", icon: MessageSquare, connected: true },
  { name: "WhatsApp", desc: "Conversational agents on WhatsApp", category: "Messaging", icon: MessageSquare, connected: false },
  { name: "Custom API", desc: "Connect to any REST API endpoint", category: "Custom & Tools", icon: Wrench, connected: false },
  { name: "Webhook", desc: "Send post-call data to any endpoint", category: "Custom & Tools", icon: Wrench, connected: true },
  { name: "Web Search", desc: "Live web search inside conversations", category: "Custom & Tools", icon: Globe, connected: false },
];

export default function DashboardIntegrationsPage() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? integrations
    : filter === "connected"
    ? integrations.filter((i) => i.connected)
    : integrations.filter((i) => !i.connected);

  const connected = integrations.filter((i) => i.connected).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Integrations</h2>
        <p className="text-gray-400">Connect your tools and services to your voice AI agents</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 px-4 py-2">
          <span className="text-sm text-gray-400">Connected: </span>
          <span className="text-sm font-medium text-[#00d4aa]">{connected}</span>
          <span className="text-sm text-gray-500"> / {integrations.length}</span>
        </div>
        <div className="flex gap-2">
          {["all", "connected", "available"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-all ${
                filter === f
                  ? "border-[#00d4aa] bg-[#00d4aa]/10 text-[#00d4aa]"
                  : "border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((integration) => (
          <div
            key={integration.name}
            className={`rounded-xl border p-5 transition-all ${
              integration.connected
                ? "border-[#00d4aa]/20 bg-[#00d4aa]/5"
                : "border-white/10 bg-[#1a1f2e]/50 hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                <integration.icon className={`h-5 w-5 ${integration.connected ? "text-[#00d4aa]" : "text-gray-400"}`} />
              </div>
              {integration.connected ? (
                <span className="flex items-center gap-1 text-xs font-medium text-[#00d4aa]">
                  <Check className="h-3 w-3" /> Connected
                </span>
              ) : null}
            </div>
            <h3 className="font-semibold text-white">{integration.name}</h3>
            <p className="mt-1 text-sm text-gray-400">{integration.desc}</p>
            <p className="mt-1 text-xs text-gray-500">{integration.category}</p>
            <div className="mt-4">
              {integration.connected ? (
                <Button size="sm" variant="outline" className="border-white/20 text-gray-300 w-full">
                  Configure
                </Button>
              ) : (
                <Button size="sm" className="bg-[#00d4aa] text-black hover:bg-[#00b894] w-full">
                  <Plus className="h-3 w-3 mr-1" /> Connect
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
