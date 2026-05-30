"use client";

import { useState } from "react";
import { Phone, Play, Download, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const calls = [
  { id: "1", agent: "Sales Agent", phone: "+1 (555) 123-4567", caller: "John Smith", duration: "3:45", status: "completed", sentiment: "positive", time: "2024-03-15 14:23", summary: "Interested in enterprise plan, requested callback" },
  { id: "2", agent: "Support Bot", phone: "+1 (555) 987-6543", caller: "Jane Doe", duration: "5:12", status: "completed", sentiment: "neutral", time: "2024-03-15 14:10", summary: "Asked about billing issue, resolved" },
  { id: "3", agent: "Lead Qualifier", phone: "+91 98765 43210", caller: "Raj Patel", duration: "2:30", status: "no_answer", sentiment: "n/a", time: "2024-03-15 13:55", summary: "No answer, voicemail left" },
  { id: "4", agent: "Appointment Setter", phone: "+1 (555) 456-7890", caller: "Mike Johnson", duration: "6:18", status: "completed", sentiment: "positive", time: "2024-03-15 13:30", summary: "Appointment booked for March 20" },
  { id: "5", agent: "Collections Agent", phone: "+1 (555) 321-0987", caller: "Sarah Wilson", duration: "1:45", status: "voicemail", sentiment: "n/a", time: "2024-03-15 13:15", summary: "Left payment reminder voicemail" },
  { id: "6", agent: "Sales Agent", phone: "+1 (555) 654-3210", caller: "Bob Brown", duration: "4:22", status: "completed", sentiment: "negative", time: "2024-03-15 12:45", summary: "Not interested at this time" },
  { id: "7", agent: "Support Bot", phone: "+1 (555) 789-0123", caller: "Alice Green", duration: "7:10", status: "completed", sentiment: "positive", time: "2024-03-15 12:20", summary: "Complex issue resolved, customer satisfied" },
  { id: "8", agent: "Lead Qualifier", phone: "+44 20 7123 4567", caller: "David Wilson", duration: "3:05", status: "completed", sentiment: "positive", time: "2024-03-15 11:50", summary: "Qualified lead, passed to sales team" },
];

export default function RecentCallsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  const filtered = calls.filter((c) => {
    const matchesSearch = c.caller.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Recent Calls</h2>
        <p className="text-gray-400">View and analyze all your voice AI call logs</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Total Calls</p>
          <p className="text-2xl font-bold text-white mt-1">{calls.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{calls.filter(c => c.status === "completed").length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Avg Duration</p>
          <p className="text-2xl font-bold text-white mt-1">4:14</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Positive Sentiment</p>
          <p className="text-2xl font-bold text-[#00d4aa] mt-1">62%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#1a1f2e] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-[#00d4aa] focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {["all", "completed", "no_answer", "voicemail"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                statusFilter === s
                  ? "border-[#00d4aa] bg-[#00d4aa]/10 text-[#00d4aa]"
                  : "border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Calls List */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50">
        <div className="divide-y divide-white/5">
          {filtered.map((call) => (
            <div key={call.id}>
              <button
                onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    call.status === "completed" ? "bg-green-500/10" : "bg-gray-500/10"
                  }`}>
                    <Phone className={`h-5 w-5 ${call.status === "completed" ? "text-green-400" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{call.caller}</p>
                    <p className="text-xs text-gray-500">{call.phone} &middot; {call.agent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-400">
                    <Clock className="h-3 w-3" /> {call.duration}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    call.sentiment === "positive" ? "bg-green-500/10 text-green-400" :
                    call.sentiment === "negative" ? "bg-red-500/10 text-red-400" :
                    call.sentiment === "neutral" ? "bg-blue-500/10 text-blue-400" :
                    "bg-gray-500/10 text-gray-400"
                  }`}>
                    {call.sentiment}
                  </span>
                  <span className="text-xs text-gray-500">{call.time}</span>
                </div>
              </button>

              {expandedCall === call.id && (
                <div className="border-t border-white/5 bg-[#0a0f1a]/50 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Call Summary</p>
                    <p className="text-sm text-white">{call.summary}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-white/20 text-gray-300 h-8">
                      <Play className="h-3 w-3 mr-1" /> Play Recording
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/20 text-gray-300 h-8">
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
