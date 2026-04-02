import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import {
  ArrowLeft, Shield, Users, Gamepad2, Coins, Ban,
  Search, ChevronLeft, ChevronRight, UserX, UserCheck,
  Plus, Minus, BarChart3
} from "lucide-react";

interface DashboardData {
  total_users: number;
  online_users: number;
  total_games: number;
  active_games: number;
  total_coins_in_circulation: number;
  banned_users: number;
}

interface AdminUser {
  id: number;
  username: string;
  display_name: string;
  email: string;
  coins: number;
  gems: number;
  total_games: number;
  games_won: number;
  rating: number;
  is_online: boolean;
  is_banned: boolean;
  is_admin: boolean;
  created_at: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"dashboard" | "users" | "games" | "transactions">("dashboard");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  // Coin adjustment modal
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [coinAmount, setCoinAmount] = useState(0);
  const [coinReason, setCoinReason] = useState("");

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/");
      return;
    }
    loadDashboard();
  }, [user]);

  useEffect(() => {
    if (tab === "users") {
      loadUsers();
    }
  }, [tab, page, searchQuery]);

  const loadDashboard = async () => {
    try {
      const data = await api.get<{ dashboard: DashboardData }>("/api/admin/dashboard");
      setDashboard(data.dashboard);
    } catch {
      // Not admin
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ users: AdminUser[]; total: number }>(
        `/api/admin/users?page=${page}&search=${searchQuery}`
      );
      setUsers(data.users);
      setTotalUsers(data.total);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId: number, reason: string) => {
    await api.post("/api/admin/ban", { user_id: userId, reason });
    loadUsers();
  };

  const handleUnban = async (userId: number) => {
    await api.post("/api/admin/unban", { user_id: userId });
    loadUsers();
  };

  const handleAdjustCoins = async () => {
    if (!selectedUser) return;
    await api.post("/api/admin/adjust-coins", {
      user_id: selectedUser.id,
      amount: coinAmount,
      reason: coinReason || "Admin adjustment",
    });
    setShowCoinModal(false);
    setCoinAmount(0);
    setCoinReason("");
    loadUsers();
  };

  const handleMakeAdmin = async (userId: number) => {
    await api.post("/api/admin/make-admin", { user_id: userId });
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <Shield className="text-red-400" size={24} />
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 mb-6">
          {([
            { key: "dashboard", label: "Dashboard", icon: <BarChart3 size={16} /> },
            { key: "users", label: "Users", icon: <Users size={16} /> },
            { key: "games", label: "Games", icon: <Gamepad2 size={16} /> },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === t.key ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && tab !== "dashboard" && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Dashboard Tab */}
        {tab === "dashboard" && dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DashCard label="Total Users" value={dashboard.total_users} icon={<Users size={24} />} color="text-blue-400" />
            <DashCard label="Online Users" value={dashboard.online_users} icon={<Users size={24} />} color="text-green-400" />
            <DashCard label="Total Games" value={dashboard.total_games} icon={<Gamepad2 size={24} />} color="text-purple-400" />
            <DashCard label="Active Games" value={dashboard.active_games} icon={<Gamepad2 size={24} />} color="text-amber-400" />
            <DashCard label="Coins in Circulation" value={dashboard.total_coins_in_circulation.toLocaleString()} icon={<Coins size={24} />} color="text-yellow-400" />
            <DashCard label="Banned Users" value={dashboard.banned_users} icon={<Ban size={24} />} color="text-red-400" />
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            {/* User List */}
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="bg-gray-900/60 rounded-xl border border-gray-700/50 p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    u.is_banned ? "bg-red-500/20" : u.is_online ? "bg-green-500/20" : "bg-gray-800"
                  }`}>
                    {u.is_banned ? "🚫" : u.is_admin ? "👑" : "👤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-semibold truncate">{u.display_name}</span>
                      <span className="text-gray-500 text-xs">@{u.username}</span>
                      {u.is_banned && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Banned</span>}
                      {u.is_admin && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Admin</span>}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      🪙 {u.coins} · 🎮 {u.total_games} games · 🏆 {u.games_won} wins · ⭐ {Math.round(u.rating)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Adjust Coins */}
                    <button
                      onClick={() => { setSelectedUser(u); setShowCoinModal(true); }}
                      className="p-1.5 rounded-lg bg-gray-800 text-amber-400 hover:bg-gray-700 text-xs"
                      title="Adjust Coins"
                    >
                      <Coins size={14} />
                    </button>
                    {/* Ban/Unban */}
                    {!u.is_admin && (
                      <button
                        onClick={() => u.is_banned ? handleUnban(u.id) : handleBan(u.id, "Violation of terms")}
                        className={`p-1.5 rounded-lg text-xs ${
                          u.is_banned
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        }`}
                        title={u.is_banned ? "Unban" : "Ban"}
                      >
                        {u.is_banned ? <UserCheck size={14} /> : <UserX size={14} />}
                      </button>
                    )}
                    {/* Make Admin */}
                    {!u.is_admin && (
                      <button
                        onClick={() => handleMakeAdmin(u.id)}
                        className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs"
                        title="Make Admin"
                      >
                        <Shield size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-gray-400 text-sm">{totalUsers} total users</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-white text-sm">Page {page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={users.length < 20}
                  className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Games Tab */}
        {tab === "games" && (
          <div className="text-center py-20">
            <Gamepad2 size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Game monitoring coming soon</p>
            <p className="text-gray-500 text-sm mt-1">View active and past games from the dashboard</p>
          </div>
        )}
      </div>

      {/* Coin Adjustment Modal */}
      {showCoinModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-white mb-2">Adjust Coins</h2>
            <p className="text-gray-400 text-sm mb-4">
              {selectedUser.display_name} · Current: {selectedUser.coins} 🪙
            </p>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setCoinAmount(coinAmount - 100)}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                <Minus size={18} />
              </button>
              <input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-2 px-4 text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                onClick={() => setCoinAmount(coinAmount + 100)}
                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
              >
                <Plus size={18} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Reason (optional)"
              value={coinReason}
              onChange={(e) => setCoinReason(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCoinModal(false); setCoinAmount(0); setCoinReason(""); }}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustCoins}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-gray-900/60 rounded-2xl border border-gray-700/50 p-6">
      <div className={`${color} mb-3`}>{icon}</div>
      <p className="text-white text-3xl font-bold">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
    </div>
  );
}
