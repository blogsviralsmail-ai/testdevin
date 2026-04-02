import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import {
  ArrowLeft, Coins, Gem, Trophy, Star, Swords,
  Target, TrendingUp, Crown, Edit2, Save
} from "lucide-react";

interface GameHistory {
  game: {
    room_code: string;
    game_mode: string;
    status: string;
    created_at: string;
  };
  player_data: {
    color: string;
    is_winner: boolean;
    kills: number;
    pieces_finished: number;
    rank: number | null;
  };
}

interface Transaction {
  id: number;
  type: string;
  category: string;
  amount: number;
  currency: string;
  balance_after: number;
  description: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"stats" | "history" | "wallet">("stats");
  const [games, setGames] = useState<GameHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [avatarId, setAvatarId] = useState(user?.avatar_id || 1);

  useEffect(() => {
    if (tab === "history") {
      api.get<{ games: GameHistory[] }>("/api/games/history").then((d) => setGames(d.games)).catch(() => {});
    }
    if (tab === "wallet") {
      api.get<{ transactions: Transaction[] }>("/api/users/me/transactions").then((d) => setTransactions(d.transactions)).catch(() => {});
    }
  }, [tab]);

  const handleSaveProfile = async () => {
    await api.put("/api/users/me", { display_name: displayName, avatar_id: avatarId });
    await refreshUser();
    setEditing(false);
  };

  const avatars = ["🦁", "🐯", "🦊", "🐻", "🐼", "🐨", "🐸", "🐵", "🐰", "🐶",
    "🦅", "🐺", "🦄", "🐲", "🦋", "🐙", "🦈", "🐬", "🦩", "🦜"];

  const winRate = user ? Math.round((user.games_won / Math.max(user.total_games, 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-700/50 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-lg">
              {avatars[((user?.avatar_id || 1) - 1) % avatars.length]}
            </div>
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white w-full mb-1"
                />
              ) : (
                <h2 className="text-2xl font-bold text-white">{user?.display_name}</h2>
              )}
              <p className="text-gray-400 text-sm">@{user?.username}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-sm">
                  <Star size={14} className="text-amber-400" />
                  <span className="text-white font-semibold">Level {user?.level}</span>
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Crown size={14} className="text-purple-400" />
                  <span className="text-white font-semibold">{Math.round(user?.rating || 1000)}</span>
                </span>
              </div>
            </div>
            <button
              onClick={editing ? handleSaveProfile : () => setEditing(true)}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-amber-400"
            >
              {editing ? <Save size={18} /> : <Edit2 size={18} />}
            </button>
          </div>

          {editing && (
            <div className="mt-4">
              <p className="text-gray-400 text-sm mb-2">Choose Avatar</p>
              <div className="flex flex-wrap gap-2">
                {avatars.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => setAvatarId(i + 1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                      avatarId === i + 1 ? "bg-amber-500 scale-110 ring-2 ring-amber-400" : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Balance */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-2">
              <Coins size={20} className="text-amber-400" />
              <span className="text-white font-bold text-lg">{(user?.coins || 0).toLocaleString()}</span>
              <span className="text-gray-400 text-sm">coins</span>
            </div>
            <div className="flex items-center gap-2">
              <Gem size={18} className="text-purple-400" />
              <span className="text-white font-bold text-lg">{user?.gems || 0}</span>
              <span className="text-gray-400 text-sm">gems</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 mb-6">
          {(["stats", "history", "wallet"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                tab === t ? "bg-amber-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === "stats" && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Target size={20} />} label="Total Games" value={user?.total_games || 0} color="text-blue-400" />
            <StatCard icon={<Trophy size={20} />} label="Games Won" value={user?.games_won || 0} color="text-green-400" />
            <StatCard icon={<TrendingUp size={20} />} label="Win Rate" value={`${winRate}%`} color="text-amber-400" />
            <StatCard icon={<Swords size={20} />} label="Total Kills" value={user?.total_kills || 0} color="text-red-400" />
            <StatCard icon={<Star size={20} />} label="Win Streak" value={user?.win_streak || 0} color="text-purple-400" />
            <StatCard icon={<Crown size={20} />} label="Best Streak" value={user?.best_win_streak || 0} color="text-orange-400" />
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="space-y-3">
            {games.length === 0 && (
              <p className="text-gray-500 text-center py-10">No games played yet</p>
            )}
            {games.map((g, i) => (
              <div key={i} className="bg-gray-900/60 rounded-xl border border-gray-700/50 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  g.player_data.is_winner ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-400"
                }`}>
                  {g.player_data.is_winner ? "🏆" : `#${g.player_data.rank || "-"}`}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold capitalize">{g.game.game_mode} Mode</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(g.game.created_at).toLocaleDateString()} · {g.player_data.kills} kills · {g.player_data.pieces_finished}/4 home
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  g.player_data.is_winner ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-400"
                }`}>
                  {g.player_data.is_winner ? "WON" : "LOST"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wallet Tab */}
        {tab === "wallet" && (
          <div className="space-y-3">
            {transactions.length === 0 && (
              <p className="text-gray-500 text-center py-10">No transactions yet</p>
            )}
            {transactions.map((t) => (
              <div key={t.id} className="bg-gray-900/60 rounded-xl border border-gray-700/50 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  t.type === "credit" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {t.type === "credit" ? "+" : "-"}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{t.description || t.category}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(t.created_at).toLocaleDateString()} · Balance: {t.balance_after}
                  </p>
                </div>
                <span className={`font-bold ${t.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                  {t.type === "credit" ? "+" : "-"}{t.amount} {t.currency === "gems" ? "💎" : "🪙"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-700/50 p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-white text-2xl font-bold">{value}</p>
      <p className="text-gray-400 text-xs mt-1">{label}</p>
    </div>
  );
}
