"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, Check, ArrowUpRight, Download } from "lucide-react";

const currentPlan = {
  name: "Early Deployers",
  price: "$36",
  period: "/month",
  minutesUsed: 342,
  minutesTotal: 588,
  cost: "$0.068/min",
  renewDate: "2024-04-01",
};

const invoices = [
  { id: "INV-001", date: "2024-03-01", amount: "$36.00", status: "paid" },
  { id: "INV-002", date: "2024-02-01", amount: "$36.00", status: "paid" },
  { id: "INV-003", date: "2024-01-01", amount: "$30.00", status: "paid" },
  { id: "INV-004", date: "2023-12-01", amount: "$15.00", status: "paid" },
];

const plans = [
  { name: "Starter", price: "$15", minutes: "~179 min", current: false },
  { name: "Jump Starter", price: "$30", minutes: "~395 min", current: false },
  { name: "Early Deployers", price: "$36", minutes: "~588 min", current: true },
  { name: "Growth", price: "$200", minutes: "~3,571 min", current: false },
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Billing</h2>
        <p className="text-gray-400">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-[#00d4aa]/20 bg-[#00d4aa]/5 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#00d4aa] font-medium">Current Plan</p>
            <h3 className="text-2xl font-bold text-white mt-1">{currentPlan.name}</h3>
            <p className="text-gray-400 mt-1">
              {currentPlan.price}{currentPlan.period} &middot; {currentPlan.cost} &middot; Renews {currentPlan.renewDate}
            </p>
          </div>
          <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
            <ArrowUpRight className="mr-2 h-4 w-4" /> Upgrade Plan
          </Button>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Minutes Used</span>
            <span className="text-sm text-white font-medium">{currentPlan.minutesUsed} / {currentPlan.minutesTotal}</span>
          </div>
          <div className="h-3 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#00d4aa]"
              style={{ width: `${(currentPlan.minutesUsed / currentPlan.minutesTotal) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {currentPlan.minutesTotal - currentPlan.minutesUsed} minutes remaining
          </p>
        </div>
      </div>

      {/* Plans Comparison */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50">
        <div className="border-b border-white/10 p-4">
          <h3 className="font-semibold text-white">Available Plans</h3>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-4 text-center ${
                plan.current ? "border-[#00d4aa]/50 bg-[#00d4aa]/5" : "border-white/10"
              }`}
            >
              <h4 className="font-semibold text-white">{plan.name}</h4>
              <p className="text-xl font-bold text-white mt-1">{plan.price}</p>
              <p className="text-xs text-gray-400">{plan.minutes}</p>
              {plan.current ? (
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#00d4aa]">
                  <Check className="h-3 w-3" /> Current
                </span>
              ) : (
                <Button size="sm" variant="outline" className="mt-3 border-white/20 text-gray-300 w-full">
                  Switch
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
        <h3 className="font-semibold text-white mb-4">Payment Method</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Visa ending in 4242</p>
            <p className="text-xs text-gray-500">Expires 12/2025</p>
          </div>
          <Button size="sm" variant="outline" className="ml-auto border-white/20 text-gray-300">
            Update
          </Button>
        </div>
      </div>

      {/* Invoice History */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50">
        <div className="border-b border-white/10 p-4">
          <h3 className="font-semibold text-white">Invoice History</h3>
        </div>
        <div className="divide-y divide-white/5">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-white">{inv.id}</p>
                <p className="text-xs text-gray-500">{inv.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-white">{inv.amount}</span>
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                  {inv.status}
                </span>
                <Button size="sm" variant="ghost" className="text-gray-400 h-8">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
