"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Plus, Loader2, RefreshCw } from "lucide-react";

interface PhoneNumber {
  id: string;
  number: string;
  friendly_name: string;
  agent_id: string | null;
  status: string;
  country: string;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
}

export default function NumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [areaCode, setAreaCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [numRes, agentRes] = await Promise.all([
        fetch("/api/numbers"),
        fetch("/api/agents"),
      ]);
      const numData = await numRes.json();
      const agentData = await agentRes.json();
      setNumbers(Array.isArray(numData) ? numData : []);
      setAgents(Array.isArray(agentData) ? agentData : []);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
    setLoading(false);
  }

  async function buyNumber() {
    setBuying(true);
    setError("");
    try {
      const res = await fetch("/api/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buy", area_code: areaCode }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShowBuy(false);
        loadData();
      }
    } catch {
      setError("Failed to buy number. Check your Twilio credentials in Settings.");
    }
    setBuying(false);
  }

  async function syncNumbers() {
    setSyncing(true);
    try {
      const res = await fetch("/api/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (data.numbers) {
        setNumbers(data.numbers);
      }
    } catch (err) {
      console.error("Failed to sync:", err);
    }
    setSyncing(false);
  }

  async function assignAgent(numberId: string, agentId: string) {
    try {
      await fetch("/api/numbers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: numberId, agent_id: agentId || null }),
      });
      loadData();
    } catch (err) {
      console.error("Failed to assign agent:", err);
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
          <h1 className="text-2xl font-bold text-white">Phone Numbers</h1>
          <p className="text-gray-400 mt-1">{numbers.length} number{numbers.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncNumbers} disabled={syncing} className="border-white/20 text-gray-300">
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sync from Twilio
          </Button>
          <Button onClick={() => setShowBuy(true)} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
            <Plus className="mr-2 h-4 w-4" /> Buy Number
          </Button>
        </div>
      </div>

      {showBuy && (
        <div className="bg-[#1a1f2e] rounded-xl p-6 border border-[#00d4aa]/30">
          <h3 className="text-white font-medium mb-4">Buy a New Phone Number</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-gray-400">Area Code (optional)</Label>
              <Input
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                placeholder="e.g., 415"
                className="mt-1 bg-[#0a0f1a] border-white/10 text-white"
              />
            </div>
            <Button onClick={buyNumber} disabled={buying} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
              {buying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buying...</> : "Buy Number"}
            </Button>
            <Button variant="ghost" onClick={() => setShowBuy(false)} className="text-gray-400">Cancel</Button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      )}

      {numbers.length === 0 ? (
        <div className="bg-[#1a1f2e] rounded-xl p-12 text-center border border-white/10">
          <Phone className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No phone numbers yet</h3>
          <p className="text-gray-400 mb-4">Buy a Twilio number or sync existing numbers</p>
        </div>
      ) : (
        <div className="bg-[#1a1f2e] rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm text-gray-400 font-medium">Number</th>
                <th className="px-4 py-3 text-left text-sm text-gray-400 font-medium">Assigned Agent</th>
                <th className="px-4 py-3 text-left text-sm text-gray-400 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm text-gray-400 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {numbers.map((num) => (
                <tr key={num.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#00d4aa]" />
                      <span className="text-white font-mono">{num.number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={num.agent_id || ""}
                      onChange={(e) => assignAgent(num.id, e.target.value)}
                      className="bg-[#0a0f1a] border border-white/10 rounded px-2 py-1 text-sm text-white"
                    >
                      <option value="">No agent assigned</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${num.status === "active" ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}>
                      {num.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(num.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
