"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bot, Plus, Phone, Clock, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Agent {
  id: string;
  name: string;
  status: string;
  use_case: string;
  voice: string;
  language: string;
  total_calls: number;
  avg_duration: number;
  created_at: string;
  phone_number_id: string | null;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
    setLoading(false);
  }

  async function deleteAgent(id: string) {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      await fetch(`/api/agents?id=${id}`, { method: "DELETE" });
      setAgents(agents.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete agent:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Agents</h1>
          <p className="text-gray-400 mt-1">{agents.length} agent{agents.length !== 1 ? "s" : ""} created</p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
            <Plus className="mr-2 h-4 w-4" /> Create Agent
          </Button>
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="bg-[#1a1f2e] rounded-xl p-12 text-center border border-white/10">
          <Bot className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No agents yet</h3>
          <p className="text-gray-400 mb-4">Create your first AI agent to start making calls</p>
          <Link href="/dashboard/agents/new">
            <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
              <Plus className="mr-2 h-4 w-4" /> Create Your First Agent
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-[#1a1f2e] rounded-xl p-5 border border-white/10 hover:border-[#00d4aa]/30 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-[#00d4aa]" />
                  </div>
                  <div>
                    <Link href={`/dashboard/agents/${agent.id}`}>
                      <h3 className="text-white font-medium hover:text-[#00d4aa] transition-colors">{agent.name}</h3>
                    </Link>
                    <span className="text-xs text-gray-500 capitalize">{agent.use_case}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${agent.status === "active" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                  {agent.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {agent.total_calls} calls
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {agent.avg_duration}s avg
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Voice: {agent.voice}</span>
                <span>|</span>
                <span>Lang: {agent.language}</span>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <Link href={`/dashboard/agents/${agent.id}`}>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs">
                    Configure
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 text-xs" onClick={() => deleteAgent(agent.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
