"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Save, Trash2, Code, Eye, EyeOff, Copy, Check } from "lucide-react";
import { AdSlot } from "@/types";

const defaultSlots: AdSlot[] = [
  { id: "1", name: "Header Banner", position: "header", code: "", enabled: true },
  { id: "2", name: "Between Pages (After Step 3)", position: "between-3", code: "", enabled: true },
  { id: "3", name: "Between Pages (After Step 6)", position: "between-6", code: "", enabled: true },
  { id: "4", name: "Sidebar Right", position: "sidebar-right", code: "", enabled: false },
  { id: "5", name: "Footer Banner", position: "footer", code: "", enabled: true },
  { id: "6", name: "Matches Page Native", position: "matches-native", code: "", enabled: true },
  { id: "7", name: "Profile Page Interstitial", position: "profile-interstitial", code: "", enabled: false },
];

export default function AdminAds() {
  const [slots, setSlots] = useState<AdSlot[]>(defaultSlots);
  const [adsTxt, setAdsTxt] = useState("google.com, pub-XXXXXXXXXX, DIRECT, f08c47fec0942fa0");
  const [adsenseId, setAdsenseId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const toggleSlot = (id: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const updateCode = (id: string, code: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, code } : s)));
  };

  const deleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const copyPosition = (position: string) => {
    navigator.clipboard.writeText(`<!-- AdSlot: ${position} -->`);
    setCopied(position);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Ad Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure Google AdSense, ad placements, and ads.txt
        </p>
      </div>

      {/* AdSense Config */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-500" />
          Google AdSense Configuration
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              AdSense Publisher ID
            </label>
            <input
              type="text"
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              value={adsenseId}
              onChange={(e) => setAdsenseId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm font-mono"
            />
          </div>
          <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
            <Save className="w-4 h-4" />
            Save AdSense Config
          </button>
        </div>
      </div>

      {/* Ad Slots */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Ad Placement Slots</h2>
          <button className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600">
            <Plus className="w-4 h-4" />
            Add Slot
          </button>
        </div>

        <div className="space-y-4">
          {slots.map((slot, i) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="border border-gray-100 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800 text-sm">{slot.name}</span>
                  <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {slot.position}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyPosition(slot.position)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    title="Copy position tag"
                  >
                    {copied === slot.position ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleSlot(slot.id)}
                    className={`p-1.5 rounded-lg ${slot.enabled ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                  >
                    {slot.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteSlot(slot.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <textarea
                placeholder="Paste your AdSense ad code here..."
                value={slot.code}
                onChange={(e) => updateCode(slot.id, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-xs font-mono bg-gray-50 resize-none"
                rows={3}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ads.txt */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4">ads.txt Editor</h2>
        <textarea
          value={adsTxt}
          onChange={(e) => setAdsTxt(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm font-mono bg-gray-50 resize-none"
          rows={5}
          placeholder="google.com, pub-XXXXXXXXXX, DIRECT, f08c47fec0942fa0"
        />
        <button className="mt-3 flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600">
          <Save className="w-4 h-4" />
          Save ads.txt
        </button>
      </div>
    </div>
  );
}
