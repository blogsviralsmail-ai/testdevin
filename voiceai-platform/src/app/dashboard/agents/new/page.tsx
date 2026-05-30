"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Mic, Upload, Globe, Sparkles } from "lucide-react";
import Link from "next/link";

const voices = [
  { id: "rachel", name: "Rachel", lang: "English (US)", gender: "Female" },
  { id: "james", name: "James", lang: "English (US)", gender: "Male" },
  { id: "sarah", name: "Sarah", lang: "English (UK)", gender: "Female" },
  { id: "michael", name: "Michael", lang: "English (UK)", gender: "Male" },
  { id: "priya", name: "Priya", lang: "Hindi", gender: "Female" },
  { id: "raj", name: "Raj", lang: "Hindi", gender: "Male" },
  { id: "maria", name: "Maria", lang: "Spanish", gender: "Female" },
  { id: "carlos", name: "Carlos", lang: "Spanish", gender: "Male" },
];

const languages = [
  "English (US)", "English (UK)", "Hindi", "Spanish", "French",
  "German", "Japanese", "Tamil", "Portuguese", "Arabic",
];

const useCaseTemplates = [
  { id: "lead", name: "Lead Generation", prompt: "You are a friendly sales agent who qualifies leads by asking about their needs, budget, and timeline. Be conversational and helpful." },
  { id: "appointment", name: "Appointment Booking", prompt: "You are a professional receptionist who helps callers book appointments. Check available slots, confirm details, and send confirmation." },
  { id: "support", name: "Customer Support", prompt: "You are a helpful customer support agent. Listen to the customer's issue, provide solutions, and escalate to a human if needed." },
  { id: "collection", name: "Collections", prompt: "You are a professional collections agent. Politely remind customers about outstanding payments and help arrange payment plans." },
  { id: "custom", name: "Custom", prompt: "" },
];

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [agentData, setAgentData] = useState({
    name: "",
    useCase: "",
    systemPrompt: "",
    voice: "rachel",
    language: "English (US)",
    greeting: "Hello! How can I help you today?",
  });

  const handleUseCaseSelect = (template: typeof useCaseTemplates[0]) => {
    setAgentData({
      ...agentData,
      useCase: template.id,
      systemPrompt: template.prompt,
    });
  };

  const handleCreate = () => {
    router.push("/dashboard/agents");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
          <p className="text-gray-400">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all ${
              s <= step ? "bg-[#00d4aa]" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
            <div>
              <Label className="text-gray-300 text-base">Agent Name *</Label>
              <Input
                value={agentData.name}
                onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                placeholder="e.g., Sales Agent, Support Bot"
                className="mt-2 border-white/10 bg-[#0a0f1a] text-white text-lg"
              />
            </div>

            <div>
              <Label className="text-gray-300 text-base">Choose a Use Case</Label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {useCaseTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleUseCaseSelect(template)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      agentData.useCase === template.id
                        ? "border-[#00d4aa] bg-[#00d4aa]/5"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <h4 className="font-medium text-white">{template.name}</h4>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {template.prompt || "Write your own custom prompt"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-base">System Prompt *</Label>
              <p className="text-xs text-gray-500 mt-1">Define how your AI agent should behave and respond</p>
              <Textarea
                value={agentData.systemPrompt}
                onChange={(e) => setAgentData({ ...agentData, systemPrompt: e.target.value })}
                placeholder="You are a helpful voice AI assistant that..."
                className="mt-2 border-white/10 bg-[#0a0f1a] text-white min-h-[150px]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!agentData.name || !agentData.systemPrompt}
              className="bg-[#00d4aa] text-black hover:bg-[#00b894]"
            >
              Next: Voice & Language <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
            <div>
              <Label className="text-gray-300 text-base flex items-center gap-2">
                <Mic className="h-4 w-4 text-[#00d4aa]" /> Select Voice
              </Label>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {voices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setAgentData({ ...agentData, voice: voice.id })}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      agentData.voice === voice.id
                        ? "border-[#00d4aa] bg-[#00d4aa]/5"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Mic className="h-4 w-4 text-[#00d4aa]" />
                    <div>
                      <p className="text-sm font-medium text-white">{voice.name}</p>
                      <p className="text-xs text-gray-500">{voice.lang} &middot; {voice.gender}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#00d4aa]" /> Language
              </Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setAgentData({ ...agentData, language: lang })}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                      agentData.language === lang
                        ? "border-[#00d4aa] bg-[#00d4aa]/10 text-[#00d4aa]"
                        : "border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-base">Greeting Message</Label>
              <Input
                value={agentData.greeting}
                onChange={(e) => setAgentData({ ...agentData, greeting: e.target.value })}
                placeholder="Hello! How can I help you today?"
                className="mt-2 border-white/10 bg-[#0a0f1a] text-white"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="border-white/20 text-gray-300">
              Back
            </Button>
            <Button onClick={() => setStep(3)} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
              Next: Knowledge Base <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
            <div>
              <Label className="text-gray-300 text-base">Knowledge Base</Label>
              <p className="text-xs text-gray-500 mt-1">Upload documents to train your agent with custom knowledge</p>
              <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-[#0a0f1a] p-8">
                <Upload className="h-8 w-8 text-gray-500 mb-3" />
                <p className="text-sm text-gray-400 mb-1">Drag & drop files here or click to browse</p>
                <p className="text-xs text-gray-500">Supports PDF, DOCX, TXT, CSV (Max 50MB)</p>
                <Button variant="outline" className="mt-4 border-white/20 text-gray-300">
                  Browse Files
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0a0f1a] p-4">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#00d4aa]" /> Agent Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name</span>
                  <span className="text-white">{agentData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Voice</span>
                  <span className="text-white">{voices.find(v => v.id === agentData.voice)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Language</span>
                  <span className="text-white">{agentData.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Use Case</span>
                  <span className="text-white capitalize">{agentData.useCase || "Custom"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="border-white/20 text-gray-300">
              Back
            </Button>
            <Button onClick={handleCreate} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
              Create Agent <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
