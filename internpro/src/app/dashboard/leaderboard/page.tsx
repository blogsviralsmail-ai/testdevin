"use client";
import { useState, useEffect, useCallback } from "react";

interface LeaderboardEntry { rank: number; userId: string; name: string; avatar?: string; employeeId?: string; points: number; }
interface BadgeInfo { id: string; name: string; icon: string; description: string; threshold: number; }
interface MyBadge { badge: BadgeInfo; earnedAt: string; }

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<{ points: number; rank: number; badges: MyBadge[] }>({ points: 0, rank: 0, badges: [] });
  const [allBadges, setAllBadges] = useState<BadgeInfo[]>([]);
  const [period, setPeriod] = useState("all");

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/gamification?period=${period}`);
    if (res.ok) {
      const data = await res.json();
      setLeaderboard(data.leaderboard);
      setMyStats(data.myStats);
      setAllBadges(data.allBadges);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-500">Top performers based on points earned</p>
        </div>
        <div className="flex gap-2">
          {["all", "monthly", "weekly"].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${period === p ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {p === "all" ? "All Time" : p === "monthly" ? "This Month" : "This Week"}
            </button>
          ))}
        </div>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Your Points</p>
          <p className="text-3xl font-bold">{myStats.points}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Your Rank</p>
          <p className="text-3xl font-bold">#{myStats.rank}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Badges Earned</p>
          <p className="text-3xl font-bold">{myStats.badges.length}</p>
        </div>
      </div>

      {/* Badges */}
      {allBadges.length > 0 && (
        <div className="bg-white rounded-xl p-6 border">
          <h2 className="text-lg font-semibold mb-4">Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allBadges.map(badge => {
              const earned = myStats.badges.find(b => b.badge.id === badge.id);
              return (
                <div key={badge.id} className={`text-center p-3 rounded-lg border ${earned ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200 opacity-50"}`}>
                  <span className="text-3xl">{badge.icon}</span>
                  <p className="text-xs font-medium mt-1">{badge.name}</p>
                  <p className="text-[10px] text-gray-500">{badge.threshold} pts</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Employee ID</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leaderboard.map(entry => (
              <tr key={entry.userId} className={entry.rank <= 3 ? "bg-yellow-50" : ""}>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${entry.rank === 1 ? "bg-yellow-400 text-white" : entry.rank === 2 ? "bg-gray-300 text-white" : entry.rank === 3 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    {entry.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold overflow-hidden">
                      {entry.avatar ? <img src={entry.avatar} className="w-full h-full object-cover" alt="" /> : entry.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                    </div>
                    <span className="font-medium text-sm">{entry.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{entry.employeeId || "—"}</td>
                <td className="px-4 py-3 text-right font-bold text-indigo-600">{entry.points}</td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">No points earned yet. Complete tasks to earn points!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
