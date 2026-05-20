"use client";

import { motion } from "framer-motion";
import {
  Users,
  Video,
  Coins,
  TrendingUp,
  Eye,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const stats = [
  {
    label: "Total Users",
    value: "12,847",
    change: "+12.5%",
    up: true,
    icon: Users,
    color: "from-pink-500 to-rose-500",
  },
  {
    label: "Video Calls Today",
    value: "1,284",
    change: "+8.2%",
    up: true,
    icon: Video,
    color: "from-purple-500 to-indigo-500",
  },
  {
    label: "Revenue (MTD)",
    value: "$24,580",
    change: "+22.1%",
    up: true,
    icon: Coins,
    color: "from-amber-500 to-orange-500",
  },
  {
    label: "Page Views",
    value: "89,241",
    change: "-3.1%",
    up: false,
    icon: Eye,
    color: "from-green-500 to-teal-500",
  },
];

const recentUsers = [
  { name: "John D.", action: "Completed quiz", time: "2 min ago", avatar: "J" },
  { name: "Sarah M.", action: "Started video call", time: "5 min ago", avatar: "S" },
  { name: "Mike R.", action: "Purchased 150 coins", time: "12 min ago", avatar: "M" },
  { name: "Emily K.", action: "Registered", time: "18 min ago", avatar: "E" },
  { name: "David L.", action: "Completed quiz", time: "25 min ago", avatar: "D" },
];

const topProfiles = [
  { name: "Sophia", calls: 487, revenue: "$2,435", rating: 4.9 },
  { name: "Emma", calls: 412, revenue: "$2,060", rating: 4.8 },
  { name: "Isabella", calls: 356, revenue: "$2,136", rating: 4.7 },
  { name: "Olivia", calls: 298, revenue: "$1,192", rating: 4.8 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back! Here is what is happening with SparkVibe today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-medium ${stat.up ? "text-green-600" : "text-red-500"}`}
              >
                {stat.up ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-sm text-gray-400 mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-pink-500" />
              Recent Activity
            </h2>
            <button className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.action}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{user.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Profiles */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Top Performing Profiles
            </h2>
            <button className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Profile</th>
                  <th className="pb-3 font-medium">Calls</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {topProfiles.map((profile, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 font-medium text-gray-800">{profile.name}</td>
                    <td className="py-3 text-gray-600">{profile.calls}</td>
                    <td className="py-3 text-gray-600">{profile.revenue}</td>
                    <td className="py-3">
                      <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {profile.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
