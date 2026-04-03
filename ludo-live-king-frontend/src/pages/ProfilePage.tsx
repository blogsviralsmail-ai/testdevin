import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

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
    <div className="min-h-screen ludo-bg p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-lg bg-blue-800 border border-blue-400/30 flex items-center justify-center text-white hover:bg-blue-700">
            ←
          </button>
          <h1 className="text-lg font-bold text-white" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>👤 PROFILE</h1>
        </div>

        {/* Profile Card */}
        <div className="game-card p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg border-yellow-300" style={{borderWidth: '3px', borderStyle: 'solid', borderColor: '#fcd34d'}}>
              {avatars[((user?.avatar_id || 1) - 1) % avatars.length]}
            </div>
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-blue-900/50 border border-blue-400/30 rounded-lg px-3 py-1 text-white w-full mb-1"
                />
              ) : (
                <h2 className="text-xl font-bold text-white" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>{user?.display_name}</h2>
              )}
              <p className="text-blue-200/50 text-sm font-bold">@{user?.username}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-bold text-yellow-300">⭐ Level {user?.level}</span>
                <span className="text-xs font-bold text-blue-200/60">👑 {Math.round(user?.rating || 1000)}</span>
              </div>
            </div>
            <button
              onClick={editing ? handleSaveProfile : () => setEditing(true)}
              className="w-8 h-8 rounded-lg bg-yellow-500 border-2 border-yellow-300 flex items-center justify-center text-blue-900 font-bold hover:bg-yellow-400"
            >
              {editing ? "💾" : "✏️"}
            </button>
          </div>

          {editing && (
            <div className="mt-4">
              <p className="text-blue-200/50 text-xs font-bold mb-2">CHOOSE AVATAR</p>
              <div className="flex flex-wrap gap-2">
                {avatars.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => setAvatarId(i + 1)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                      avatarId === i + 1 ? "bg-yellow-500 scale-110 ring-2 ring-yellow-400" : "bg-blue-800 hover:bg-blue-700"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Balance */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-blue-400/20">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🪙</span>
              <span className="text-white font-bold text-lg" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>{(user?.coins || 0).toLocaleString()}</span>
              <span className="text-blue-200/40 text-xs font-bold">coins</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">💎</span>
              <span className="text-white font-bold text-lg" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>{user?.gems || 0}</span>
              <span className="text-blue-200/40 text-xs font-bold">gems</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-blue-900/50 rounded-xl p-1 mb-4 border border-blue-400/20">
          {(["stats", "history", "wallet"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                tab === t ? "btn-golden" : "text-blue-200/50 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === "stats" && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard emoji="🎯" label="Total Games" value={user?.total_games || 0} />
            <StatCard emoji="🏆" label="Games Won" value={user?.games_won || 0} />
            <StatCard emoji="📈" label="Win Rate" value={`${winRate}%`} />
            <StatCard emoji="⚔️" label="Total Kills" value={user?.total_kills || 0} />
            <StatCard emoji="🔥" label="Win Streak" value={user?.win_streak || 0} />
            <StatCard emoji="👑" label="Best Streak" value={user?.best_win_streak || 0} />
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="space-y-2">
            {games.length === 0 && (
              <p className="text-blue-200/30 text-center py-10 font-bold">No games played yet</p>
            )}
            {games.map((g, i) => (
              <div key={i} className="game-card p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                  g.player_data.is_winner ? "bg-green-500/20" : "bg-blue-900/50"
                }`}>
                  {g.player_data.is_winner ? "🏆" : `#${g.player_data.rank || "-"}`}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-bold capitalize" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>{g.game.game_mode} Mode</p>
                  <p className="text-blue-200/40 text-xs font-bold">
                    {new Date(g.game.created_at).toLocaleDateString()} · {g.player_data.kills} kills · {g.player_data.pieces_finished}/4 home
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  g.player_data.is_winner ? "bg-green-500/20 text-green-300" : "bg-blue-900/50 text-blue-200/50"
                }`}>
                  {g.player_data.is_winner ? "WON" : "LOST"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wallet Tab */}
        {tab === "wallet" && (
          <div className="space-y-2">
            {transactions.length === 0 && (
              <p className="text-blue-200/30 text-center py-10 font-bold">No transactions yet</p>
            )}
            {transactions.map((t) => (
              <div key={t.id} className="game-card p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                  t.type === "credit" ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  {t.type === "credit" ? "📥" : "📤"}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-bold" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>{t.description || t.category}</p>
                  <p className="text-blue-200/40 text-xs font-bold">
                    {new Date(t.created_at).toLocaleDateString()} · Balance: {t.balance_after}
                  </p>
                </div>
                <span className={`font-bold text-sm ${t.type === "credit" ? "text-green-300" : "text-red-400"}`} style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>
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

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: number | string }) {
  return (
    <div className="game-card p-4 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <p className="text-white text-xl font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>{value}</p>
      <p className="text-blue-200/40 text-xs font-bold mt-1">{label}</p>
    </div>
  );
}
