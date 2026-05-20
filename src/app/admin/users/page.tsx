"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Ban, Shield, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  gender: string;
  joinedAt: string;
  quizCompleted: boolean;
  totalCalls: number;
  coins: number;
  status: "active" | "suspended" | "banned";
}

const mockUsers: UserRecord[] = [
  { id: "u1", name: "John Doe", email: "john@example.com", gender: "Man", joinedAt: "2025-05-18", quizCompleted: true, totalCalls: 12, coins: 45, status: "active" },
  { id: "u2", name: "Sarah Miller", email: "sarah@example.com", gender: "Woman", joinedAt: "2025-05-17", quizCompleted: true, totalCalls: 8, coins: 120, status: "active" },
  { id: "u3", name: "Mike Ross", email: "mike@example.com", gender: "Man", joinedAt: "2025-05-16", quizCompleted: false, totalCalls: 0, coins: 0, status: "active" },
  { id: "u4", name: "Emily Chen", email: "emily@example.com", gender: "Woman", joinedAt: "2025-05-15", quizCompleted: true, totalCalls: 24, coins: 0, status: "suspended" },
  { id: "u5", name: "David Kim", email: "david@example.com", gender: "Man", joinedAt: "2025-05-14", quizCompleted: true, totalCalls: 3, coins: 200, status: "active" },
  { id: "u6", name: "Alex Taylor", email: "alex@example.com", gender: "Friends", joinedAt: "2025-05-13", quizCompleted: true, totalCalls: 5, coins: 50, status: "active" },
  { id: "u7", name: "Lisa Wang", email: "lisa@example.com", gender: "Woman", joinedAt: "2025-05-12", quizCompleted: false, totalCalls: 0, coins: 0, status: "banned" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRecord[]>(mockUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || u.status === filter;
    return matchSearch && matchFilter;
  });

  const toggleStatus = (id: string, newStatus: UserRecord["status"]) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          View and manage all registered users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "suspended", "banned"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-pink-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left">
              <th className="px-5 py-3 font-medium text-gray-500">User</th>
              <th className="px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Gender</th>
              <th className="px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
              <th className="px-5 py-3 font-medium text-gray-500">Quiz</th>
              <th className="px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Calls</th>
              <th className="px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Coins</th>
              <th className="px-5 py-3 font-medium text-gray-500">Status</th>
              <th className="px-5 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 hover:bg-gray-50/50"
              >
                <td className="px-5 py-3">
                  <div>
                    <span className="font-medium text-gray-800">{user.name}</span>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600 hidden md:table-cell">{user.gender}</td>
                <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">{user.joinedAt}</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.quizCompleted ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {user.quizCompleted ? "Done" : "Pending"}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600 hidden md:table-cell">{user.totalCalls}</td>
                <td className="px-5 py-3 text-gray-600 hidden md:table-cell">{user.coins}</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      user.status === "active"
                        ? "bg-green-50 text-green-600"
                        : user.status === "suspended"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    {user.status !== "banned" && (
                      <button
                        onClick={() => toggleStatus(user.id, "banned")}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        title="Ban user"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                    {user.status === "banned" && (
                      <button
                        onClick={() => toggleStatus(user.id, "active")}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-500"
                        title="Unban user"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {filtered.length} of {users.length} users
        </p>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 bg-pink-500 text-white rounded-lg text-sm font-medium">1</span>
          <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
