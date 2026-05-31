"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe, PhoneOutgoing, PhoneIncoming, Plug, Mic, Phone,
  ArrowRight, Pencil, TestTube, Blocks, Rocket, BarChart3,
  MessageSquare, Sparkles
} from "lucide-react";

const useCases = ["Lead Generation", "Appointments", "Support", "Negotiation", "Collections"];

const capabilities = [
  { icon: Globe, title: "Multi-Language", desc: "Serve users in Hindi, Tamil, Spanish, Japanese, and 30+ more languages" },
  { icon: PhoneOutgoing, title: "Scale Outbound", desc: "Automate lead gen, reminders & collections at scale" },
  { icon: PhoneIncoming, title: "24/7 Inbound", desc: "Handle bookings and inquiries around the clock" },
  { icon: Plug, title: "Connect Stack", desc: "Integrate with CRM, Sheets, Slack, n8n and more" },
  { icon: Mic, title: "Quick Training", desc: "Train AI with your own call recordings & knowledge base" },
  { icon: Phone, title: "Phone Numbers", desc: "Buy Indian (+91) or US (+1) numbers instantly" },
];

const steps = [
  { num: 1, icon: Pencil, title: "Write", desc: "Describe what type of Voice AI assistant you want" },
  { num: 2, icon: TestTube, title: "Test", desc: "Try out your assistant and see how it performs" },
  { num: 3, icon: Blocks, title: "Add Functionalities", desc: "Enhance through chat and drag-and-drop" },
  { num: 4, icon: Rocket, title: "Deploy", desc: "Make your assistant available to your users" },
  { num: 5, icon: BarChart3, title: "Observe & Monitor", desc: "Track performance and make improvements" },
];

const features = [
  {
    title: "Create Voice AI Assistants with Natural Language",
    desc: "Simply describe what you want your Voice AI assistant to do, and we'll build it for you.",
    highlights: [
      { title: "Conversational Creation", desc: "Build your assistant through natural conversation" },
      { title: "Drag-and-Drop Interface", desc: "Fine-tune capabilities with our intuitive editor" },
    ]
  },
  {
    title: "Test & Iterate in Real-Time",
    desc: "Talk to your AI assistant directly in the browser. Adjust personality, tone, and responses instantly.",
    highlights: [
      { title: "Live Voice Testing", desc: "Test your assistant with real voice interactions" },
      { title: "Instant Modifications", desc: "Make changes and test immediately without redeployment" },
    ]
  },
  {
    title: "Deploy Everywhere",
    desc: "One-click deployment to phone numbers, web widgets, WhatsApp, and more.",
    highlights: [
      { title: "Multi-Channel", desc: "Deploy across voice, chat, and messaging platforms" },
      { title: "Instant Go-Live", desc: "Your assistant is live within minutes, not weeks" },
    ]
  },
];

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [activeUseCase, setActiveUseCase] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Navbar />

      {/* Hero */}
      <main className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00d4aa]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-white">Create your </span>
            <span className="text-[#00d4aa] italic">Free</span>
            <br />
            <span className="text-white">Voice AI</span>
            <span className="text-[#00d4aa]"> Assistant</span>
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Build, test, and ship reliable voice AI assistants
          </p>

          <div className="mt-8 mx-auto max-w-2xl">
            <div className="relative rounded-xl border border-white/10 bg-[#1a1f2e]/80 p-1">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your voice AI assistant..."
                className="min-h-[100px] resize-none border-0 bg-transparent text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex items-center justify-between px-3 pb-2">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input type="checkbox" className="rounded border-white/20 bg-transparent text-[#00d4aa]" />
                  Guided Flow
                </label>
                <Link href={prompt ? "/signup" : "#"}>
                  <Button
                    className="bg-[#00d4aa] text-black hover:bg-[#00b894] font-medium"
                    disabled={!prompt}
                  >
                    Create Agent <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Choose from use cases</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {useCases.map((uc) => (
                  <button
                    key={uc}
                    onClick={() => {
                      setActiveUseCase(uc);
                      setPrompt(`Create a voice AI assistant for ${uc.toLowerCase()}`);
                    }}
                    className={`rounded-full border px-4 py-2 text-sm transition-all ${
                      activeUseCase === uc
                        ? "border-[#00d4aa] bg-[#00d4aa]/10 text-[#00d4aa]"
                        : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {uc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Trusted By */}
      <section className="border-y border-white/5 py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-500 mb-8">
            Trusted by leading companies
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-40">
            {["TechCorp", "InnovateCo", "GlobalAI", "DataFlow", "CloudSync", "SmartOps"].map((name) => (
              <span key={name} className="text-lg font-bold text-gray-400">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00d4aa] mb-2">Core Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Why VoiceAI Pro for <span className="text-[#00d4aa]">Voice AI</span>?
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Powerful features to build, deploy, and scale your Voice AI assistants
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="group rounded-xl border border-white/5 bg-[#1a1f2e]/50 p-6 hover:border-[#00d4aa]/30 transition-all"
              >
                <cap.icon className="h-8 w-8 text-[#00d4aa] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{cap.title}</h3>
                <p className="text-sm text-gray-400">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-[#0d1117]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00d4aa] mb-2">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How it Works</h2>
            <p className="mt-3 text-gray-400">
              Create and deploy your Voice AI assistant in five simple steps
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3 space-y-2">
              {steps.map((step, i) => (
                <button
                  key={step.num}
                  onClick={() => setActiveStep(i)}
                  className={`w-full flex items-center gap-4 rounded-lg p-4 text-left transition-all ${
                    activeStep === i
                      ? "bg-[#00d4aa]/10 border border-[#00d4aa]/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    activeStep === i ? "bg-[#00d4aa] text-black" : "bg-white/10 text-gray-400"
                  }`}>
                    {step.num}
                  </span>
                  <div>
                    <h3 className={`font-semibold ${activeStep === i ? "text-[#00d4aa]" : "text-white"}`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-400">{step.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:w-2/3 rounded-xl border border-white/10 bg-[#1a1f2e] p-8 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                {(() => {
                  const ActiveIcon = steps[activeStep].icon;
                  return <ActiveIcon className="h-16 w-16 text-[#00d4aa] mx-auto mb-4" />;
                })()}
                <h3 className="text-xl font-semibold text-white mb-2">{steps[activeStep].title}</h3>
                <p className="text-gray-400 max-w-md">{steps[activeStep].desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl space-y-20">
          {features.map((feature, i) => (
            <div key={i} className={`flex flex-col lg:flex-row gap-12 items-center ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
              <div className="lg:w-1/2">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 mb-6">{feature.desc}</p>
                <div className="space-y-4">
                  {feature.highlights.map((h) => (
                    <div key={h.title} className="flex gap-3">
                      <Sparkles className="h-5 w-5 text-[#00d4aa] mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-white">{h.title}</h4>
                        <p className="text-sm text-gray-400">{h.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-1/2 rounded-xl border border-white/10 bg-[#1a1f2e] p-8 min-h-[300px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-[#00d4aa]/30" />
                  <p className="text-sm">Interactive demo preview</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#0d1117]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to build your <span className="text-[#00d4aa]">Voice AI</span> assistant?
          </h2>
          <p className="text-gray-400 mb-8">
            Start for free. No credit card required. Deploy in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-[#00d4aa] text-black hover:bg-[#00b894] font-medium px-8">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/book-demo">
              <Button size="lg" variant="outline" className="border-white/20 text-gray-300 hover:bg-white/5 px-8">
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
