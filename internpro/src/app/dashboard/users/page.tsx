"use client";

import { useState, useEffect, useCallback } from "react";

import DataToolbar from "@/components/DataToolbar";
import { exportToCSV, exportToPDF, buildTableHTML } from "@/lib/export-utils";
interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  _count: { enrollments: number };
}

export default function UsersPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "", password: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", role: "student", password: "" });

  const fetchUsers = useCallback(async () => {
    const url = filter ? `/api/users?role=${filter}` : "/api/users";
    const res = await fetch(url);
    if (res.ok) setUsers(await res.json());
  }, [filter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      setShowAdd(false);
      setAddForm({ name: "", email: "", phone: "", role: "student", password: "" });
      fetchUsers();
    }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    await fetch(`/api/users/${editUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditUser(null);
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500/10 text-red-400",
      organization: "bg-purple-500/10 text-[#a78bfa]",
      teamleader: "bg-blue-500/10 text-[#60a5fa]",
      student: "bg-emerald-500/10 text-emerald-400",
    };
    return colors[role] || "bg-transparent text-slate-300";
  };

  const getFilteredForExport = () => {
    return (users || []) as unknown as Record<string, unknown>[];
  };

  const handleExportCSV = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    exportToCSV(data as Record<string, unknown>[], "Users", [{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "isActive", label: "Active" }, { key: "createdAt", label: "Joined" }]);
  };

  const handleExportPDF = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    const cols = [{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "isActive", label: "Active" }, { key: "createdAt", label: "Joined" }];
    exportToPDF("Users", buildTableHTML(data as Record<string, unknown>[], cols));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(users.map((item: { id: string }) => item.id)));
  };
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} users?`)) return;
    setBulkDeleting(true);
    await fetch("/api/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk_delete_users", ids: Array.from(selectedIds) }) });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    fetchUsers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search users..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-sm text-red-400 font-medium">{selectedIds.size} selected</span>
          <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">
            {bulkDeleting ? "Deleting..." : "Delete Selected"}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/20">Clear</button>
        </div>
      )}
          <p className="text-slate-400 text-sm">Manage all platform users — create, edit, delete</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2]">
          {showAdd ? "Cancel" : "+ Add User"}
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "admin", "organization", "teamleader", "student"].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`text-xs px-3 py-1.5 rounded-lg transition ${filter === r ? "bg-[#0EA5B8] text-white" : "bg-transparent text-slate-400 hover:bg-white/10"}`}
          >
            {r === "" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add New User</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-white" placeholder="Full Name" required />
            <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-white" placeholder="Email" required />
            <input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-white" placeholder="Phone" />
            <input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-white" placeholder="Password" required />
            <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-white">
              <option value="student">Student</option>
              <option value="teamleader">Team Leader</option>
              <option value="organization">Organization</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="mt-4 bg-[#0EA5B8] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0891b2]">
            Create User
          </button>
        </form>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="Name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="Email" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="Phone" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password (blank = no change)</label>
                <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="Leave blank to keep current" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white">
                  <option value="student">Student</option>
                  <option value="teamleader">Team Leader</option>
                  <option value="organization">Organization</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEdit} className="flex-1 bg-[#0EA5B8] text-white px-4 py-2 rounded-lg hover:bg-[#0891b2]">Save</button>
              <button onClick={() => setEditUser(null)} className="px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border overflow-hidden">
        <table className="w-full">
          <thead className="bg-transparent">
            <tr>
              <th className="px-3 py-3 w-10"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === users.length} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8]" /></th>
              <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Name</th>
              <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Email</th>
              <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Role</th>
              <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Joined</th>
              <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-transparent">
                <td className="px-3 py-3 w-10"><input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8]" /></td>
                <td className="px-6 py-4">
                  <div className="font-medium text-white text-sm">{u.name}</div>
                  {u.phone && <div className="text-xs text-slate-500">{u.phone}</div>}
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${roleBadge(u.role)}`}>{u.role}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditUser(u); setEditForm({ name: u.name, email: u.email, phone: u.phone || "", role: u.role, password: "" }); }}
                      className="text-xs bg-transparent text-slate-300 px-2 py-1 rounded hover:bg-transparent border">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(u.id)}
                      className="text-xs bg-transparent text-red-400 px-2 py-1 rounded hover:bg-red-500/10">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
