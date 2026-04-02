import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { ArrowLeft, Trophy, Swords, TrendingUp, Crown } from "lucide-react";

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
    { key: "rating", label: "Rating", icon: <Crown size={16} /> },
    { key: "wins", label: "Wins", icon: <Trophy size={16} /> },
    { key: "kills", label: "Kills", icon: <Swords size={16} /> },
    { key: "streak", label: "Streak", icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-amber-400" size={24} />
            Leaderboard
          </h1>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSortBy(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sortBy === t.key ? "bg-amber-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-gray-500 text-center py-20">No players yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  entry.rank <= 3
                    ? "bg-gray-900/80 border border-amber-500/30"
                    : "bg-gray-900/40 border border-gray-700/30"
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {entry.rank === 1 ? (
                    <span className="text-2xl">🥇</span>
                  ) : entry.rank === 2 ? (
                    <span className="text-2xl">🥈</span>
                  ) : entry.rank === 3 ? (
                    <span className="text-2xl">🥉</span>
                  ) : (
                    <span className="text-gray-500 font-bold text-sm">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xl relative">
                  {AVATARS[((entry.avatar_id || 1) - 1) % AVATARS.length]}
                  {entry.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{entry.display_name}</p>
                  <p className="text-gray-400 text-xs">
                    Level {entry.level} · {entry.games_won} wins / {entry.total_games} games
                  </p>
                </div>

                {/* Value */}
                <div className="text-right">
                  <p className="text-amber-400 font-bold text-lg">
                    {sortBy === "rating" ? Math.round(entry.rating) : entry.games_won}
                  </p>
                  <p className="text-gray-500 text-xs capitalize">{sortBy}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
