import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

interface LeaderboardEntry {
  rank: number;
  id: number;
  username: string;
  display_name: string;
  avatar_id: number;
  level: number;
  total_games: number;
  games_won: number;
  rating: number;
  is_online: boolean;
}

const AVATARS = ["🦁", "🐯", "🦊", "🐻", "🐼", "🐨", "🐸", "🐵", "🐰", "🐶",
  "🦅", "🐺", "🦄", "🐲", "🦋", "🐙", "🦈", "🐬", "🦩", "🦜"];

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("rating");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<{ leaderboard: LeaderboardEntry[] }>(`/api/users/leaderboard?sort_by=${sortBy}`)
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sortBy]);

  const tabs = [
    { key: "rating", label: "Rating", emoji: "👑" },
    { key: "wins", label: "Wins", emoji: "🏆" },
    { key: "kills", label: "Kills", emoji: "⚔️" },
    { key: "streak", label: "Streak", emoji: "🔥" },
  ];

  return (
    <div className="min-h-screen ludo-bg p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-lg bg-blue-800 border border-blue-400/30 flex items-center justify-center text-white hover:bg-blue-700">
            ←
          </button>
          <h1 className="text-lg font-bold text-white" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
            🏆 LEADERBOARD
          </h1>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-1 bg-blue-900/50 rounded-xl p-1 mb-4 border border-blue-400/20">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSortBy(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                sortBy === t.key ? "btn-golden" : "text-blue-200/50 hover:text-white"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-blue-200/30 text-center py-20 font-bold">No players yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  entry.rank <= 3
                    ? "game-card border-yellow-400/40"
                    : "game-card"
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {entry.rank === 1 ? (
                    <span className="text-xl">🥇</span>
                  ) : entry.rank === 2 ? (
                    <span className="text-xl">🥈</span>
                  ) : entry.rank === 3 ? (
                    <span className="text-xl">🥉</span>
                  ) : (
                    <span className="text-blue-200/40 font-bold text-sm">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-800 border-2 border-blue-400/30 flex items-center justify-center text-lg relative">
                  {AVATARS[((entry.avatar_id || 1) - 1) % AVATARS.length]}
                  {entry.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-blue-900" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>{entry.display_name}</p>
                  <p className="text-blue-200/40 text-xs font-bold">
                    Lv.{entry.level} · {entry.games_won}W/{entry.total_games}G
                  </p>
                </div>

                {/* Value */}
                <div className="text-right">
                  <p className="text-yellow-300 font-bold text-lg" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                    {sortBy === "rating" ? Math.round(entry.rating) : entry.games_won}
                  </p>
                  <p className="text-blue-200/30 text-[10px] font-bold uppercase">{sortBy}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
