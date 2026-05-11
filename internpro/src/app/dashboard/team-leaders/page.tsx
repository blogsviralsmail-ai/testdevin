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
}

interface Batch {
  id: string;
  name: string;
  leaderId: string | null;
  program: { title: string };
  _count: { enrollments: number };
}

interface Enrollment {
  id: string;
  student: { id: string; name: string; email: string };
  batch: { id: string; name: string; program: { title: string } };
  status: string;
}

export default function TeamLeadersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [assignModal, setAssignModal] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [assignStudentModal, setAssignStudentModal] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const fetchData = useCallback(async () => {
    const [usersRes, batchRes, enrollRes] = await Promise.all([
      fetch("/api/users?role=teamleader"),
      fetch("/api/batches"),
      fetch("/api/enrollments"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (batchRes.ok) setBatches(await batchRes.json());
    if (enrollRes.ok) setEnrollments(await enrollRes.json());
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

  const handleAssignBatch = async (batchId: string, leaderId: string) => {
    await fetch(`/api/batches/${batchId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamLeaderId: leaderId }),
    });
    fetchData();
  };

  const handleTransferStudent = async (enrollmentId: string, newBatchId: string) => {
    await fetch(`/api/enrollments/${enrollmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: newBatchId }),
    });
    fetchData();
  };

  const getAssignedBatches = (userId: string) => {
    return batches.filter((b) => b.leaderId === userId);
  };

  const getFilteredForExport = () => {
    return (users || []) as unknown as Record<string, unknown>[];
  };

  const handleExportCSV = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    exportToCSV(data as Record<string, unknown>[], "Team Leaders", [{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }]);
  };

  const handleExportPDF = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    const cols = [{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }];
    exportToPDF("Team Leaders", buildTableHTML(data as Record<string, unknown>[], cols));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Leaders</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search leaders..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
          <p className="text-slate-400 text-sm">Manage team leaders and assign them to batches</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2]">
          {showAdd ? "Cancel" : "+ Add Team Leader"}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Team Leader</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-white" placeholder="Full Name" required />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-white" placeholder="Email" required />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-white" placeholder="Phone Number" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm text-white" placeholder="Password" required />
          </div>
          <button type="submit" className="mt-4 bg-[#0EA5B8] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0891b2]">
            Create Team Leader
          </button>
        </form>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Edit Team Leader</h2>
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
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEdit} className="flex-1 bg-[#0EA5B8] text-white px-4 py-2 rounded-lg hover:bg-[#0891b2]">Save</button>
              <button onClick={() => setEditUser(null)} className="px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Batch Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Assign Batches to {assignModal.name}</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {batches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06]">
                  <div>
                    <div className="text-sm font-medium text-white">{batch.program.title} — {batch.name}</div>
                    <div className="text-xs text-slate-500">{batch._count.enrollments} students</div>
                  </div>
                  <button
                    onClick={() => handleAssignBatch(batch.id, batch.leaderId === assignModal.id ? "" : assignModal.id)}
                    className={`text-xs px-3 py-1 rounded ${batch.leaderId === assignModal.id ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-200 text-slate-400"}`}
                  >
                    {batch.leaderId === assignModal.id ? "Assigned" : "Assign"}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setAssignModal(null)} className="mt-4 w-full px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {assignStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold text-white mb-2">Assign Students to {assignStudentModal.name}</h2>
            <p className="text-xs text-slate-500 mb-4">Transfer students to {assignStudentModal.name}&apos;s assigned batches</p>
            {(() => {
              const tlBatches = getAssignedBatches(assignStudentModal.id);
              if (tlBatches.length === 0) return <p className="text-sm text-red-400">No batches assigned to this TL. Assign a batch first.</p>;
              const otherStudents = enrollments.filter((e) => (e.status === "active" || e.status === "selected") && !tlBatches.some((b) => b.id === e.batch.id));
              return (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {otherStudents.length === 0 ? (
                    <p className="text-sm text-slate-500">No students from other batches to transfer.</p>
                  ) : (
                    otherStudents.map((e) => (
                      <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06]">
                        <div>
                          <div className="text-sm font-medium text-white">{e.student.name}</div>
                          <div className="text-xs text-slate-500">{e.batch.program.title} — {e.batch.name}</div>
                        </div>
                        <select onChange={(sel) => { if (sel.target.value) handleTransferStudent(e.id, sel.target.value); }}
                          className="text-xs px-2 py-1 border rounded text-white" defaultValue="">
                          <option value="" disabled>Move to batch...</option>
                          {tlBatches.map((b) => (
                            <option key={b.id} value={b.id}>{b.program.title} — {b.name}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}
            <button onClick={() => setAssignStudentModal(null)} className="mt-4 w-full px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Team Leaders List */}
      {users.length === 0 ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 text-center border">
          <p className="text-4xl mb-4">👔</p>
          <p className="text-slate-400">No team leaders yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => {
            const assigned = getAssignedBatches(user.id);
            return (
              <div key={user.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border hover:shadow-none transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">{user.name}</h3>
                    <p className="text-sm text-slate-400">{user.email} {user.phone && `| ${user.phone}`}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {assigned.length > 0 ? (
                        assigned.map((b) => (
                          <span key={b.id} className="text-xs px-2 py-1 rounded-full bg-[#0EA5B8]/10 text-[#22d3ee]">
                            {b.program.title} — {b.name} ({b._count.enrollments} students)
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No batches assigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAssignModal(user)}
                      className="text-xs bg-transparent text-[#22d3ee] px-3 py-1.5 rounded-lg hover:bg-[#0EA5B8]/10">
                      Assign Batch
                    </button>
                    <button onClick={() => setAssignStudentModal(user)}
                      className="text-xs bg-transparent text-[#a78bfa] px-3 py-1.5 rounded-lg hover:bg-purple-500/10">
                      Assign Students
                    </button>
                    <button onClick={() => { setEditUser(user); setEditForm({ name: user.name, email: user.email, phone: user.phone || "", password: "" }); }}
                      className="text-xs bg-transparent text-slate-300 px-3 py-1.5 rounded-lg hover:bg-transparent border">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(user.id)}
                      className="text-xs bg-transparent text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10">
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
