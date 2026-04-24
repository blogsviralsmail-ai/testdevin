"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How can I connect my WhatsApp to Dealism?",
    a: "After you register, go to Dashboard → Channels → Connect WhatsApp. Scan the QR code from your phone: open WhatsApp → Settings → Linked Devices → Link a device, and scan. Your agent will start receiving messages immediately.",
  },
  {
    q: "How can I create an agent?",
    a: "Go to Dashboard → Agents → New Agent. Give it a name, describe your business and selling style in plain language, and save. You can then attach knowledge (FAQs, product info) and connect a WhatsApp channel.",
  },
  {
    q: "How do I choose a plan?",
    a: "Start with the 7-day free trial — no credit card needed. If you send <1000 conversations/month, the Starter plan is enough. For growing teams, Pro unlocks 2000 conversations. Enterprise is fully custom.",
  },
  {
    q: "How is the Conversations quota calculated, and can I purchase more?",
    a: "One conversation = one customer interacting with your agent in a 24-hour window (regardless of how many messages they send). You can upgrade anytime from Dashboard → Billing, and unused conversations do not roll over.",
  },
  {
    q: "Does the 7-day free trial include all features?",
    a: "Yes. The trial includes all Pro features: unlimited agents, WhatsApp connect, knowledge base, multilingual support, and analytics. You're capped at 100 trial conversations to prevent abuse.",
  },
  {
    q: "What value does Dealism provide? Who is it for?",
    a: "Dealism is for any business that sells through conversations: e-commerce, clinics, education, agencies, creators, real estate. It replaces slow manual follow-up with a 24/7 AI rep that speaks your brand voice.",
  },
];

export function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-20 bg-white">
      <div className="container-1200 max-w-3xl">
        <h2 className="text-center text-4xl md:text-5xl font-bold">Frequently Asked Questions</h2>
        <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
          {faqs.map((f, i) => (
            <div key={i}>
              <button
                className="w-full flex items-center justify-between py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-lg">{f.q}</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="pb-5 text-neutral-600 leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
