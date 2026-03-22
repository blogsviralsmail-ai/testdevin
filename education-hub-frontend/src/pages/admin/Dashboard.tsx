import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Users, Building2, GitBranch, MessageSquare, Wallet, LifeBuoy, Target, TrendingUp, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardData {
  total_students: number;
  active_students: number;
  total_universities: number;
  total_branches: number;
  total_enquiries: number;
  new_enquiries: number;
  total_revenue: number;
  pending_fees: number;
  open_tickets: number;
  pending_payments: number;
  target: { target_count: number; achieved_count: number };
  month_admissions: number;
  recent_students: Array<{ id: number; name: string; university_name: string; created_at: string; status: string }>;
  recent_enquiries: Array<{ id: number; name: string; phone: string; university_name: string; status: string; created_at: string }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get("/api/settings/dashboard").then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

  const stats = [
    { label: "Total Students", value: data.total_students, icon: Users, color: "bg-blue-500" },
    { label: "Universities", value: data.total_universities, icon: Building2, color: "bg-purple-500" },
    { label: "Branches", value: data.total_branches, icon: GitBranch, color: "bg-green-500" },
    { label: "Enquiries", value: data.total_enquiries, icon: MessageSquare, color: "bg-orange-500" },
    { label: "Total Revenue", value: `₹${data.total_revenue.toLocaleString()}`, icon: Wallet, color: "bg-emerald-500" },
    { label: "Pending Fees", value: `₹${data.pending_fees.toLocaleString()}`, icon: TrendingUp, color: "bg-red-500" },
    { label: "Open Tickets", value: data.open_tickets, icon: LifeBuoy, color: "bg-yellow-500" },
    { label: "Pending Approvals", value: data.pending_payments || 0, icon: AlertCircle, color: "bg-amber-500" },
    { label: "This Month", value: data.month_admissions, icon: Target, color: "bg-indigo-500" },
  ];

  const chartData = [
    { name: "Students", value: data.total_students },
    { name: "Active", value: data.active_students },
    { name: "Enquiries", value: data.total_enquiries },
    { name: "New Enquiries", value: data.new_enquiries },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        {data.target.target_count > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-700">
              Monthly Target: <span className="font-bold">{data.month_admissions}/{data.target.target_count}</span> admissions
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className={`${stat.color} p-2.5 rounded-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <div className="overflow-hidden">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Students</h2>
          <div className="space-y-3">
            {data.recent_students.length === 0 ? (
              <p className="text-gray-500 text-sm">No students yet</p>
            ) : (
              data.recent_students.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.university_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {s.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Enquiries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Enquiries</h2>
          <div className="space-y-3">
            {data.recent_enquiries.length === 0 ? (
              <p className="text-gray-500 text-sm">No enquiries yet</p>
            ) : (
              data.recent_enquiries.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{e.name}</p>
                    <p className="text-xs text-gray-500">{e.phone} • {e.university_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${e.status === "new" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                    {e.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
