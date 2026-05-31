"use client";

import { useState, useEffect } from "react";
import { Phone, Clock, ArrowUpRight, ArrowDownLeft, Loader2, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Call {
  id: string;
  agent_id: string;
  direction: string;
  from_number: string;
  to_number: string;
  status: string;
  duration: number;
  transcript: string;
  sentiment: string;
  summary: string;
  recording_url: string;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [showDialer, setShowDialer] = useState(false);
  const [dialNumber, setDialNumber] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedFrom, setSelectedFrom] = useState("");
  const [numbers, setNumbers] = useState<{ id: string; number: string }[]>([]);
  const [dialing, setDialing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [callRes, agentRes, numRes] = await Promise.all([
        fetch("/api/calls?limit=100"),
        fetch("/api/agents"),
        fetch("/api/numbers"),
      ]);
      const callData = await callRes.json();
      const agentData = await agentRes.json();
      const numData = await numRes.json();
      setCalls(Array.isArray(callData) ? callData : []);
      setAgents(Array.isArray(agentData) ? agentData : []);
      setNumbers(Array.isArray(numData) ? numData : []);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
    setLoading(false);
  }

  async function makeCall() {
    if (!dialNumber || !selectedAgent || !selectedFrom) return;
    setDialing(true);
    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_number: dialNumber,
          from_number: selectedFrom,
          agent_id: selectedAgent,
        }),
      });
      setShowDialer(false);
      setDialNumber("");
      loadData();
    } catch (err) {
      console.error("Failed to make call:", err);
    }
    setDialing(false);
  }

  function getAgentName(agentId: string) {
    return agents.find((a) => a.id === agentId)?.name || "Unknown Agent";
  }

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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
          <h1 className="text-2xl font-bold text-white">Recent Calls</h1>
          <p className="text-gray-400 mt-1">{calls.length} call{calls.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowDialer(!showDialer)} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
          <PhoneCall className="mr-2 h-4 w-4" /> Make a Call
        </Button>
      </div>

      {showDialer && (
        <div className="bg-[#1a1f2e] rounded-xl p-6 border border-[#00d4aa]/30">
          <h3 className="text-white font-medium mb-4">Outbound Call</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              value={dialNumber}
              onChange={(e) => setDialNumber(e.target.value)}
              placeholder="+1234567890"
              className="bg-[#0a0f1a] border-white/10 text-white"
            />
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-[#0a0f1a] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="">Select Agent</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select
              value={selectedFrom}
              onChange={(e) => setSelectedFrom(e.target.value)}
              className="bg-[#0a0f1a] border border-white/10 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="">From Number</option>
              {numbers.map((n) => <option key={n.id} value={n.number}>{n.number}</option>)}
            </select>
            <Button onClick={makeCall} disabled={dialing || !dialNumber || !selectedAgent || !selectedFrom} className="bg-[#00d4aa] text-black">
              {dialing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Call"}
            </Button>
          </div>
        </div>
      )}

      {calls.length === 0 ? (
        <div className="bg-[#1a1f2e] rounded-xl p-12 text-center border border-white/10">
          <Phone className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No calls yet</h3>
          <p className="text-gray-400">Calls will appear here once your AI agents start handling them</p>
        </div>
      ) : (
        <div className="space-y-2">
          {calls.map((call) => (
            <div key={call.id} className="bg-[#1a1f2e] rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {call.direction === "inbound" ? (
                    <ArrowDownLeft className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-green-400" />
                  )}
                  <div className="text-left">
                    <p className="text-white text-sm">{call.direction === "inbound" ? call.from_number : call.to_number}</p>
                    <p className="text-gray-500 text-xs">{getAgentName(call.agent_id)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {call.sentiment && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      call.sentiment === "positive" ? "bg-green-500/10 text-green-400" :
                      call.sentiment === "negative" ? "bg-red-500/10 text-red-400" :
                      "bg-gray-500/10 text-gray-400"
                    }`}>
                      {call.sentiment}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    call.status === "completed" ? "bg-green-500/10 text-green-400" :
                    call.status === "in-progress" ? "bg-blue-500/10 text-blue-400" :
                    call.status === "failed" ? "bg-red-500/10 text-red-400" :
                    "bg-gray-500/10 text-gray-400"
                  }`}>
                    {call.status}
                  </span>
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDuration(call.duration)}
                  </span>
                  <span className="text-gray-500 text-xs">{new Date(call.created_at).toLocaleString()}</span>
                </div>
              </button>

              {expandedCall === call.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  {call.summary && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Summary</p>
                      <p className="text-gray-300 text-sm">{call.summary}</p>
                    </div>
                  )}
                  {call.transcript && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Transcript</p>
                      <pre className="text-gray-300 text-sm whitespace-pre-wrap bg-[#0a0f1a] rounded p-3">{call.transcript}</pre>
                    </div>
                  )}
                  {call.recording_url && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Recording</p>
                      <audio controls src={call.recording_url} className="w-full" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
