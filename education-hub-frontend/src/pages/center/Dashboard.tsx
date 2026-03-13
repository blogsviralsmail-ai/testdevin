import { useState, useEffect } from "react";
import api, { getUser } from "../../lib/api";
import { Users, Building2, Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CenterDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    api.get("/api/centers/stats").then(r => {
      setStats(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;

  const cards = [
    { label: "Total Students", value: stats.total_students || 0, icon: Users, color: "bg-blue-500", link: "/center/students" },
    { label: "Own Students", value: stats.own_students || 0, icon: Users, color: "bg-emerald-500", link: "/center/students" },
    { label: "Sub-centers", value: stats.sub_centers || 0, icon: Building2, color: "bg-purple-500", link: "/center/sub-centers" },
    { label: "Total Commission", value: `₹${(stats.total_commission || 0).toLocaleString()}`, icon: Wallet, color: "bg-amber-500", link: "/center/commission" },
    { label: "Paid Commission", value: `₹${(stats.paid_commission || 0).toLocaleString()}`, icon: TrendingUp, color: "bg-green-500", link: "/center/commission" },
    { label: "Pending Commission", value: `₹${(stats.pending_commission || 0).toLocaleString()}`, icon: Wallet, color: "bg-red-500", link: "/center/commission" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.center?.owner_name || user?.name || "Center"}</h1>
        <p className="text-gray-500 text-sm mt-1">Center: {user?.center?.name || ""} | Mobile: {user?.center?.mobile || ""}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.link} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-xl text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View Details</span>
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
