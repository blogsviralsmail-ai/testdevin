"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Bot, Mic, Globe, FileText,
  Play, Settings, BarChart3, Plug, Save
} from "lucide-react";

const tabs = [
  { id: "config", label: "Configuration", icon: Settings },
  { id: "voice", label: "Voice & Language", icon: Mic },
  { id: "knowledge", label: "Knowledge Base", icon: FileText },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function AgentDetailPage() {
  const [activeTab, setActiveTab] = useState("config");
  const [agent, setAgent] = useState({
    name: "Sales Agent",
    systemPrompt: "You are a friendly sales agent who qualifies leads by asking about their needs, budget, and timeline. Be conversational and helpful. Always ask for the caller's name and company.",
    greeting: "Hello! Thanks for calling. I'm here to help you find the perfect solution. What are you looking for today?",
    voice: "rachel",
    language: "English (US)",
    status: true,
    maxCallDuration: 10,
    endCallPhrases: "goodbye, end call, that's all",
    transferNumber: "+1 (555) 000-0000",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/agents">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/10">
              <Bot className="h-5 w-5 text-[#00d4aa]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <span className={`text-xs font-medium ${agent.status ? "text-green-400" : "text-yellow-400"}`}>
                {agent.status ? "Active" : "Paused"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/20 text-gray-300">
            <Play className="mr-2 h-4 w-4" /> Test Agent
          </Button>
          <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#00d4aa] text-[#00d4aa]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "config" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Agent Status</h3>
                <p className="text-xs text-gray-500">Enable or disable this agent</p>
              </div>
              <Switch
                checked={agent.status}
                onCheckedChange={(checked) => setAgent({ ...agent, status: checked })}
              />
            </div>

            <div>
              <Label className="text-gray-300">Agent Name</Label>
              <Input
                value={agent.name}
                onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">System Prompt</Label>
              <p className="text-xs text-gray-500 mt-0.5">Define your agent&apos;s behavior and personality</p>
              <Textarea
                value={agent.systemPrompt}
                onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
                className="mt-2 border-white/10 bg-[#0a0f1a] text-white min-h-[150px]"
              />
            </div>

            <div>
              <Label className="text-gray-300">Greeting Message</Label>
              <Input
                value={agent.greeting}
                onChange={(e) => setAgent({ ...agent, greeting: e.target.value })}
                className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
            <h3 className="font-semibold text-white">Call Settings</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-gray-300">Max Call Duration (minutes)</Label>
                <Input
                  type="number"
                  value={agent.maxCallDuration}
                  onChange={(e) => setAgent({ ...agent, maxCallDuration: parseInt(e.target.value) })}
                  className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Transfer Number</Label>
                <Input
                  value={agent.transferNumber}
                  onChange={(e) => setAgent({ ...agent, transferNumber: e.target.value })}
                  className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">End Call Phrases</Label>
              <p className="text-xs text-gray-500 mt-0.5">Comma-separated phrases that trigger call end</p>
              <Input
                value={agent.endCallPhrases}
                onChange={(e) => setAgent({ ...agent, endCallPhrases: e.target.value })}
                className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "voice" && (
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
          <div>
            <Label className="text-gray-300 text-base flex items-center gap-2">
              <Mic className="h-4 w-4 text-[#00d4aa]" /> Voice Selection
            </Label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {["Rachel", "James", "Sarah", "Michael", "Priya", "Raj", "Maria", "Carlos"].map((voice) => (
                <button
                  key={voice}
                  onClick={() => setAgent({ ...agent, voice: voice.toLowerCase() })}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    agent.voice === voice.toLowerCase()
                      ? "border-[#00d4aa] bg-[#00d4aa]/5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <Mic className="h-4 w-4 text-[#00d4aa]" />
                  <span className="text-sm font-medium text-white">{voice}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-300 text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#00d4aa]" /> Language
            </Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {["English (US)", "English (UK)", "Hindi", "Spanish", "French", "German", "Japanese", "Tamil"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setAgent({ ...agent, language: lang })}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                    agent.language === lang
                      ? "border-[#00d4aa] bg-[#00d4aa]/10 text-[#00d4aa]"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "knowledge" && (
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Knowledge Base</h3>
            <p className="text-gray-400 mb-4">Upload documents to train this agent with custom knowledge</p>
            <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
              Upload Documents
            </Button>
          </div>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
          <div className="text-center py-8">
            <Plug className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Agent Integrations</h3>
            <p className="text-gray-400 mb-4">Connect this agent to external tools and services</p>
            <Link href="/dashboard/integrations">
              <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
                Manage Integrations
              </Button>
            </Link>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Calls", value: "456" },
            { label: "Avg Duration", value: "3:45" },
            { label: "Success Rate", value: "78%" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-5">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
