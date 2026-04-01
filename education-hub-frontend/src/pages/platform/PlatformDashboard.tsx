import { useState, useEffect } from "react";
import axios from "axios";
import { Building2, Users, Activity, Server } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("platform_token");
}

interface DashboardStats {
  total_tenants: number;
  active_tenants: number;
  inactive_tenants: number;
  total_students: number;
  total_revenue: number;
  remote_installations: number;
}

export default function PlatformDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/platform/dashboard`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    }).then(r => {
      setStats(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  );

  const cards = [
    { label: "Total Tenants", value: stats?.total_tenants || 0, icon: Building2, color: "bg-blue-500" },
    { label: "Active Tenants", value: stats?.active_tenants || 0, icon: Activity, color: "bg-green-500" },
    { label: "Total Students", value: stats?.total_students || 0, icon: Users, color: "bg-purple-500" },
    { label: "Remote Servers", value: stats?.remote_installations || 0, icon: Server, color: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Platform Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="/platform/tenants" className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-700">Manage Tenants</span>
          </a>
          <a href="/platform/tenants?action=create" className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
            <Users className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-700">Create New Tenant</span>
          </a>
          <a href="/platform/installations" className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
            <Server className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-700">Remote Servers</span>
          </a>
        </div>
      </div>
    </div>
  );
}
