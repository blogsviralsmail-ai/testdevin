"use client";

import { useState, useEffect, useCallback } from "react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);

  const fetchUser = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-600 text-sm mb-8">Manage your platform settings</p>

      <div className="grid gap-6 max-w-2xl">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={user?.name || ""} className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={user?.email || ""} className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input value={user?.role || ""} className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 capitalize" readOnly />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Platform</span>
              <span className="font-medium">InternPro v1.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Framework</span>
              <span className="font-medium">Next.js + Prisma + SQLite</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Support Email</span>
              <span className="font-medium">support@internpro.com</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Support Phone</span>
              <span className="font-medium">Available in program details</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Credentials</h2>
          <p className="text-sm text-gray-600 mb-4">Use these to test different roles:</p>
          <div className="space-y-2 text-sm">
            {[
              { role: "Admin", email: "admin@internpro.com", pass: "admin123" },
              { role: "Organization", email: "org@internpro.com", pass: "admin123" },
              { role: "Mentor", email: "mentor@internpro.com", pass: "mentor123" },
              { role: "Student", email: "student@internpro.com", pass: "student123" },
            ].map((cred) => (
              <div key={cred.role} className="flex items-center gap-4 py-2 px-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-indigo-600 w-24">{cred.role}</span>
                <span className="text-gray-600">{cred.email}</span>
                <span className="text-gray-400">/ {cred.pass}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
