"use client";

import Link from "next/link";
import { Bot, Phone, PhoneOutgoing, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

const stats = [
  { label: "Total Agents", value: "5", change: "+2 this month", icon: Bot, trend: "up" },
  { label: "Total Calls", value: "1,234", change: "+18% vs last month", icon: Phone, trend: "up" },
  { label: "Active Campaigns", value: "3", change: "2 running now", icon: PhoneOutgoing, trend: "up" },
  { label: "Avg. Call Duration", value: "4:32", change: "-0:12 vs last month", icon: Clock, trend: "down" },
];

const recentCalls = [
  { id: "1", agent: "Sales Agent", phone: "+1 (555) 123-4567", duration: "3:45", status: "completed", time: "2 min ago" },
  { id: "2", agent: "Support Bot", phone: "+1 (555) 987-6543", duration: "5:12", status: "completed", time: "15 min ago" },
  { id: "3", agent: "Lead Qualifier", phone: "+91 98765 43210", duration: "2:30", status: "no_answer", time: "32 min ago" },
  { id: "4", agent: "Appointment Setter", phone: "+1 (555) 456-7890", duration: "6:18", status: "completed", time: "1 hr ago" },
  { id: "5", agent: "Collections Agent", phone: "+1 (555) 321-0987", duration: "1:45", status: "voicemail", time: "2 hr ago" },
];

const agents = [
  { name: "Sales Agent", calls: 456, status: "active" },
  { name: "Support Bot", calls: 328, status: "active" },
  { name: "Lead Qualifier", calls: 212, status: "active" },
  { name: "Appointment Setter", calls: 156, status: "paused" },
  { name: "Collections Agent", calls: 82, status: "active" },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Welcome back!</h2>
        <p className="text-gray-400">Here&apos;s what&apos;s happening with your voice AI agents.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-5">
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-[#00d4aa]" />
              {stat.trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-green-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-yellow-400" />
              )}
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className="mt-1 text-xs text-gray-500">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Calls */}
        <div className="lg:col-span-3 rounded-xl border border-white/10 bg-[#1a1f2e]/50">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h3 className="font-semibold text-white">Recent Calls</h3>
            <Link href="/dashboard/calls" className="text-sm text-[#00d4aa] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00d4aa]/10">
                    <Phone className="h-4 w-4 text-[#00d4aa]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{call.agent}</p>
                    <p className="text-xs text-gray-500">{call.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{call.duration}</p>
                  <p className="text-xs text-gray-500">{call.time}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  call.status === "completed" ? "bg-green-500/10 text-green-400" :
                  call.status === "no_answer" ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-gray-500/10 text-gray-400"
                }`}>
                  {call.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Agents */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-[#1a1f2e]/50">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h3 className="font-semibold text-white">Your Agents</h3>
            <Link href="/dashboard/agents" className="text-sm text-[#00d4aa] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-white/5">
            {agents.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-[#00d4aa]" />
                  <div>
                    <p className="text-sm font-medium text-white">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.calls} calls</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  agent.status === "active" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                }`}>
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
