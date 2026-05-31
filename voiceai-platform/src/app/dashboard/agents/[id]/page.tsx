"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Bot, Mic, Globe, FileText,
  Play, Settings, BarChart3, Plug, Save, Loader2, CheckCircle, AlertCircle
} from "lucide-react";

const tabs = [
  { id: "config", label: "Configuration", icon: Settings },
  { id: "voice", label: "Voice & Language", icon: Mic },
  { id: "knowledge", label: "Knowledge Base", icon: FileText },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const voiceOptions = [
  { value: "alloy", label: "Alloy (Female)" },
  { value: "echo", label: "Echo (Male)" },
  { value: "fable", label: "Fable (Female, British)" },
  { value: "onyx", label: "Onyx (Male, Deep)" },
  { value: "nova", label: "Nova (Female, Warm)" },
  { value: "shimmer", label: "Shimmer (Female, Soft)" },
];

const languageOptions = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "ja-JP", label: "Japanese" },
  { value: "pt-BR", label: "Portuguese" },
];

const modelOptions = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast & Affordable)" },
  { value: "gpt-4o", label: "GPT-4o (Most Capable)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Budget)" },
];

interface AgentData {
  id: string;
  name: string;
  system_prompt: string;
  greeting_message: string;
  voice: string;
  language: string;
  model: string;
  max_call_duration: number;
  temperature: number;
  status: string;
  use_case: string;
  total_calls: number;
  avg_duration: number;
  created_at: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [activeTab, setActiveTab] = useState("config");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [agent, setAgent] = useState<AgentData | null>(null);

  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [greeting, setGreeting] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [language, setLanguage] = useState("en-US");
  const [model, setModel] = useState("gpt-4o-mini");
  const [maxCallDuration, setMaxCallDuration] = useState(300);
  const [temperature, setTemperature] = useState(0.7);
  const [status, setStatus] = useState(true);

  const loadAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents?id=${agentId}`);
      const data = await res.json();
      if (data && !data.error) {
        setAgent(data);
        setName(data.name || "");
        setSystemPrompt(data.system_prompt || "");
        setGreeting(data.greeting_message || "");
        setVoice(data.voice || "alloy");
        setLanguage(data.language || "en-US");
        setModel(data.model || "gpt-4o-mini");
        setMaxCallDuration(data.max_call_duration || 300);
        setTemperature(data.temperature || 0.7);
        setStatus(data.status === "active");
      }
    } catch (err) {
      console.error("Failed to load agent:", err);
    }
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agentId,
          name,
          system_prompt: systemPrompt,
          greeting_message: greeting,
          voice,
          language,
          model,
          max_call_duration: maxCallDuration,
          temperature,
          status: status ? "active" : "paused",
        }),
      });
      if (res.ok) {
        setSaveStatus("success");
        await loadAgent();
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Agent Not Found</h2>
        <p className="text-gray-400 mb-4">The agent you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard/agents">
          <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">Back to Agents</Button>
        </Link>
      </div>
    );
  }

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
              <h2 className="text-xl font-bold text-white">{name}</h2>
              <span className={`text-xs font-medium ${status ? "text-green-400" : "text-yellow-400"}`}>
                {status ? "Active" : "Paused"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/20 text-gray-300">
            <Play className="mr-2 h-4 w-4" /> Test Agent
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#00d4aa] text-black hover:bg-[#00b894]"
          >
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : saveStatus === "success" ? (
              <><CheckCircle className="mr-2 h-4 w-4" /> Saved!</>
            ) : saveStatus === "error" ? (
              <><AlertCircle className="mr-2 h-4 w-4" /> Error</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Changes</>
            )}
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
                checked={status}
                onCheckedChange={setStatus}
              />
            </div>

            <div>
              <Label className="text-gray-300">Agent Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">System Prompt</Label>
              <p className="text-xs text-gray-500 mt-0.5">Define your agent&apos;s behavior and personality</p>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="mt-2 border-white/10 bg-[#0a0f1a] text-white min-h-[150px]"
              />
            </div>

            <div>
              <Label className="text-gray-300">Greeting Message</Label>
              <Input
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
            <h3 className="font-semibold text-white">Call Settings</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-gray-300">Max Call Duration (seconds)</Label>
                <Input
                  type="number"
                  value={maxCallDuration}
                  onChange={(e) => setMaxCallDuration(parseInt(e.target.value) || 0)}
                  className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Temperature</Label>
                <p className="text-xs text-gray-500 mt-0.5">0 = focused, 1 = creative</p>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)}
                  className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">AI Model</Label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 w-full rounded-md border border-white/10 bg-[#0a0f1a] text-white px-3 py-2 text-sm"
              >
                {modelOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
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
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {voiceOptions.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setVoice(v.value)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    voice === v.value
                      ? "border-[#00d4aa] bg-[#00d4aa]/5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <Mic className="h-4 w-4 text-[#00d4aa]" />
                  <span className="text-sm font-medium text-white">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-300 text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#00d4aa]" /> Language
            </Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {languageOptions.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                    language === lang.value
                      ? "border-[#00d4aa] bg-[#00d4aa]/10 text-[#00d4aa]"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  {lang.label}
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
            { label: "Total Calls", value: agent.total_calls || 0 },
            { label: "Avg Duration", value: `${agent.avg_duration || 0}s` },
            { label: "Use Case", value: agent.use_case || "general" },
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
