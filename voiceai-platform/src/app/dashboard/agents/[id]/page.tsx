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
  { value: "auto", label: "Auto-Detect (Multi-Language)" },
  { value: "hi-IN", label: "Hindi (हिन्दी)" },
  { value: "en-IN", label: "English (India)" },
  { value: "en-US", label: "English (US)" },
  { value: "bn-IN", label: "Bengali (বাংলা)" },
  { value: "ta-IN", label: "Tamil (தமிழ்)" },
  { value: "te-IN", label: "Telugu (తెలుగు)" },
  { value: "mr-IN", label: "Marathi (मराठी)" },
  { value: "gu-IN", label: "Gujarati (ગુજરાતી)" },
  { value: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
  { value: "ml-IN", label: "Malayalam (മലയാളം)" },
  { value: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { value: "ur-IN", label: "Urdu (اردو)" },
  { value: "or-IN", label: "Odia (ଓଡ଼ିଆ)" },
  { value: "as-IN", label: "Assamese (অসমীয়া)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "ja-JP", label: "Japanese" },
  { value: "pt-BR", label: "Portuguese" },
  { value: "ar-SA", label: "Arabic" },
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
  const [voiceProvider, setVoiceProvider] = useState<"openai" | "elevenlabs">("openai");
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState("");
  const [elVoices, setElVoices] = useState<{voice_id: string; name: string; category: string}[]>([]);
  const [elVoicesLoading, setElVoicesLoading] = useState(false);
  const [knowledgeDocs, setKnowledgeDocs] = useState<{id: string; name: string; content: string; type: string; created_at: string}[]>([]);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [knowledgeMode, setKnowledgeMode] = useState<"text" | "file">("text");
  const [newKnowledge, setNewKnowledge] = useState({ name: "", content: "" });
  const [savingKnowledge, setSavingKnowledge] = useState(false);

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

  useEffect(() => {
    if (agentId) loadKnowledge();
  }, [agentId]);

  async function loadKnowledge() {
    try {
      const res = await fetch(`/api/knowledge?agent_id=${agentId}`);
      const data = await res.json();
      setKnowledgeDocs(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to load knowledge:", err); }
  }

  async function loadElevenLabsVoices() {
    setElVoicesLoading(true);
    try {
      const res = await fetch("/api/elevenlabs/voices");
      const data = await res.json();
      if (data.voices) setElVoices(data.voices);
    } catch (err) { console.error("Failed to load ElevenLabs voices:", err); }
    setElVoicesLoading(false);
  }

  async function handleAddKnowledge() {
    if (!newKnowledge.name || !newKnowledge.content) return;
    setSavingKnowledge(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, name: newKnowledge.name, content: newKnowledge.content, type: knowledgeMode }),
      });
      if (res.ok) {
        setShowAddKnowledge(false);
        setNewKnowledge({ name: "", content: "" });
        loadKnowledge();
      }
    } catch (err) { console.error("Failed to add knowledge:", err); }
    setSavingKnowledge(false);
  }

  async function handleDeleteKnowledge(id: string) {
    try {
      await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
      loadKnowledge();
    } catch (err) { console.error("Failed to delete:", err); }
  }

  function handleKnowledgeFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewKnowledge(prev => ({ ...prev, name: file.name }));
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewKnowledge(prev => ({ ...prev, content: ev.target?.result as string }));
    };
    reader.readAsText(file);
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const finalVoice = voiceProvider === "elevenlabs" && elevenLabsVoiceId ? `el:${elevenLabsVoiceId}` : voice;
      const res = await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agentId,
          name,
          system_prompt: systemPrompt,
          greeting_message: greeting,
          voice: finalVoice,
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
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-6">
          {/* Voice Provider */}
          <div>
            <Label className="text-gray-300 text-base flex items-center gap-2 mb-3">
              <Mic className="h-4 w-4 text-[#00d4aa]" /> Voice Provider
            </Label>
            <div className="flex gap-3">
              <button
                onClick={() => setVoiceProvider("openai")}
                className={`flex-1 rounded-lg border p-4 text-left transition-all ${
                  voiceProvider === "openai" ? "border-[#00d4aa] bg-[#00d4aa]/5" : "border-white/10 hover:border-white/20"
                }`}
              >
                <p className="text-white font-medium">OpenAI Built-in</p>
                <p className="text-xs text-gray-400 mt-1">6 high-quality voices, multi-language support</p>
              </button>
              <button
                onClick={() => { setVoiceProvider("elevenlabs"); if (elVoices.length === 0) loadElevenLabsVoices(); }}
                className={`flex-1 rounded-lg border p-4 text-left transition-all ${
                  voiceProvider === "elevenlabs" ? "border-[#00d4aa] bg-[#00d4aa]/5" : "border-white/10 hover:border-white/20"
                }`}
              >
                <p className="text-white font-medium">ElevenLabs Custom</p>
                <p className="text-xs text-gray-400 mt-1">Clone your own voice, ultra-realistic</p>
              </button>
            </div>
          </div>

          {/* OpenAI Voice Selection */}
          {voiceProvider === "openai" && (
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
          )}

          {/* ElevenLabs Voice Selection */}
          {voiceProvider === "elevenlabs" && (
            <div>
              <Label className="text-gray-300 text-base flex items-center gap-2">
                <Mic className="h-4 w-4 text-[#00d4aa]" /> ElevenLabs Voice
              </Label>
              <p className="text-xs text-gray-500 mt-1 mb-3">Select from your ElevenLabs voices or enter a custom Voice ID</p>
              {elVoicesLoading ? (
                <div className="flex items-center gap-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading voices...</div>
              ) : elVoices.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {elVoices.map((v) => (
                    <button
                      key={v.voice_id}
                      onClick={() => setElevenLabsVoiceId(v.voice_id)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        elevenLabsVoiceId === v.voice_id
                          ? "border-[#00d4aa] bg-[#00d4aa]/5"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <Mic className="h-4 w-4 text-[#00d4aa]" />
                      <div>
                        <span className="text-sm font-medium text-white">{v.name}</span>
                        <span className="text-xs text-gray-500 block">{v.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No voices found. Add ElevenLabs API key in Settings first, or enter Voice ID below.</p>
              )}
              <div className="mt-3">
                <Label className="text-gray-400 text-sm">Or enter Voice ID manually</Label>
                <Input
                  value={elevenLabsVoiceId}
                  onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                  placeholder="Enter ElevenLabs Voice ID"
                  className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
                />
              </div>
            </div>
          )}

          {/* Language Selection */}
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
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Knowledge Base</h3>
              <p className="text-xs text-gray-500">Add product info, FAQs, docs — agent will use this during calls</p>
            </div>
            <Button onClick={() => setShowAddKnowledge(true)} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
              <FileText className="mr-2 h-4 w-4" /> Add Knowledge
            </Button>
          </div>

          {knowledgeDocs.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-lg">
              <FileText className="h-10 w-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No knowledge added yet</p>
              <p className="text-xs text-gray-500 mt-1">Add text or upload files to train this agent</p>
            </div>
          ) : (
            <div className="space-y-2">
              {knowledgeDocs.map((doc) => (
                <div key={doc.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-white/5 bg-[#0a0f1a] hover:bg-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.content.substring(0, 120)}...</p>
                    <p className="text-xs text-gray-600 mt-1">{doc.type} &middot; {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteKnowledge(doc.id)} className="text-red-400 hover:text-red-300 p-1"><AlertCircle className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}

          {/* Add Knowledge Modal */}
          {showAddKnowledge && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-6 w-full max-w-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Add Knowledge</h3>
                  <button onClick={() => setShowAddKnowledge(false)} className="text-gray-400 hover:text-white">&times;</button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setKnowledgeMode("text")}
                    className={`px-3 py-1.5 rounded-lg text-sm ${knowledgeMode === "text" ? "bg-[#00d4aa] text-black" : "bg-white/5 text-gray-400"}`}
                  >Manual Text</button>
                  <button
                    onClick={() => setKnowledgeMode("file")}
                    className={`px-3 py-1.5 rounded-lg text-sm ${knowledgeMode === "file" ? "bg-[#00d4aa] text-black" : "bg-white/5 text-gray-400"}`}
                  >Upload File</button>
                </div>

                <div>
                  <Label className="text-gray-400">Title / Name</Label>
                  <Input
                    value={newKnowledge.name}
                    onChange={(e) => setNewKnowledge({ ...newKnowledge, name: e.target.value })}
                    placeholder="e.g., Product Price List, FAQ, Company Info"
                    className="mt-1 bg-[#0a0f1a] border-white/10 text-white"
                  />
                </div>

                {knowledgeMode === "text" ? (
                  <div>
                    <Label className="text-gray-400">Content</Label>
                    <Textarea
                      value={newKnowledge.content}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                      placeholder="Paste your product info, FAQ, pricing, company details here..."
                      rows={8}
                      className="mt-1 bg-[#0a0f1a] border-white/10 text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-gray-400">Upload File (.txt, .csv, .md)</Label>
                    <input
                      type="file"
                      accept=".txt,.csv,.md,.text"
                      onChange={handleKnowledgeFileUpload}
                      className="mt-2 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-[#00d4aa] file:text-black hover:file:bg-[#00b894]"
                    />
                    {newKnowledge.content && (
                      <p className="text-xs text-green-400 mt-2">File loaded: {newKnowledge.content.length} characters</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setShowAddKnowledge(false)} className="text-gray-400">Cancel</Button>
                  <Button
                    onClick={handleAddKnowledge}
                    disabled={savingKnowledge || !newKnowledge.name || !newKnowledge.content}
                    className="bg-[#00d4aa] text-black hover:bg-[#00b894]"
                  >
                    {savingKnowledge ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Knowledge</>}
                  </Button>
                </div>
              </div>
            </div>
          )}
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
