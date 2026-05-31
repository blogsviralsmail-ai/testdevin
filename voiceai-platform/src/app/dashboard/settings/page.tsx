"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Key, Phone, Brain, CheckCircle, XCircle, Loader2, Save, Globe } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    TWILIO_ACCOUNT_SID: "",
    TWILIO_AUTH_TOKEN: "",
    OPENAI_API_KEY: "",
    BASE_URL: "",
  });
  const [status, setStatus] = useState<{ twilio: string; openai: string }>({
    twilio: "not_configured",
    openai: "not_configured",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
      if (data.configured) {
        setConfigured(data.configured);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
      }
      if (data.success) {
        loadSettings();
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
    setSaving(false);
  }

  function StatusBadge({ s }: { s: string }) {
    if (s === "connected") return <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle className="h-4 w-4" /> Connected</span>;
    if (s === "invalid") return <span className="flex items-center gap-1 text-red-400 text-sm"><XCircle className="h-4 w-4" /> Invalid</span>;
    return <span className="text-gray-500 text-sm">Not configured</span>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#00d4aa]" />
          Settings
        </h1>
        <p className="text-gray-400 mt-1">Configure your API keys and platform settings</p>
      </div>

      {/* API Keys Section */}
      <div className="bg-[#1a1f2e] rounded-xl p-6 border border-white/10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
          <Key className="h-5 w-5 text-[#00d4aa]" />
          API Keys
        </h2>

        <div className="space-y-6">
          {/* Twilio */}
          <div className="bg-[#0a0f1a] rounded-lg p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="text-white font-medium">Twilio</h3>
                  <p className="text-gray-500 text-sm">Phone numbers & calling</p>
                </div>
              </div>
              <StatusBadge s={configured.includes("TWILIO_ACCOUNT_SID") ? (status.twilio !== "not_configured" ? status.twilio : "connected") : "not_configured"} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Account SID</Label>
                <Input
                  type="text"
                  value={settings.TWILIO_ACCOUNT_SID}
                  onChange={(e) => setSettings({ ...settings, TWILIO_ACCOUNT_SID: e.target.value })}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="mt-1 bg-[#1a1f2e] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">Auth Token</Label>
                <Input
                  type="password"
                  value={settings.TWILIO_AUTH_TOKEN}
                  onChange={(e) => setSettings({ ...settings, TWILIO_AUTH_TOKEN: e.target.value })}
                  placeholder="Enter your auth token"
                  className="mt-1 bg-[#1a1f2e] border-white/10 text-white"
                />
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-2">
              Get these from <a href="https://console.twilio.com" target="_blank" className="text-[#00d4aa] hover:underline">console.twilio.com</a>
            </p>
          </div>

          {/* OpenAI */}
          <div className="bg-[#0a0f1a] rounded-lg p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-green-400" />
                <div>
                  <h3 className="text-white font-medium">OpenAI</h3>
                  <p className="text-gray-500 text-sm">AI conversation engine</p>
                </div>
              </div>
              <StatusBadge s={configured.includes("OPENAI_API_KEY") ? (status.openai !== "not_configured" ? status.openai : "connected") : "not_configured"} />
            </div>

            <div>
              <Label className="text-gray-400">API Key</Label>
              <Input
                type="password"
                value={settings.OPENAI_API_KEY}
                onChange={(e) => setSettings({ ...settings, OPENAI_API_KEY: e.target.value })}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="mt-1 bg-[#1a1f2e] border-white/10 text-white"
              />
            </div>
            <p className="text-gray-600 text-xs mt-2">
              Get this from <a href="https://platform.openai.com/api-keys" target="_blank" className="text-[#00d4aa] hover:underline">platform.openai.com/api-keys</a>
            </p>
          </div>

          {/* Base URL */}
          <div className="bg-[#0a0f1a] rounded-lg p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5 text-purple-400" />
              <div>
                <h3 className="text-white font-medium">Base URL</h3>
                <p className="text-gray-500 text-sm">Your platform&apos;s public URL (for Twilio webhooks)</p>
              </div>
            </div>

            <div>
              <Label className="text-gray-400">URL</Label>
              <Input
                type="url"
                value={settings.BASE_URL}
                onChange={(e) => setSettings({ ...settings, BASE_URL: e.target.value })}
                placeholder="https://calling.kkhsmedia.com"
                className="mt-1 bg-[#1a1f2e] border-white/10 text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-[#00d4aa] text-black hover:bg-[#00b894] font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying & Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save & Verify
              </>
            )}
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#1a1f2e] rounded-xl p-6 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">How it Works</h2>
        <div className="space-y-3 text-gray-400 text-sm">
          <div className="flex gap-3">
            <span className="text-[#00d4aa] font-bold">1.</span>
            <p>Add your Twilio Account SID & Auth Token to enable phone calling</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#00d4aa] font-bold">2.</span>
            <p>Add your OpenAI API Key to power AI conversations</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#00d4aa] font-bold">3.</span>
            <p>Set your Base URL (this site&apos;s public address) for Twilio webhooks</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#00d4aa] font-bold">4.</span>
            <p>Go to Phone Numbers → Buy a number from Twilio</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#00d4aa] font-bold">5.</span>
            <p>Create an AI Agent with a system prompt describing its behavior</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#00d4aa] font-bold">6.</span>
            <p>Assign the phone number to the agent — calls to that number will be handled by AI!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
