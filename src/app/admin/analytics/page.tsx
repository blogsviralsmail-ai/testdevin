"use client";

import { useState } from "react";
import { Save, ExternalLink } from "lucide-react";

export default function AdminAnalytics() {
  const [gaId, setGaId] = useState("");
  const [adsenseScript, setAdsenseScript] = useState("");
  const [metaPixel, setMetaPixel] = useState("");
  const [headScripts, setHeadScripts] = useState("");
  const [bodyScripts, setBodyScripts] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Analytics & Tracking</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure Google Analytics, AdSense, Meta Pixel, and custom scripts
        </p>
      </div>

      {/* Google Analytics */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Google Analytics</h2>
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1"
          >
            Open GA <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Measurement ID (GA4)
            </label>
            <input
              type="text"
              placeholder="G-XXXXXXXXXX"
              value={gaId}
              onChange={(e) => setGaId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm font-mono"
            />
          </div>
          <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* AdSense Script */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4">Google AdSense Script</h2>
        <textarea
          value={adsenseScript}
          onChange={(e) => setAdsenseScript(e.target.value)}
          placeholder={'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX" crossorigin="anonymous"></script>'}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-xs font-mono bg-gray-50 resize-none"
          rows={4}
        />
        <button className="mt-3 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Meta Pixel */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Meta Pixel</h2>
          <a
            href="https://business.facebook.com/events_manager2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1"
          >
            Open Events Manager <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Pixel ID
            </label>
            <input
              type="text"
              placeholder="XXXXXXXXXXXXXXXX"
              value={metaPixel}
              onChange={(e) => setMetaPixel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm font-mono"
            />
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Custom Scripts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4">Custom Scripts</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Head Scripts (before &lt;/head&gt;)
            </label>
            <textarea
              value={headScripts}
              onChange={(e) => setHeadScripts(e.target.value)}
              placeholder="Paste any custom scripts for the <head> section..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-xs font-mono bg-gray-50 resize-none"
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Body Scripts (before &lt;/body&gt;)
            </label>
            <textarea
              value={bodyScripts}
              onChange={(e) => setBodyScripts(e.target.value)}
              placeholder="Paste any custom scripts for the <body> section..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-xs font-mono bg-gray-50 resize-none"
              rows={4}
            />
          </div>
          <button className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600">
            <Save className="w-4 h-4" />
            Save All Scripts
          </button>
        </div>
      </div>
    </div>
  );
}
