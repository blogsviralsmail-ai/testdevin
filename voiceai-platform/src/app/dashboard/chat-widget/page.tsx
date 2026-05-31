"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Copy, Check, Paintbrush } from "lucide-react";

export default function ChatWidgetPage() {
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState({
    enabled: true,
    agent: "Support Bot",
    position: "bottom-right",
    primaryColor: "#00d4aa",
    greeting: "Hi there! How can I help you?",
    showAvatar: true,
  });

  const embedCode = `<script src="https://widget.voiceaipro.com/chat.js"
  data-agent-id="agent_abc123"
  data-position="${config.position}"
  data-color="${config.primaryColor}"
  data-greeting="${config.greeting}">
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Web Chat Widget</h2>
        <p className="text-gray-400">Add a chat widget to your website for visitors to interact with your AI agent</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <div className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Widget Status</h3>
                <p className="text-sm text-gray-400">Enable or disable the chat widget</p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            <div>
              <Label className="text-gray-300">Assigned Agent</Label>
              <select
                value={config.agent}
                onChange={(e) => setConfig({ ...config, agent: e.target.value })}
                className="mt-1 w-full rounded-md border border-white/10 bg-[#0a0f1a] px-3 py-2 text-white"
              >
                <option>Support Bot</option>
                <option>Sales Agent</option>
                <option>Lead Qualifier</option>
              </select>
            </div>

            <div>
              <Label className="text-gray-300">Position</Label>
              <div className="mt-2 flex gap-2">
                {["bottom-right", "bottom-left"].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setConfig({ ...config, position: pos })}
                    className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                      config.position === pos
                        ? "border-[#00d4aa] bg-[#00d4aa]/10 text-[#00d4aa]"
                        : "border-white/10 text-gray-400"
                    }`}
                  >
                    {pos.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Primary Color</Label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="h-10 w-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="border-white/10 bg-[#0a0f1a] text-white w-32"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Greeting Message</Label>
              <Input
                value={config.greeting}
                onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
              />
            </div>

            <Button className="w-full bg-[#00d4aa] text-black hover:bg-[#00b894]">
              Save Changes
            </Button>
          </div>

          {/* Embed Code */}
          <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Embed Code</h3>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-gray-300 h-8"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="rounded-lg bg-[#0a0f1a] p-4 text-sm text-gray-300 overflow-x-auto">
              <code>{embedCode}</code>
            </pre>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-[#00d4aa]" /> Live Preview
          </h3>
          <div className="relative rounded-lg bg-white/5 min-h-[500px] p-4">
            <div className="h-full flex items-end justify-end">
              <div className="w-80">
                <div className="rounded-t-xl border border-white/10 overflow-hidden">
                  <div className="p-4" style={{ backgroundColor: config.primaryColor }}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">AI Assistant</p>
                        <p className="text-xs text-white/70">Online</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1a1f2e] p-4 space-y-3 min-h-[300px]">
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: config.primaryColor + "20" }}>
                        <MessageSquare className="h-3 w-3" style={{ color: config.primaryColor }} />
                      </div>
                      <div className="rounded-lg bg-white/5 px-3 py-2 max-w-[240px]">
                        <p className="text-sm text-gray-300">{config.greeting}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#0d1117] p-3 flex gap-2">
                    <input
                      placeholder="Type a message..."
                      className="flex-1 rounded-lg border border-white/10 bg-[#1a1f2e] px-3 py-2 text-sm text-white placeholder:text-gray-500"
                      disabled
                    />
                    <button
                      className="rounded-lg px-3 py-2 text-white"
                      style={{ backgroundColor: config.primaryColor }}
                      disabled
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
