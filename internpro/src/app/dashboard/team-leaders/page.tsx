"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

interface Batch {
  id: string;
  name: string;
  leaderId: string | null;
  program: { title: string };
  _count: { enrollments: number };
}

export default function TeamLeadersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [assignModal, setAssignModal] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });

  const fetchData = useCallback(async () => {
    const [usersRes, batchRes] = await Promise.all([
      fetch("/api/users?role=teamleader"),
      fetch("/api/batches"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (batchRes.ok) setBatches(await batchRes.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "teamleader" }),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: "", email: "", phone: "", password: "" });
      fetchData();
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
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team leader?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleAssignBatch = async (batchId: string, teamLeaderId: string) => {
    await fetch(`/api/batches/${batchId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamLeaderId }),
    });
    fetchData();
  };

  const getAssignedBatches = (userId: string) => {
    return batches.filter((b) => b.leaderId === userId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Leaders</h1>
          <p className="text-gray-600 text-sm">Manage team leaders and assign them to batches</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          {showAdd ? "Cancel" : "+ Add Team Leader"}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl p-6 border mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Team Leader</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Full Name" required />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Email" required />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Phone Number" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Password" required />
          </div>
          <button type="submit" className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700">
            Create Team Leader
          </button>
        </form>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Team Leader</h2>
            <div className="space-y-4">
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Name" />
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Email" />
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Phone" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEdit} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save</button>
              <button onClick={() => setEditUser(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Batch Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Assign Batches to {assignModal.name}</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {batches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{batch.program.title} — {batch.name}</div>
                    <div className="text-xs text-gray-500">{batch._count.enrollments} students</div>
                  </div>
                  <button
                    onClick={() => handleAssignBatch(batch.id, batch.leaderId === assignModal.id ? "" : assignModal.id)}
                    className={`text-xs px-3 py-1 rounded ${batch.leaderId === assignModal.id ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                  >
                    {batch.leaderId === assignModal.id ? "Assigned" : "Assign"}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setAssignModal(null)} className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Team Leaders List */}
      {users.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-4xl mb-4">👔</p>
          <p className="text-gray-600">No team leaders yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => {
            const assigned = getAssignedBatches(user.id);
            return (
              <div key={user.id} className="bg-white rounded-xl p-6 border hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email} {user.phone && `| ${user.phone}`}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {assigned.length > 0 ? (
                        assigned.map((b) => (
                          <span key={b.id} className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                            {b.program.title} — {b.name} ({b._count.enrollments} students)
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No batches assigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAssignModal(user)}
                      className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                      Assign Batch
                    </button>
                    <button onClick={() => { setEditUser(user); setEditForm({ name: user.name, email: user.email, phone: user.phone || "" }); }}
                      className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 border">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(user.id)}
                      className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
