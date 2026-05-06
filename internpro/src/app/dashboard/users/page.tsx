"use client";

import { useState, useEffect, useCallback } from "react";

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
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "" });
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
      admin: "bg-red-100 text-red-700",
      organization: "bg-purple-100 text-purple-700",
      teamleader: "bg-blue-100 text-blue-700",
      student: "bg-green-100 text-green-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 text-sm">Manage all platform users — create, edit, delete</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          {showAdd ? "Cancel" : "+ Add User"}
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "admin", "organization", "teamleader", "student"].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`text-xs px-3 py-1.5 rounded-lg transition ${filter === r ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {r === "" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl p-6 border mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Full Name" required />
            <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Email" required />
            <input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Phone" />
            <input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Password" required />
            <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-gray-900">
              <option value="student">Student</option>
              <option value="teamleader">Team Leader</option>
              <option value="organization">Organization</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700">
            Create User
          </button>
        </form>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit User</h2>
            <div className="space-y-4">
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Name" />
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Email" />
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Phone" />
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                <option value="student">Student</option>
                <option value="teamleader">Team Leader</option>
                <option value="organization">Organization</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEdit} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save</button>
              <button onClick={() => setEditUser(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Email</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Role</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Joined</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 text-sm">{u.name}</div>
                  {u.phone && <div className="text-xs text-gray-400">{u.phone}</div>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${roleBadge(u.role)}`}>{u.role}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditUser(u); setEditForm({ name: u.name, email: u.email, phone: u.phone || "", role: u.role }); }}
                      className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded hover:bg-gray-100 border">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(u.id)}
                      className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">
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
