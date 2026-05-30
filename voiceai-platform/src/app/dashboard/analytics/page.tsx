"use client";

import { Phone, Clock, TrendingUp, Users, ArrowUpRight } from "lucide-react";

const weeklyData = [
  { day: "Mon", calls: 45 },
  { day: "Tue", calls: 62 },
  { day: "Wed", calls: 38 },
  { day: "Thu", calls: 71 },
  { day: "Fri", calls: 56 },
  { day: "Sat", calls: 24 },
  { day: "Sun", calls: 18 },
];

const topAgents = [
  { name: "Sales Agent", calls: 456, avgDuration: "3:45", successRate: 78 },
  { name: "Support Bot", calls: 328, avgDuration: "5:12", successRate: 92 },
  { name: "Lead Qualifier", calls: 212, avgDuration: "2:30", successRate: 65 },
  { name: "Appointment Setter", calls: 156, avgDuration: "4:10", successRate: 71 },
];

const sentimentData = [
  { label: "Positive", value: 62, color: "bg-green-400" },
  { label: "Neutral", value: 25, color: "bg-blue-400" },
  { label: "Negative", value: 13, color: "bg-red-400" },
];

export default function AnalyticsPage() {
  const maxCalls = Math.max(...weeklyData.map((d) => d.calls));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-gray-400">Track your voice AI agent performance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Calls", value: "1,234", change: "+18%", icon: Phone },
          { label: "Avg Duration", value: "4:32", change: "-5%", icon: Clock },
          { label: "Success Rate", value: "76%", change: "+3%", icon: TrendingUp },
          { label: "Unique Contacts", value: "892", change: "+12%", icon: Users },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-5">
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-[#00d4aa]" />
              <span className="flex items-center gap-1 text-xs text-green-400">
                <ArrowUpRight className="h-3 w-3" /> {stat.change}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Call Volume */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-5">
          <h3 className="font-semibold text-white mb-6">Weekly Call Volume</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {weeklyData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-400">{d.calls}</span>
                <div
                  className="w-full rounded-t-md bg-[#00d4aa]/80 hover:bg-[#00d4aa] transition-colors"
                  style={{ height: `${(d.calls / maxCalls) * 100}%` }}
                />
                <span className="text-xs text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment */}
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-5">
          <h3 className="font-semibold text-white mb-6">Call Sentiment</h3>
          <div className="space-y-4">
            {sentimentData.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{s.label}</span>
                  <span className="text-sm font-medium text-white">{s.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-white/10">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Call Outcomes</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Converted", value: "234" },
                { label: "Follow-up", value: "156" },
                { label: "No Answer", value: "89" },
                { label: "Voicemail", value: "67" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-white/5 p-3">
                  <p className="text-lg font-bold text-white">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50">
        <div className="border-b border-white/10 p-4">
          <h3 className="font-semibold text-white">Agent Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Total Calls</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Avg Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topAgents.map((agent) => (
                <tr key={agent.name} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-sm font-medium text-white">{agent.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{agent.calls}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{agent.avgDuration}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[#00d4aa]" style={{ width: `${agent.successRate}%` }} />
                      </div>
                      <span className="text-sm text-[#00d4aa]">{agent.successRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
