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
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-slate-500">Top performers based on points earned</p>
        </div>
        <div className="flex gap-2">
          {["all", "monthly", "weekly"].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${period === p ? "bg-[#0EA5B8] text-white" : "bg-transparent text-slate-400 hover:bg-gray-200"}`}>
              {p === "all" ? "All Time" : p === "monthly" ? "This Month" : "This Week"}
            </button>
          ))}
        </div>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#0EA5B8] to-[#a78bfa] rounded-xl p-5 text-white">
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
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
          <h2 className="text-lg font-semibold mb-4">Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allBadges.map(badge => {
              const earned = myStats.badges.find(b => b.badge.id === badge.id);
              return (
                <div key={badge.id} className={`text-center p-3 rounded-lg border ${earned ? "bg-transparent border-yellow-200" : "bg-transparent border-white/[0.08] opacity-50"}`}>
                  <span className="text-3xl">{badge.icon}</span>
                  <p className="text-xs font-medium mt-1">{badge.name}</p>
                  <p className="text-[10px] text-slate-500">{badge.threshold} pts</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border overflow-hidden">
        <table className="w-full">
          <thead className="bg-transparent">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Employee ID</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leaderboard.map(entry => (
              <tr key={entry.userId} className={entry.rank <= 3 ? "bg-transparent" : ""}>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${entry.rank === 1 ? "bg-yellow-400 text-white" : entry.rank === 2 ? "bg-gray-300 text-white" : entry.rank === 3 ? "bg-amber-600 text-white" : "bg-transparent text-slate-400"}`}>
                    {entry.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0EA5B8]/10 flex items-center justify-center text-[#22d3ee] text-sm font-bold overflow-hidden">
                      {entry.avatar ? <img src={entry.avatar} className="w-full h-full object-cover" alt="" /> : entry.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                    </div>
                    <span className="font-medium text-sm">{entry.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{entry.employeeId || "—"}</td>
                <td className="px-4 py-3 text-right font-bold text-[#22d3ee]">{entry.points}</td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">No points earned yet. Complete tasks to earn points!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
