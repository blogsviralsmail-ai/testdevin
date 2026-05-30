"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$15",
    period: "/month",
    desc: "Great for quick experimentations.",
    cost: "$0.084/min",
    minutes: "~179 minutes",
    extra: "Existing + $0.009",
    kb: "5 MB",
    popular: false,
  },
  {
    name: "Jump Starter",
    price: "$30",
    period: "/month",
    desc: "Best for building and sharing voice AI demos.",
    cost: "$0.076/min",
    minutes: "~395 minutes",
    extra: "Existing + $0.008",
    kb: "10 MB",
    popular: false,
  },
  {
    name: "Early Deployers",
    price: "$36",
    period: "/month",
    originalPrice: "$40",
    discount: "10% OFF",
    desc: "Best for users doing a POC with a live voice AI agent.",
    cost: "$0.068/min",
    minutes: "~588 minutes",
    extra: "Existing + $0.006",
    kb: "50 MB",
    popular: true,
  },
  {
    name: "Growth",
    price: "$200",
    period: "/month",
    desc: "Best for users scaling post-POC voice AI usage.",
    cost: "$0.056/min",
    minutes: "~3,571 minutes",
    extra: "Existing + $0.005",
    kb: "100 MB",
    popular: false,
  },
];

const agencyPlans = [
  {
    name: "Agency Starter",
    price: "$99",
    period: "/month",
    desc: "For agencies getting started with Voice AI reselling.",
    features: ["Up to 5 sub-accounts", "White-label dashboard", "Custom branding", "Priority support"],
  },
  {
    name: "Agency Pro",
    price: "$299",
    period: "/month",
    desc: "For growing agencies with multiple clients.",
    features: ["Up to 25 sub-accounts", "White-label dashboard", "Custom domain", "API access", "Dedicated account manager"],
    popular: true,
  },
  {
    name: "Agency Enterprise",
    price: "Custom",
    period: "",
    desc: "For large agencies and resellers at scale.",
    features: ["Unlimited sub-accounts", "Full white-label", "Custom integrations", "SLA guarantee", "Volume discounts"],
  },
];

export default function PricingPage() {
  const [tab, setTab] = useState<"plans" | "agency">("plans");

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Pricing</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your business. Start free, scale as you grow, and only pay for what you use.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#00d4aa]" /> No setup fees</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#00d4aa]" /> No platform charges</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#00d4aa]" /> Cancel anytime</span>
            </div>
          </div>

          <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-lg border border-white/10 bg-[#1a1f2e] p-1">
              <button
                onClick={() => setTab("plans")}
                className={`rounded-md px-6 py-2 text-sm font-medium transition-all ${
                  tab === "plans" ? "bg-[#00d4aa] text-black" : "text-gray-400 hover:text-white"
                }`}
              >
                Plans
              </button>
              <button
                onClick={() => setTab("agency")}
                className={`rounded-md px-6 py-2 text-sm font-medium transition-all ${
                  tab === "agency" ? "bg-[#00d4aa] text-black" : "text-gray-400 hover:text-white"
                }`}
              >
                Agency (Resellers)
              </button>
            </div>
          </div>

          {tab === "plans" ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white">Voice AI Pricing</h2>
                <p className="text-sm text-gray-500">Billed monthly</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative rounded-xl border p-6 ${
                      plan.popular
                        ? "border-[#00d4aa]/50 bg-[#00d4aa]/5"
                        : "border-white/10 bg-[#1a1f2e]/50"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-[#00d4aa] px-3 py-1 text-xs font-semibold text-black">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      {plan.originalPrice && (
                        <span className="text-sm text-gray-500 line-through mr-1">{plan.originalPrice}</span>
                      )}
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-sm text-gray-400">{plan.period}</span>
                      {plan.discount && (
                        <span className="ml-2 rounded-full bg-[#00d4aa]/20 px-2 py-0.5 text-xs font-medium text-[#00d4aa]">
                          {plan.discount}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-400">{plan.desc}</p>

                    <div className="mt-6 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cost</span>
                        <span className="font-medium text-white">{plan.cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Minutes</span>
                        <span className="font-medium text-white">{plan.minutes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Extra Usage</span>
                        <span className="font-medium text-white">{plan.extra}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Knowledge base</span>
                        <span className="font-medium text-white">{plan.kb}</span>
                      </div>
                    </div>

                    <Link href="/signup" className="block mt-6">
                      <Button className={`w-full ${
                        plan.popular
                          ? "bg-[#00d4aa] text-black hover:bg-[#00b894]"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Enterprise</h3>
                    <p className="text-sm text-gray-400">
                      Custom pricing — as low as $0.04/min or ₹3.5/min. Launch at scale with volume-based discounts.
                    </p>
                  </div>
                  <Link href="/contact">
                    <Button variant="outline" className="border-[#00d4aa] text-[#00d4aa] hover:bg-[#00d4aa]/10">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#00d4aa] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">Flexible Model Selection</h4>
                    <p className="text-sm text-gray-400">
                      You can use any combination of supported models for your Voice AI agents.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {agencyPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-xl border p-6 ${
                    plan.popular
                      ? "border-[#00d4aa]/50 bg-[#00d4aa]/5"
                      : "border-white/10 bg-[#1a1f2e]/50"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-[#00d4aa] px-3 py-1 text-xs font-semibold text-black">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-gray-400">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">{plan.desc}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-[#00d4aa]" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="block mt-6">
                    <Button className={`w-full ${
                      plan.popular
                        ? "bg-[#00d4aa] text-black hover:bg-[#00b894]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}>
                      {plan.price === "Custom" ? "Contact Us" : "Get Started"}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
