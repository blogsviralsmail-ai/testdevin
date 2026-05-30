"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Plus, Globe, MapPin } from "lucide-react";

const ownedNumbers = [
  { id: "1", number: "+1 (555) 123-4567", type: "Local", country: "US", agent: "Sales Agent", status: "active", monthlyCost: "$2.00" },
  { id: "2", number: "+1 (555) 987-6543", type: "Toll-Free", country: "US", agent: "Support Bot", status: "active", monthlyCost: "$5.00" },
  { id: "3", number: "+91 98765 43210", type: "Local", country: "IN", agent: "Lead Qualifier", status: "active", monthlyCost: "$1.50" },
];

const availableNumbers = [
  { number: "+1 (555) 100-2001", type: "Local", country: "US", city: "New York", monthlyCost: "$2.00" },
  { number: "+1 (555) 200-3002", type: "Local", country: "US", city: "Los Angeles", monthlyCost: "$2.00" },
  { number: "+1 (800) 300-4003", type: "Toll-Free", country: "US", city: "National", monthlyCost: "$5.00" },
  { number: "+91 11 1234 5678", type: "Local", country: "IN", city: "Delhi", monthlyCost: "$1.50" },
  { number: "+91 22 8765 4321", type: "Local", country: "IN", city: "Mumbai", monthlyCost: "$1.50" },
  { number: "+44 20 7123 4567", type: "Local", country: "UK", city: "London", monthlyCost: "$3.00" },
];

export default function PhoneNumbersPage() {
  const [showShop, setShowShop] = useState(false);
  const [countryFilter, setCountryFilter] = useState("all");

  const filteredAvailable = countryFilter === "all"
    ? availableNumbers
    : availableNumbers.filter((n) => n.country === countryFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Phone Numbers</h2>
          <p className="text-gray-400">Manage your phone numbers and buy new ones</p>
        </div>
        <Button onClick={() => setShowShop(!showShop)} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
          <Plus className="mr-2 h-4 w-4" /> Buy Number
        </Button>
      </div>

      {/* Owned Numbers */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50">
        <div className="border-b border-white/10 p-4">
          <h3 className="font-semibold text-white">Your Numbers ({ownedNumbers.length})</h3>
        </div>
        <div className="divide-y divide-white/5">
          {ownedNumbers.map((num) => (
            <div key={num.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                  <Phone className="h-5 w-5 text-[#00d4aa]" />
                </div>
                <div>
                  <p className="font-medium text-white">{num.number}</p>
                  <p className="text-xs text-gray-500">{num.type} &middot; {num.country} &middot; Assigned to: {num.agent}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{num.monthlyCost}/mo</span>
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                  {num.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Numbers Shop */}
      {showShop && (
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50">
          <div className="border-b border-white/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#00d4aa]" /> Numbers Shop
            </h3>
            <div className="flex gap-2">
              {["all", "US", "IN", "UK"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCountryFilter(c)}
                  className={`rounded-full border px-3 py-1 text-xs transition-all ${
                    countryFilter === c
                      ? "border-[#00d4aa] bg-[#00d4aa]/10 text-[#00d4aa]"
                      : "border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {c === "all" ? "All" : c}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {filteredAvailable.map((num, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{num.number}</p>
                    <p className="text-xs text-gray-500">{num.type} &middot; {num.country} &middot; {num.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{num.monthlyCost}/mo</span>
                  <Button size="sm" className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
                    Buy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
