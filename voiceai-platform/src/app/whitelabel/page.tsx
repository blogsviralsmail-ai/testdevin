"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function WhiteLabelPage() {
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
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              White Label <span className="text-[#00d4aa]">Voice AI</span>
            </h1>
            <p className="text-gray-400">
              Talk to our team about reselling VoiceAI Pro under your brand.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-xl border border-[#00d4aa]/30 bg-[#00d4aa]/5 p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Thank you!</h3>
              <p className="text-gray-400">We&apos;ve received your inquiry. Our team will reach out within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-8">
              <div>
                <Label className="text-gray-300">Name *</Label>
                <Input placeholder="John Smith" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" required />
              </div>
              <div>
                <Label className="text-gray-300">Email *</Label>
                <Input type="email" placeholder="john@company.com" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" required />
              </div>
              <div>
                <Label className="text-gray-300">Phone Number *</Label>
                <Input type="tel" placeholder="+1 (555) 000-0000" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" required />
              </div>
              <div>
                <Label className="text-gray-300">Monthly Call Volume *</Label>
                <select className="mt-1 w-full rounded-md border border-white/10 bg-[#0a0f1a] px-3 py-2 text-white">
                  <option>Not sure, just getting started</option>
                  <option>&lt; 1,000 minutes / month</option>
                  <option>1,001 - 5,000 minutes / month</option>
                  <option>5,001 - 20,000 minutes / month</option>
                  <option>20,000+ minutes / month</option>
                </select>
              </div>
              <div>
                <Label className="text-gray-300">Describe your use case *</Label>
                <Textarea
                  placeholder="I have a..."
                  className="mt-1 border-white/10 bg-[#0a0f1a] text-white min-h-[100px]"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">How did you hear about us?</Label>
                <select className="mt-1 w-full rounded-md border border-white/10 bg-[#0a0f1a] px-3 py-2 text-white">
                  <option>Select a channel</option>
                  <option>Instagram</option>
                  <option>LinkedIn</option>
                  <option>Twitter / X</option>
                  <option>Google Search</option>
                  <option>ChatGPT / AI</option>
                  <option>Referral / Word of mouth</option>
                  <option>Other</option>
                </select>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#00d4aa] text-black hover:bg-[#00b894] font-medium"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
