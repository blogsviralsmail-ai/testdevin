"use client";

import Link from "next/link";
import { Bot, Phone, MoreVertical, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const mockAgents = [
  { id: "1", name: "Sales Agent", desc: "Handles inbound sales calls and qualifies leads", calls: 456, status: "active", language: "English", voice: "Rachel", created: "2024-01-15" },
  { id: "2", name: "Support Bot", desc: "24/7 customer support for common inquiries", calls: 328, status: "active", language: "English, Hindi", voice: "James", created: "2024-01-20" },
  { id: "3", name: "Lead Qualifier", desc: "Outbound lead qualification for marketing campaigns", calls: 212, status: "active", language: "English", voice: "Sarah", created: "2024-02-01" },
  { id: "4", name: "Appointment Setter", desc: "Books appointments with prospects automatically", calls: 156, status: "paused", language: "English, Spanish", voice: "Michael", created: "2024-02-10" },
  { id: "5", name: "Collections Agent", desc: "Handles payment reminders and collection calls", calls: 82, status: "active", language: "English", voice: "Emily", created: "2024-03-01" },
];

export default function AgentsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockAgents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Voice AI Agents</h2>
          <p className="text-gray-400">Create and manage your voice AI assistants</p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
            <Plus className="mr-2 h-4 w-4" /> Create Agent
          </Button>
        </Link>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#1a1f2e] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-[#00d4aa] focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent) => (
          <Link
            key={agent.id}
            href={`/dashboard/agents/${agent.id}`}
            className="group rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-5 hover:border-[#00d4aa]/30 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                  <Bot className="h-5 w-5 text-[#00d4aa]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-[#00d4aa] transition-colors">{agent.name}</h3>
                  <span className={`text-xs font-medium ${
                    agent.status === "active" ? "text-green-400" : "text-yellow-400"
                  }`}>
                    {agent.status}
                  </span>
                </div>
              </div>
              <button className="text-gray-500 hover:text-white" onClick={(e) => e.preventDefault()}>
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-400 line-clamp-2">{agent.desc}</p>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {agent.calls} calls
              </span>
              <span>{agent.language}</span>
              <span>Voice: {agent.voice}</span>
            </div>
          </Link>
        ))}

        {/* Create New Card */}
        <Link
          href="/dashboard/agents/new"
          className="group flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-transparent p-5 hover:border-[#00d4aa]/30 transition-all min-h-[180px]"
        >
          <div className="text-center">
            <Plus className="h-8 w-8 text-gray-500 group-hover:text-[#00d4aa] mx-auto mb-2 transition-colors" />
            <p className="text-sm text-gray-500 group-hover:text-white transition-colors">Create New Agent</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
