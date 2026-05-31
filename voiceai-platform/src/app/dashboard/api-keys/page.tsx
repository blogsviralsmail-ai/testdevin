"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Copy, Check, Trash2, Plus, Shield } from "lucide-react";

const apiKeys = [
  { id: "1", name: "Production Key", key: "vap_prod_sk_...x8k3", created: "2024-01-15", lastUsed: "2024-03-15", status: "active" },
  { id: "2", name: "Development Key", key: "vap_dev_sk_...m2j7", created: "2024-02-01", lastUsed: "2024-03-14", status: "active" },
  { id: "3", name: "Testing Key", key: "vap_test_sk_...p9a1", created: "2024-03-01", lastUsed: "2024-03-10", status: "active" },
];

export default function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">API Keys</h2>
          <p className="text-gray-400">Manage your API keys for programmatic access</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
          <Plus className="mr-2 h-4 w-4" /> Create API Key
        </Button>
      </div>

      {/* API Info */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-[#00d4aa] mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-white">API Documentation</h3>
            <p className="text-sm text-gray-400 mt-1">
              Use our REST API to manage agents, make calls, and access analytics programmatically.
              Base URL: <code className="text-[#00d4aa]">https://api.voiceaipro.com/v1</code>
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="border-white/20 text-gray-300 h-8">
                View Documentation
              </Button>
              <Button size="sm" variant="outline" className="border-white/20 text-gray-300 h-8">
                Python SDK
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-[#00d4aa]/20 bg-[#00d4aa]/5 p-6 space-y-4">
          <h3 className="font-semibold text-white">Create New API Key</h3>
          <div>
            <Label className="text-gray-300">Key Name *</Label>
            <Input placeholder="e.g., Production Key" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" />
          </div>
          <div>
            <Label className="text-gray-300">Permissions</Label>
            <div className="mt-2 space-y-2">
              {["Read agents", "Write agents", "Make calls", "Read analytics", "Manage billing"].map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" className="rounded border-white/20 bg-transparent text-[#00d4aa]" defaultChecked />
                  {perm}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreate(false)} className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
              Create Key
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/20 text-gray-300">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50">
        <div className="divide-y divide-white/5">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                  <Key className="h-5 w-5 text-[#00d4aa]" />
                </div>
                <div>
                  <p className="font-medium text-white">{apiKey.name}</p>
                  <p className="text-xs text-gray-500">
                    <code className="text-gray-400">{apiKey.key}</code>
                    {" "}&middot; Created: {apiKey.created} &middot; Last used: {apiKey.lastUsed}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-gray-300 h-8"
                  onClick={() => handleCopy(apiKey.id)}
                >
                  {copiedId === apiKey.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-8">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
