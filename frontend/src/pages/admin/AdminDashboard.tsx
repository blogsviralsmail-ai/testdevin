import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { LayoutDashboard, Gem, FileText, TrendingUp, Eye, Star, LogOut, Crown, FolderOpen } from "lucide-react";
import { getDashboard } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { DashboardStats } from "../../types";

export default function AdminDashboard() {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    getDashboard(token)
      .then((r) => setStats(r.stats))
      .catch(() => { logout(); navigate("/admin/login"); })
      .finally(() => setLoading(false));
  }, [token, navigate, logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = stats ? [
    { label: "कुल कैटेगरी", value: stats.total_categories, icon: FolderOpen, color: "bg-blue-500" },
    { label: "कुल डिज़ाइन", value: stats.total_designs, icon: Gem, color: "bg-yellow-500" },
    { label: "फीचर्ड डिज़ाइन", value: stats.featured_designs, icon: Star, color: "bg-purple-500" },
    { label: "कुल ब्लॉग", value: stats.total_blogs, icon: FileText, color: "bg-green-500" },
    { label: "डिज़ाइन व्यूज़", value: stats.total_views, icon: Eye, color: "bg-pink-500" },
    { label: "ब्लॉग व्यूज़", value: stats.blog_views, icon: TrendingUp, color: "bg-indigo-500" },
  ] : [];

  return (
    <>
      <Helmet><title>Admin Dashboard | आभूषण बाज़ार</title></Helmet>
      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-600" />
              <div>
                <h1 className="font-bold text-gray-800">Admin Panel</h1>
                <p className="text-xs text-gray-500">आभूषण बाज़ार</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {username}</span>
              <Link to="/" className="text-sm text-yellow-700 hover:text-yellow-800">साइट देखें</Link>
              <button onClick={() => { logout(); navigate("/admin/login"); }} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Admin Nav */}
          <nav className="flex flex-wrap gap-2 mb-8">
            {[
              { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
              { to: "/admin/categories", label: "Categories", icon: FolderOpen },
              { to: "/admin/designs", label: "Designs", icon: Gem },
              { to: "/admin/blogs", label: "Blogs", icon: FileText },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border hover:bg-yellow-50 hover:border-yellow-300 transition text-sm font-medium text-gray-700"
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
          </nav>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{card.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/admin/categories"
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition"
            >
              <FolderOpen className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-bold text-gray-800">कैटेगरी प्रबंधन</h3>
              <p className="text-sm text-gray-500 mt-1">कैटेगरी जोड़ें, संपादित करें या हटाएं</p>
            </Link>
            <Link
              to="/admin/designs"
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition"
            >
              <Gem className="w-8 h-8 text-yellow-500 mb-3" />
              <h3 className="font-bold text-gray-800">डिज़ाइन प्रबंधन</h3>
              <p className="text-sm text-gray-500 mt-1">ज्वेलरी डिज़ाइन जोड़ें और प्रबंधित करें</p>
            </Link>
            <Link
              to="/admin/blogs"
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition"
            >
              <FileText className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-bold text-gray-800">ब्लॉग प्रबंधन</h3>
              <p className="text-sm text-gray-500 mt-1">ब्लॉग लेख लिखें और प्रकाशित करें</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
