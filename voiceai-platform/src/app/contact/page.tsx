"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
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
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Contact Us</h1>
            <p className="text-gray-400">Get in touch with our team for any questions or inquiries.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6">
              <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
                <Mail className="h-8 w-8 text-[#00d4aa] mb-3" />
                <h3 className="font-semibold text-white mb-1">Email</h3>
                <p className="text-sm text-gray-400">support@voiceaipro.com</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
                <Phone className="h-8 w-8 text-[#00d4aa] mb-3" />
                <h3 className="font-semibold text-white mb-1">Phone</h3>
                <p className="text-sm text-gray-400">+1 (555) 000-0000</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
                <MapPin className="h-8 w-8 text-[#00d4aa] mb-3" />
                <h3 className="font-semibold text-white mb-1">Office</h3>
                <p className="text-sm text-gray-400">Your Business Address</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              {submitted ? (
                <div className="rounded-xl border border-[#00d4aa]/30 bg-[#00d4aa]/5 p-8 text-center h-full flex items-center justify-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                    <p className="text-gray-400">Thank you for reaching out. We&apos;ll get back to you shortly.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-8 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-gray-300">First Name *</Label>
                      <Input placeholder="John" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" required />
                    </div>
                    <div>
                      <Label className="text-gray-300">Last Name *</Label>
                      <Input placeholder="Smith" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Email *</Label>
                    <Input type="email" placeholder="john@company.com" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" required />
                  </div>
                  <div>
                    <Label className="text-gray-300">Subject *</Label>
                    <select className="mt-1 w-full rounded-md border border-white/10 bg-[#0a0f1a] px-3 py-2 text-white">
                      <option>General inquiry</option>
                      <option>Pricing enquiry</option>
                      <option>Product question</option>
                      <option>Partnership</option>
                      <option>Enterprise / custom plan</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Message *</Label>
                    <Textarea placeholder="How can we help?" className="mt-1 border-white/10 bg-[#0a0f1a] text-white min-h-[120px]" required />
                  </div>
                  <Button type="submit" className="w-full bg-[#00d4aa] text-black hover:bg-[#00b894]" disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
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
