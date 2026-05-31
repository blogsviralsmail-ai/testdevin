"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, ArrowLeft, Sparkles } from "lucide-react";

const useCaseTemplates = [
  {
    name: "Lead Generation",
    prompt: "You are a friendly and professional lead generation agent. Your goal is to qualify potential customers by asking about their needs, budget, timeline, and decision-making process. Be conversational but focused on gathering key information. Always be polite and helpful.",
    greeting: "Hi there! I'm calling from [Company]. I'd love to learn more about your business needs. Do you have a moment to chat?",
  },
  {
    name: "Appointment Booking",
    prompt: "You are an appointment scheduling assistant. Help callers book, reschedule, or cancel appointments. Ask for their preferred date, time, and any special requirements. Confirm all details before finalizing.",
    greeting: "Hello! I can help you schedule an appointment. What date and time works best for you?",
  },
  {
    name: "Customer Support",
    prompt: "You are a helpful customer support agent. Listen carefully to customer issues, ask clarifying questions, and provide solutions. If you can't resolve an issue, offer to escalate it. Always be empathetic and professional.",
    greeting: "Thank you for calling! How can I help you today?",
  },
  {
    name: "Sales",
    prompt: "You are a skilled sales agent. Present products/services based on customer needs, handle objections professionally, and guide customers toward making informed purchase decisions. Be persuasive but never pushy.",
    greeting: "Hi! Thank you for your interest. Let me help you find the perfect solution for your needs.",
  },
  {
    name: "Survey / Feedback",
    prompt: "You are a friendly survey agent. Ask customers questions about their experience, collect ratings and feedback. Keep questions brief and thank them for their time. Record their responses accurately.",
    greeting: "Hello! We'd love to hear about your recent experience. Would you mind answering a few quick questions?",
  },
  {
    name: "Custom",
    prompt: "",
    greeting: "Hello! How can I help you today?",
  },
];

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState({
    name: "",
    system_prompt: "",
    greeting_message: "Hello! How can I help you today?",
    voice: "alloy",
    language: "en",
    model: "gpt-4o-mini",
    max_call_duration: 300,
    temperature: 0.7,
    use_case: "general",
  });

  async function handleCreate() {
    if (!agent.name || !agent.system_prompt) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/dashboard/agents/${data.id}`);
      }
    } catch (err) {
      console.error("Failed to create agent:", err);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Agent</h1>
          <p className="text-gray-400 mt-1">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-[#00d4aa]" : "bg-white/10"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="bg-[#1a1f2e] rounded-xl p-6 border border-white/10 space-y-6">
          <h2 className="text-lg font-semibold text-white">Choose a Use Case</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {useCaseTemplates.map((template) => (
              <button
                key={template.name}
                onClick={() => {
                  setAgent({
                    ...agent,
                    use_case: template.name.toLowerCase().replace(/ /g, "_"),
                    system_prompt: template.prompt,
                    greeting_message: template.greeting,
                  });
                  setStep(2);
                }}
                className="p-4 rounded-lg border border-white/10 hover:border-[#00d4aa]/50 bg-[#0a0f1a] text-left transition-colors"
              >
                <Sparkles className="h-5 w-5 text-[#00d4aa] mb-2" />
                <p className="text-white font-medium text-sm">{template.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-[#1a1f2e] rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Agent Details</h2>
          <div>
            <Label className="text-gray-400">Agent Name</Label>
            <Input
              value={agent.name}
              onChange={(e) => setAgent({ ...agent, name: e.target.value })}
              placeholder="e.g., Sales Agent, Support Bot"
              className="mt-1 bg-[#0a0f1a] border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-400">System Prompt (Agent Instructions)</Label>
            <Textarea
              value={agent.system_prompt}
              onChange={(e) => setAgent({ ...agent, system_prompt: e.target.value })}
              placeholder="Describe how the agent should behave..."
              rows={6}
              className="mt-1 bg-[#0a0f1a] border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-400">Greeting Message</Label>
            <Input
              value={agent.greeting_message}
              onChange={(e) => setAgent({ ...agent, greeting_message: e.target.value })}
              placeholder="What the agent says when answering"
              className="mt-1 bg-[#0a0f1a] border-white/10 text-white"
            />
          </div>
          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(1)} className="text-gray-400">Back</Button>
            <Button onClick={() => setStep(3)} disabled={!agent.name || !agent.system_prompt} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-[#1a1f2e] rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Voice & Model Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Voice</Label>
              <select
                value={agent.voice}
                onChange={(e) => setAgent({ ...agent, voice: e.target.value })}
                className="mt-1 w-full rounded-md bg-[#0a0f1a] border border-white/10 text-white px-3 py-2"
              >
                <option value="alloy">Alloy (Female)</option>
                <option value="echo">Echo (Male)</option>
                <option value="fable">Fable (Female, British)</option>
                <option value="onyx">Onyx (Male, Deep)</option>
                <option value="nova">Nova (Female, Warm)</option>
                <option value="shimmer">Shimmer (Female, Soft)</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-400">Language</Label>
              <select
                value={agent.language}
                onChange={(e) => setAgent({ ...agent, language: e.target.value })}
                className="mt-1 w-full rounded-md bg-[#0a0f1a] border border-white/10 text-white px-3 py-2"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="hi-IN">Hindi</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="ja-JP">Japanese</option>
                <option value="pt-BR">Portuguese</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-400">AI Model</Label>
              <select
                value={agent.model}
                onChange={(e) => setAgent({ ...agent, model: e.target.value })}
                className="mt-1 w-full rounded-md bg-[#0a0f1a] border border-white/10 text-white px-3 py-2"
              >
                <option value="gpt-4o-mini">GPT-4o Mini (Fast & Affordable)</option>
                <option value="gpt-4o">GPT-4o (Most Capable)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-400">Max Call Duration (seconds)</Label>
              <Input
                type="number"
                value={agent.max_call_duration}
                onChange={(e) => setAgent({ ...agent, max_call_duration: parseInt(e.target.value) || 0 })}
                className="mt-1 bg-[#0a0f1a] border-white/10 text-white"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(2)} className="text-gray-400">Back</Button>
            <Button onClick={handleCreate} disabled={saving || !agent.name} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : <><Bot className="mr-2 h-4 w-4" /> Create Agent</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
