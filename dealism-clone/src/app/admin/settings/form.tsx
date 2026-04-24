"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [openaiKey, setOpenaiKey] = useState(initial.openai_api_key ?? "");
  const [openaiModel, setOpenaiModel] = useState(initial.openai_model ?? "gpt-4o-mini");
  const [brandName, setBrandName] = useState(initial.brand_name ?? "Dealism");
  const [brandTagline, setBrandTagline] = useState(initial.brand_tagline ?? "Your Best Sales Rep, Now AI.");
  const [razorpayKey, setRazorpayKey] = useState(initial.razorpay_key_id ?? "");
  const [razorpaySecret, setRazorpaySecret] = useState(initial.razorpay_key_secret ?? "");
  const [allowSignups, setAllowSignups] = useState(initial.allow_signups !== "false");
  const [defaultQuota, setDefaultQuota] = useState(initial.default_trial_quota ?? "100");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const payload = [
      { key: "openai_api_key", value: openaiKey, category: "api" },
      { key: "openai_model", value: openaiModel, category: "api" },
      { key: "brand_name", value: brandName, category: "branding" },
      { key: "brand_tagline", value: brandTagline, category: "branding" },
      { key: "razorpay_key_id", value: razorpayKey, category: "api" },
      { key: "razorpay_key_secret", value: razorpaySecret, category: "api" },
      { key: "allow_signups", value: allowSignups ? "true" : "false", category: "general" },
      { key: "default_trial_quota", value: defaultQuota, category: "general" },
    ];
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: payload }),
    });
    setLoading(false);
    if (res.ok) toast.success("Settings saved");
    else toast.error("Failed to save");
  }

  async function testOpenAI() {
    const res = await fetch("/api/admin/settings/test-openai", { method: "POST" });
    const data = await res.json();
    if (res.ok) toast.success(`✓ Working! Available models: ${data.sample}`);
    else toast.error(data.error || "Test failed");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OpenAI</CardTitle>
          <CardDescription>AI brain for your agents. Get a key at platform.openai.com/api-keys.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>API Key</Label>
            <Input type="password" placeholder="sk-..." value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} />
          </div>
          <div>
            <Label>Default Model</Label>
            <select className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm" value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)}>
              <option value="gpt-4o-mini">gpt-4o-mini (cheapest, recommended)</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4-turbo">gpt-4-turbo</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </select>
          </div>
          <Button variant="outline" onClick={testOpenAI}>Test connection</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Razorpay (Payments)</CardTitle>
          <CardDescription>For subscription billing. Optional.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Key ID</Label>
            <Input placeholder="rzp_test_..." value={razorpayKey} onChange={(e) => setRazorpayKey(e.target.value)} />
          </div>
          <div>
            <Label>Key Secret</Label>
            <Input type="password" value={razorpaySecret} onChange={(e) => setRazorpaySecret(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Customize how the platform is presented to users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Brand Name</Label>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allowSignups} onChange={(e) => setAllowSignups(e.target.checked)} />
            <span className="text-sm">Allow public sign-ups</span>
          </label>
          <div>
            <Label>Default trial conversations quota</Label>
            <Input type="number" value={defaultQuota} onChange={(e) => setDefaultQuota(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Button variant="primary" size="lg" onClick={save} disabled={loading}>
        {loading ? "Saving..." : "Save all settings"}
      </Button>
    </div>
  );
}
