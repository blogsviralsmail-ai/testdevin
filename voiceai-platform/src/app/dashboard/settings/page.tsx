"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Globe, Paintbrush } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "John Smith",
    email: "john@company.com",
    company: "My Company",
    timezone: "UTC-5 (Eastern)",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    callCompleted: true,
    campaignFinished: true,
    weeklyReport: true,
    billing: true,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-5 w-5 text-[#00d4aa]" />
          <h3 className="font-semibold text-white">Profile</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-gray-300">Full Name</Label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Email</Label>
            <Input
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Company</Label>
            <Input
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              className="mt-1 border-white/10 bg-[#0a0f1a] text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Timezone</Label>
            <select className="mt-1 w-full rounded-md border border-white/10 bg-[#0a0f1a] px-3 py-2 text-white">
              <option>UTC-5 (Eastern)</option>
              <option>UTC-8 (Pacific)</option>
              <option>UTC+0 (GMT)</option>
              <option>UTC+5:30 (IST)</option>
              <option>UTC+9 (JST)</option>
            </select>
          </div>
        </div>

        <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
          Save Profile
        </Button>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="h-5 w-5 text-[#00d4aa]" />
          <h3 className="font-semibold text-white">Notifications</h3>
        </div>

        <div className="space-y-4">
          {[
            { key: "email" as const, label: "Email Notifications", desc: "Receive notifications via email" },
            { key: "callCompleted" as const, label: "Call Completed", desc: "Get notified when a call is completed" },
            { key: "campaignFinished" as const, label: "Campaign Finished", desc: "Get notified when a campaign completes" },
            { key: "weeklyReport" as const, label: "Weekly Report", desc: "Receive weekly analytics summary" },
            { key: "billing" as const, label: "Billing Alerts", desc: "Get notified about billing events" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, [item.key]: checked })
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-5 w-5 text-[#00d4aa]" />
          <h3 className="font-semibold text-white">Security</h3>
        </div>

        <div>
          <Label className="text-gray-300">Change Password</Label>
          <div className="mt-2 space-y-3">
            <Input type="password" placeholder="Current password" className="border-white/10 bg-[#0a0f1a] text-white" />
            <Input type="password" placeholder="New password" className="border-white/10 bg-[#0a0f1a] text-white" />
            <Input type="password" placeholder="Confirm new password" className="border-white/10 bg-[#0a0f1a] text-white" />
          </div>
          <Button className="mt-3 bg-[#00d4aa] text-black hover:bg-[#00b894]">
            Update Password
          </Button>
        </div>

        <div className="pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium text-white mb-2">Two-Factor Authentication</h4>
          <p className="text-xs text-gray-500 mb-3">Add an extra layer of security to your account</p>
          <Button variant="outline" className="border-white/20 text-gray-300">
            Enable 2FA
          </Button>
        </div>
      </div>

      {/* White Label */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Paintbrush className="h-5 w-5 text-[#00d4aa]" />
          <h3 className="font-semibold text-white">Branding</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-gray-300">Company Name</Label>
            <Input defaultValue="VoiceAI Pro" className="mt-1 border-white/10 bg-[#0a0f1a] text-white" />
          </div>
          <div>
            <Label className="text-gray-300">Brand Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" defaultValue="#00d4aa" className="h-10 w-10 rounded cursor-pointer border-0" />
              <Input defaultValue="#00d4aa" className="border-white/10 bg-[#0a0f1a] text-white" />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-gray-300">Logo</Label>
          <div className="mt-2 flex items-center gap-4 rounded-lg border border-dashed border-white/20 bg-[#0a0f1a] p-4">
            <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center">
              <Globe className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Upload your logo</p>
              <p className="text-xs text-gray-500">PNG or SVG, max 2MB</p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto border-white/20 text-gray-300">
              Upload
            </Button>
          </div>
        </div>

        <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
          Save Branding
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-400 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
          Delete Account
        </Button>
      </div>
    </div>
  );
}
