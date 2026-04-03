import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

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
    <div className="min-h-screen ludo-bg p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-lg bg-blue-800 border border-blue-400/30 flex items-center justify-center text-white hover:bg-blue-700">
            ←
          </button>
          <h1 className="text-lg font-bold text-white" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>🛡️ ADMIN PANEL</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-blue-900/50 rounded-xl p-1 mb-4 border border-blue-400/20">
          {([
            { key: "dashboard", label: "Dashboard", emoji: "📊" },
            { key: "users", label: "Users", emoji: "👥" },
            { key: "games", label: "Games", emoji: "🎮" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                tab === t.key ? "btn-golden" : "text-blue-200/50 hover:text-white"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && tab !== "dashboard" && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Dashboard Tab */}
        {tab === "dashboard" && dashboard && (
          <div className="grid grid-cols-2 gap-3">
            <DashCard label="Total Users" value={dashboard.total_users} emoji="👥" />
            <DashCard label="Online Users" value={dashboard.online_users} emoji="🟢" />
            <DashCard label="Total Games" value={dashboard.total_games} emoji="🎮" />
            <DashCard label="Active Games" value={dashboard.active_games} emoji="🔴" />
            <DashCard label="Coins in Circulation" value={dashboard.total_coins_in_circulation.toLocaleString()} emoji="🪙" />
            <DashCard label="Banned Users" value={dashboard.banned_users} emoji="🚫" />
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div>
            {/* Search */}
            <div className="relative mb-4">
              <span className="absolute left-3 top-2.5 text-blue-200/30">🔍</span>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full bg-blue-900/50 border border-blue-400/20 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-blue-200/30 focus:outline-none focus:border-yellow-400/50"
              />
            </div>

            {/* User List */}
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="game-card p-3 flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                    u.is_banned ? "bg-red-500/20" : u.is_online ? "bg-green-500/20" : "bg-blue-800"
                  }`}>
                    {u.is_banned ? "🚫" : u.is_admin ? "👑" : "👤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-white text-sm font-bold truncate" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>{u.display_name}</span>
                      <span className="text-blue-200/30 text-[10px] font-bold">@{u.username}</span>
                      {u.is_banned && <span className="text-[10px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-bold">Banned</span>}
                      {u.is_admin && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1 py-0.5 rounded font-bold">Admin</span>}
                    </div>
                    <p className="text-blue-200/40 text-[10px] mt-0.5 font-bold">
                      🪙{u.coins} · 🎮{u.total_games} · 🏆{u.games_won} · ⭐{Math.round(u.rating)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedUser(u); setShowCoinModal(true); }}
                      className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center text-sm hover:bg-yellow-500/30"
                      title="Adjust Coins"
                    >
                      🪙
                    </button>
                    {!u.is_admin && (
                      <button
                        onClick={() => u.is_banned ? handleUnban(u.id) : handleBan(u.id, "Violation of terms")}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                          u.is_banned ? "bg-green-500/20 hover:bg-green-500/30" : "bg-red-500/20 hover:bg-red-500/30"
                        }`}
                        title={u.is_banned ? "Unban" : "Ban"}
                      >
                        {u.is_banned ? "✅" : "🚫"}
                      </button>
                    )}
                    {!u.is_admin && (
                      <button
                        onClick={() => handleMakeAdmin(u.id)}
                        className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm hover:bg-blue-500/30"
                        title="Make Admin"
                      >
                        🛡️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-blue-200/40 text-xs font-bold">{totalUsers} total users</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 rounded-lg bg-blue-800 border border-blue-400/20 text-white font-bold disabled:opacity-30 text-sm"
                >
                  ◀
                </button>
                <span className="text-white text-xs font-bold">Page {page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={users.length < 20}
                  className="w-7 h-7 rounded-lg bg-blue-800 border border-blue-400/20 text-white font-bold disabled:opacity-30 text-sm"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Games Tab */}
        {tab === "games" && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎮</div>
            <p className="text-blue-200/50 font-bold" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>Game monitoring coming soon</p>
            <p className="text-blue-200/30 text-sm mt-1 font-bold">View active and past games from the dashboard</p>
          </div>
        )}
      </div>

      {/* Coin Adjustment Modal */}
      {showCoinModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="game-card p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-white mb-2" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>🪙 ADJUST COINS</h2>
            <p className="text-blue-200/50 text-sm mb-4 font-bold">
              {selectedUser.display_name} · Current: {selectedUser.coins} 🪙
            </p>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setCoinAmount(coinAmount - 100)}
                className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold text-lg flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                className="flex-1 bg-blue-900/50 border border-blue-400/20 rounded-xl py-2 px-4 text-white text-center text-lg focus:outline-none focus:border-yellow-400/50"
              />
              <button
                onClick={() => setCoinAmount(coinAmount + 100)}
                className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 font-bold text-lg flex items-center justify-center"
              >
                +
              </button>
            </div>

            <input
              type="text"
              placeholder="Reason (optional)"
              value={coinReason}
              onChange={(e) => setCoinReason(e.target.value)}
              className="w-full bg-blue-900/50 border border-blue-400/20 rounded-xl py-2 px-4 text-white placeholder-blue-200/30 focus:outline-none focus:border-yellow-400/50 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCoinModal(false); setCoinAmount(0); setCoinReason(""); }}
                className="flex-1 py-3 rounded-xl bg-blue-800 border-2 border-blue-400/50 text-white font-bold hover:bg-blue-700"
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}
              >
                CANCEL
              </button>
              <button
                onClick={handleAdjustCoins}
                className="flex-1 py-3 btn-golden"
              >
                APPLY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashCard({ label, value, emoji }: { label: string; value: number | string; emoji: string }) {
  return (
    <div className="game-card p-4 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <p className="text-white text-2xl font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>{value}</p>
      <p className="text-blue-200/40 text-xs font-bold mt-1">{label}</p>
    </div>
  );
}
