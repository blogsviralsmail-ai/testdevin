"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Globe, Calendar, Workflow, Phone, MessageSquare, Wrench, Search } from "lucide-react";

const categories = [
  { key: "all", label: "All", count: 16 },
  { key: "calendar", label: "Calendar & CRM", count: 4 },
  { key: "automation", label: "Automation", count: 3 },
  { key: "telephony", label: "Telephony", count: 4 },
  { key: "messaging", label: "Messaging", count: 2 },
  { key: "custom", label: "Custom & Tools", count: 3 },
];

const integrations = [
  { name: "Cal.com", desc: "Schedule meetings on your Cal.com calendar from a voice conversation.", category: "calendar", icon: Calendar },
  { name: "Google Calendar", desc: "Read availability and write bookings to Google Calendar.", category: "calendar", icon: Calendar },
  { name: "HubSpot", desc: "Automatically sync post-call data into HubSpot. Contacts, deals, tickets.", category: "calendar", icon: Globe },
  { name: "Salesforce", desc: "Update Salesforce contacts, leads, and opportunities from call outcomes.", category: "calendar", icon: Globe },
  { name: "Zapier", desc: "Bridge to 6,000+ apps using webhooks or the public API.", category: "automation", icon: Workflow },
  { name: "Make", desc: "Wire into Make scenarios with webhooks or the API.", category: "automation", icon: Workflow },
  { name: "n8n", desc: "Connect to self-hostable n8n workflows.", category: "automation", icon: Workflow },
  { name: "Twilio", desc: "Connect Twilio Elastic SIP trunks to your agents.", category: "telephony", icon: Phone },
  { name: "RingCentral", desc: "Connect RingCentral SIP trunks with credential authentication.", category: "telephony", icon: Phone },
  { name: "Vonage", desc: "Connect Vonage SIP trunks with UserKey and Secret authentication.", category: "telephony", icon: Phone },
  { name: "Exotel", desc: "Import Exotel phone numbers and run AI agents on Exotel call flows.", category: "telephony", icon: Phone },
  { name: "Slack", desc: "Send automated alerts and notifications from agents into Slack.", category: "messaging", icon: MessageSquare },
  { name: "WhatsApp", desc: "Run conversational agents on WhatsApp. Phone-linked or WhatsApp Cloud.", category: "messaging", icon: MessageSquare },
  { name: "Custom API", desc: "Connect your agent to any external REST API endpoint.", category: "custom", icon: Wrench },
  { name: "Webhook", desc: "Send post-call payloads to any HTTPS endpoint.", category: "custom", icon: Wrench },
  { name: "Web Search", desc: "Give your agent live web-search capability inside conversations.", category: "custom", icon: Search },
];

const universalConnectors = [
  { title: "Any REST API", desc: "Call any HTTPS endpoint mid-conversation or post-call via the Custom API integration.", icon: Globe },
  { title: "Any SIP Carrier", desc: "Bring any SIP-compatible telephony provider, beyond the listed carriers.", icon: Phone },
  { title: "Any Webhook Target", desc: "Send post-call data to any service that accepts an HTTPS webhook.", icon: Workflow },
];

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = integrations.filter((i) => {
    const matchesCategory = activeCategory === "all" || i.category === activeCategory;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00d4aa] mb-2">Integrations</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Connect to your everyday tools
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Native integrations across CRM, calendars, automation, telephony, and messaging.
              Voice agents read and write wherever your customer data already lives.
            </p>
          </div>

          {/* Universal Connectors */}
          <section className="mb-12">
            <p className="text-center text-sm text-gray-400 mb-6">
              Connect to anything — The named integrations below are the popular ones we&apos;ve made first-class.
              You can reach any other service using one of these universal connectors.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {universalConnectors.map((c) => (
                <div key={c.title} className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 hover:border-[#00d4aa]/30 transition-all">
                  <c.icon className="h-8 w-8 text-[#00d4aa] mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">{c.title}</h3>
                  <p className="text-sm text-gray-400">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${
                  activeCategory === cat.key
                    ? "border-[#00d4aa] bg-[#00d4aa]/10 text-[#00d4aa]"
                    : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat.label} <span className="ml-1 text-xs opacity-60">{cat.count}</span>
              </button>
            ))}

            <div className="relative ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full border border-white/10 bg-[#1a1f2e] py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-[#00d4aa] focus:outline-none w-44"
              />
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((integration) => (
              <Link
                key={integration.name}
                href={`/integrations/${integration.name.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "")}`}
                className="group rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 hover:border-[#00d4aa]/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
                    <integration.icon className="h-6 w-6 text-[#00d4aa]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-[#00d4aa] transition-colors">
                      {integration.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">{integration.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
