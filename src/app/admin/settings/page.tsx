"use client";

import { useState } from "react";
import { Save, Globe, Palette, FileCode, Bot, Map } from "lucide-react";

export default function AdminSettings() {
  const [siteName, setSiteName] = useState("SparkVibe");
  const [tagline, setTagline] = useState("Find Your Spark Through Video Chat");
  const [metaTitle, setMetaTitle] = useState("SparkVibe - Find Your Spark Through Video Chat");
  const [metaDesc, setMetaDesc] = useState(
    "Connect with real people through live HD video calls. Discover your perfect match.",
  );
  const [primaryColor, setPrimaryColor] = useState("#ec4899");
  const [robotsTxt, setRobotsTxt] = useState(
    `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://sparkvibe.com/sitemap.xml`,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Site configuration, SEO, and general settings
        </p>
      </div>

      {/* General */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-pink-500" />
          General Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Site Name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Logo URL</label>
            <input
              type="text"
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Favicon URL</label>
            <input
              type="text"
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
          </div>
        </div>
        <button className="mt-4 flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600">
          <Save className="w-4 h-4" />
          Save General
        </button>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          SEO Settings
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Meta Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{metaTitle.length}/60 characters</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Meta Description
            </label>
            <textarea
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 outline-none text-sm resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-1">{metaDesc.length}/160 characters</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
            <Save className="w-4 h-4" />
            Save SEO
          </button>
        </div>
      </div>

      {/* Colors */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-500" />
          Theme Colors
        </h2>
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono w-28"
              />
            </div>
          </div>
        </div>
        <button className="mt-4 flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600">
          <Save className="w-4 h-4" />
          Save Theme
        </button>
      </div>

      {/* robots.txt */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-green-500" />
          robots.txt
        </h2>
        <textarea
          value={robotsTxt}
          onChange={(e) => setRobotsTxt(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 outline-none text-sm font-mono bg-gray-50 resize-none"
          rows={6}
        />
        <button className="mt-3 flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600">
          <Save className="w-4 h-4" />
          Save robots.txt
        </button>
      </div>

      {/* Sitemap */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-amber-500" />
          Sitemap Generator
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Automatically generate sitemap.xml based on your pages and content.
        </p>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">
            <FileCode className="w-4 h-4" />
            Generate Sitemap
          </button>
          <button className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
            View Current Sitemap
          </button>
        </div>
      </div>
    </div>
  );
}
