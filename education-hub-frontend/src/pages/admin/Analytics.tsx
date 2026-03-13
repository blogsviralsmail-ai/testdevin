import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, IndianRupee, Building2, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import api from "../../lib/api";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<any>({});
  const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
  const [leadConversion, setLeadConversion] = useState<any>({ total: 0, by_status: [], monthly: [], by_source: [], conversion_rate: 0 });
  const [studentGrowth, setStudentGrowth] = useState<any>({ monthly: [], by_university: [], by_course: [], by_branch: [] });
  const [revenue, setRevenue] = useState<any>({ monthly: [], total_collected: 0, total_pending: 0 });
  const [branchPerf, setBranchPerf] = useState<any[]>([]);
  const [counselorPerf, setCounselorPerf] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    api.get("/api/analytics/overview").then(r => setOverview(r.data || {})).catch(() => {});
    api.get("/api/analytics/revenue-trends").then(r => setRevenueTrends(r.data || [])).catch(() => {});
    api.get("/api/analytics/lead-conversion").then(r => setLeadConversion(r.data || {})).catch(() => {});
    api.get("/api/analytics/student-growth").then(r => setStudentGrowth(r.data || {})).catch(() => {});
    api.get("/api/analytics/revenue").then(r => setRevenue(r.data || { monthly: [], total_collected: 0, total_pending: 0 })).catch(() => {});
    api.get("/api/analytics/branch-performance").then(r => setBranchPerf(r.data || [])).catch(() => {});
    api.get("/api/analytics/counselor-performance").then(r => setCounselorPerf(r.data || [])).catch(() => {});
  };

  const statCards = [
    { label: "Total Students", value: overview.total_students || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { label: "Active Students", value: overview.active_students || 0, icon: Users, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
    { label: "Total Revenue", value: `₹${(overview.total_revenue || 0).toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    { label: "Pending Fees", value: `₹${(overview.total_pending || 0).toLocaleString()}`, icon: IndianRupee, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    { label: "This Month Revenue", value: `₹${(overview.this_month_revenue || 0).toLocaleString()}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    { label: "Lead Conversion", value: `${overview.lead_conversion || 0}%`, icon: Target, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
    { label: "Total Leads", value: overview.total_leads || 0, icon: Target, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
    { label: "Universities", value: overview.total_universities || 0, icon: Building2, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6"><BarChart3 className="h-7 w-7 text-blue-600" /> Analytics Dashboard</h1>

      <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {statCards.map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl border ${s.border} p-4 transition-all hover:shadow-md`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-white/80 shadow-sm"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Trends + Student Growth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600" /> Revenue Trends (12 Months)</h2>
              {revenueTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]} />
                    <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#D1FAE5" strokeWidth={2} name="Revenue" />
                    <Area type="monotone" dataKey="students" stroke="#3B82F6" fill="#DBEAFE" strokeWidth={2} name="New Students" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-center py-16">No revenue data yet</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" /> Student Growth</h2>
              {studentGrowth.monthly?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={studentGrowth.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" fill="#22C55E" name="Active" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" fill="#F59E0B" name="Pending" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-center py-16">No student data yet</p>}
            </div>
          </div>

          {/* Lead Conversion + Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Target className="h-5 w-5 text-orange-600" /> Lead Conversion Funnel</h2>
              <p className="text-3xl font-bold text-orange-600 mb-4">{leadConversion.conversion_rate}% <span className="text-sm font-normal text-gray-500">conversion rate</span></p>
              {leadConversion.by_status?.length > 0 ? (
                <div className="space-y-2">
                  {leadConversion.by_status.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-24 text-xs text-gray-600 capitalize font-medium">{s.status}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${leadConversion.total > 0 ? (s.count / leadConversion.total) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-sm font-bold w-10 text-right">{s.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-center py-8">No lead data</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><IndianRupee className="h-5 w-5 text-green-600" /> Revenue Breakdown</h2>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 px-4 py-3 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-xs text-green-600 font-medium">Collected</p>
                  <p className="text-xl font-bold text-green-700">₹{(revenue.total_collected || 0).toLocaleString()}</p>
                </div>
                <div className="flex-1 px-4 py-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-xs text-red-600 font-medium">Pending</p>
                  <p className="text-xl font-bold text-red-700">₹{(revenue.total_pending || 0).toLocaleString()}</p>
                </div>
              </div>
              {revenue.monthly?.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={revenue.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="total" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-center py-4">No data</p>}
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-gray-900 mb-3">By University</h2>
              {studentGrowth.by_university?.length > 0 ? (
                <div className="space-y-2">
                  {studentGrowth.by_university.map((u: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 text-xs truncate">{u.university}</span>
                      <span className="text-sm font-bold">{u.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-center text-sm py-4">No data</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-gray-900 mb-3">By Course</h2>
              {studentGrowth.by_course?.length > 0 ? (
                <div className="space-y-2">
                  {studentGrowth.by_course.map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 text-xs truncate">{c.course}</span>
                      <span className="text-sm font-bold">{c.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-center text-sm py-4">No data</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Lead Sources</h2>
              {leadConversion.by_source?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={leadConversion.by_source} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={60} label={({ source, count }: any) => `${source}: ${count}`}>
                      {leadConversion.by_source.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-center text-sm py-4">No data</p>}
            </div>
          </div>

          {/* Branch + Counselor Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Branch Performance</h2>
              {branchPerf.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={branchPerf} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="branch" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="active" fill="#3B82F6" name="Active" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="this_month" fill="#F59E0B" name="This Month" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-center py-8">No branch data</p>}
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Counselor Performance</h2>
              {counselorPerf.length > 0 ? (
                <div className="space-y-3">
                  {counselorPerf.map((c: any, i: number) => {
                    const rate = c.total_leads > 0 ? Math.round((c.converted / c.total_leads) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-28 text-sm font-medium truncate">{c.counselor}</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-bold w-16 text-right">{rate}% ({c.converted}/{c.total_leads})</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-gray-400 text-center py-8">No counselor data</p>}
            </div>
          </div>
        </div>
    </div>
  );
}
