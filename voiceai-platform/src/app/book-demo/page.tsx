"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Video, Users } from "lucide-react";

export default function BookDemoPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Book a <span className="text-[#00d4aa]">Demo</span>
            </h1>
            <p className="text-gray-400">
              See VoiceAI Pro in action. 15 minutes with our team.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#00d4aa] mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">15 Minutes</h3>
                  <p className="text-sm text-gray-400">Quick, focused demo tailored to your use case</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-[#00d4aa] mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Live Demo</h3>
                  <p className="text-sm text-gray-400">See real voice AI agents in action, not slides</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-[#00d4aa] mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Expert Guidance</h3>
                  <p className="text-sm text-gray-400">Get personalized recommendations for your business</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              {submitted ? (
                <div className="rounded-xl border border-[#00d4aa]/30 bg-[#00d4aa]/5 p-8 text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Demo Booked!</h3>
                  <p className="text-gray-400">We&apos;ll send you a calendar invite shortly. Looking forward to meeting you!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-8 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-gray-300">Name *</Label>
                      <Input placeholder="John Smith" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" required />
                    </div>
                    <div>
                      <Label className="text-gray-300">Company</Label>
                      <Input placeholder="Your Company" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Email *</Label>
                    <Input type="email" placeholder="john@company.com" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" required />
                  </div>
                  <div>
                    <Label className="text-gray-300">Phone</Label>
                    <Input type="tel" placeholder="+1 (555) 000-0000" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" />
                  </div>
                  <div>
                    <Label className="text-gray-300">What are you looking to build? *</Label>
                    <Textarea placeholder="Describe your use case..." className="mt-1 border-white/10 bg-[#0a0f1a] text-white min-h-[100px]" required />
                  </div>
                  <Button type="submit" className="w-full bg-[#00d4aa] text-black hover:bg-[#00b894]" disabled={loading}>
                    {loading ? "Booking..." : "Book a Meeting"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
