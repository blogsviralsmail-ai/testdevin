"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Clock, TrendingUp, Users, Bot, ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardData {
  totalCalls: number;
  completedCalls: number;
  totalDuration: number;
  avgDuration: number;
  totalAgents: number;
}

interface Call {
  id: string;
  from_number: string;
  to_number: string;
  direction: string;
  status: string;
  duration: number;
  created_at: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [analyticsRes, callsRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/calls?limit=5"),
      ]);
      const analytics = await analyticsRes.json();
      const calls = await callsRes.json();
      setData(analytics);
      setRecentCalls(Array.isArray(calls) ? calls : []);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
      </div>
    );
  }

  const stats = [
    { label: "Total Calls", value: data?.totalCalls || 0, icon: Phone, color: "text-blue-400" },
    { label: "Avg Duration", value: `${data?.avgDuration || 0}s`, icon: Clock, color: "text-yellow-400" },
    { label: "Success Rate", value: data?.totalCalls ? `${Math.round(((data?.completedCalls || 0) / data.totalCalls) * 100)}%` : "0%", icon: TrendingUp, color: "text-green-400" },
    { label: "Active Agents", value: data?.totalAgents || 0, icon: Users, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Overview of your voice AI platform</p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
            <Bot className="mr-2 h-4 w-4" /> New Agent
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#1a1f2e] rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <ArrowUpRight className="h-4 w-4 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Setup Guide */}
      {(data?.totalAgents === 0) && (
        <div className="bg-gradient-to-r from-[#00d4aa]/10 to-transparent rounded-xl p-6 border border-[#00d4aa]/20">
          <h3 className="text-white font-semibold mb-3">Get Started</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>1. Go to <Link href="/dashboard/settings" className="text-[#00d4aa] hover:underline">Settings</Link> and add your Twilio & OpenAI API keys</p>
            <p>2. <Link href="/dashboard/numbers" className="text-[#00d4aa] hover:underline">Buy a phone number</Link> from Twilio</p>
            <p>3. <Link href="/dashboard/agents/new" className="text-[#00d4aa] hover:underline">Create an AI agent</Link> with a system prompt</p>
            <p>4. Assign the phone number to the agent and start receiving calls!</p>
          </div>
        </div>
      )}

      {/* Recent Calls */}
      <div className="bg-[#1a1f2e] rounded-xl border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Recent Calls</h2>
          <Link href="/dashboard/calls" className="text-[#00d4aa] text-sm hover:underline">View All</Link>
        </div>
        {recentCalls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No calls yet. Set up your agent and phone number to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentCalls.map((call) => (
              <div key={call.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-[#00d4aa]" />
                  <div>
                    <p className="text-white text-sm">{call.direction === "inbound" ? call.from_number : call.to_number}</p>
                    <p className="text-gray-500 text-xs">{call.direction} - {new Date(call.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  call.status === "completed" ? "bg-green-500/10 text-green-400" :
                  call.status === "in-progress" ? "bg-blue-500/10 text-blue-400" :
                  "bg-gray-500/10 text-gray-400"
                }`}>
                  {call.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
