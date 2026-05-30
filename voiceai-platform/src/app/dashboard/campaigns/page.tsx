"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PhoneOutgoing, Plus, Play, Pause, Upload, X
} from "lucide-react";

const campaigns = [
  {
    id: "1", name: "Q1 Lead Outreach", agent: "Lead Qualifier",
    status: "running", totalCalls: 500, completed: 342, answered: 256,
    successRate: 75, startDate: "2024-03-01",
  },
  {
    id: "2", name: "Payment Reminders March", agent: "Collections Agent",
    status: "running", totalCalls: 200, completed: 89, answered: 67,
    successRate: 75, startDate: "2024-03-05",
  },
  {
    id: "3", name: "Demo Follow-ups", agent: "Appointment Setter",
    status: "paused", totalCalls: 150, completed: 150, answered: 112,
    successRate: 75, startDate: "2024-02-20",
  },
  {
    id: "4", name: "Customer Feedback Survey", agent: "Support Bot",
    status: "completed", totalCalls: 300, completed: 300, answered: 245,
    successRate: 82, startDate: "2024-02-10",
  },
];

export default function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Bulk Call Campaigns</h2>
          <p className="text-gray-400">Create and manage outbound call campaigns</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
          <Plus className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Total Campaigns</p>
          <p className="text-2xl font-bold text-white mt-1">{campaigns.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Running</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{campaigns.filter(c => c.status === "running").length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Total Calls Made</p>
          <p className="text-2xl font-bold text-white mt-1">{campaigns.reduce((a, c) => a + c.completed, 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Avg. Answer Rate</p>
          <p className="text-2xl font-bold text-[#00d4aa] mt-1">77%</p>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <PhoneOutgoing className="h-5 w-5 text-[#00d4aa]" />
                <div>
                  <h3 className="font-semibold text-white">{campaign.name}</h3>
                  <p className="text-xs text-gray-500">Agent: {campaign.agent} &middot; Started: {campaign.startDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  campaign.status === "running" ? "bg-green-500/10 text-green-400" :
                  campaign.status === "paused" ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-gray-500/10 text-gray-400"
                }`}>
                  {campaign.status}
                </span>
                {campaign.status === "running" && (
                  <Button size="sm" variant="outline" className="border-white/20 text-gray-300 h-7">
                    <Pause className="h-3 w-3 mr-1" /> Pause
                  </Button>
                )}
                {campaign.status === "paused" && (
                  <Button size="sm" className="bg-[#00d4aa] text-black hover:bg-[#00b894] h-7">
                    <Play className="h-3 w-3 mr-1" /> Resume
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4 text-sm">
              <div>
                <p className="text-gray-500">Progress</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#00d4aa]"
                      style={{ width: `${(campaign.completed / campaign.totalCalls) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-xs">{Math.round((campaign.completed / campaign.totalCalls) * 100)}%</span>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Calls Made</p>
                <p className="text-white font-medium">{campaign.completed} / {campaign.totalCalls}</p>
              </div>
              <div>
                <p className="text-gray-500">Answered</p>
                <p className="text-white font-medium">{campaign.answered}</p>
              </div>
              <div>
                <p className="text-gray-500">Success Rate</p>
                <p className="text-[#00d4aa] font-medium">{campaign.successRate}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#1a1f2e] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">New Campaign</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <Label className="text-gray-300">Campaign Name *</Label>
              <Input placeholder="e.g., Q2 Lead Outreach" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" />
            </div>
            <div>
              <Label className="text-gray-300">Select Agent *</Label>
              <select className="mt-1 w-full rounded-md border border-white/10 bg-[#0a0f1a] px-3 py-2 text-white">
                <option>Sales Agent</option>
                <option>Lead Qualifier</option>
                <option>Collections Agent</option>
                <option>Appointment Setter</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-300">Upload Contact List *</Label>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-white/20 bg-[#0a0f1a] p-4">
                <Upload className="h-5 w-5 text-gray-500" />
                <p className="text-sm text-gray-400">Upload CSV with phone numbers</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-gray-300">Start Date</Label>
                <Input type="date" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" />
              </div>
              <div>
                <Label className="text-gray-300">Calls Per Hour</Label>
                <Input type="number" defaultValue={50} className="mt-1 border-white/10 bg-[#0a0f1a] text-white" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/20 text-gray-300">
                Cancel
              </Button>
              <Button onClick={() => setShowCreate(false)} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
