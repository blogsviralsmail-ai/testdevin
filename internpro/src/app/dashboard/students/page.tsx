"use client";

import { useState, useEffect, useCallback } from "react";
import { getStatusColor, formatDate } from "@/lib/utils";

import DataToolbar from "@/components/DataToolbar";
import { exportToCSV, exportToPDF, buildTableHTML } from "@/lib/export-utils";
interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  joiningDate: string | null;
  feeType: string | null;
  salary: number | null;
  weekoffs: number | null;
  paidLeaves: number | null;
  workTiming: string | null;
  feeAmount: number | null;
  stipendAmount: number | null;
  student: { id: string; name: string; email: string; phone: string | null; avatar: string | null; collegeName: string | null; degree: string | null; year: string | null; address: string | null; dob: string | null; employeeId: string | null };
  batch: { id: string; name: string; program: { title: string; domain: string; feeType: string; feeAmount: number; stipendAmount: number } };
  _count: { attendances: number; certificates: number; payments: number };
}

interface Batch {
  id: string;
  name: string;
  leaderId: string | null;
  leader: { name: string } | null;
  program: { title: string };
}

export default function StudentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState("");
  const [editModal, setEditModal] = useState<Enrollment | null>(null);
  const [editForm, setEditForm] = useState({ status: "", remarks: "" });
  const [studentForm, setStudentForm] = useState({ name: "", email: "", phone: "", password: "", collegeName: "", degree: "", year: "", address: "", joiningDate: "", avatar: "" });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [viewProfile, setViewProfile] = useState<Enrollment | null>(null);
  const [editError, setEditError] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transferModal, setTransferModal] = useState<Enrollment | null>(null);
  const [teamLeaders, setTeamLeaders] = useState<{ id: string; name: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    const [res, batchRes, tlRes, meRes] = await Promise.all([
      fetch("/api/enrollments"),
      fetch("/api/batches"),
      fetch("/api/users?role=teamleader"),
      fetch("/api/auth/me"),
    ]);
    if (res.ok) setEnrollments(await res.json());
    if (batchRes.ok) setBatches(await batchRes.json());
    if (tlRes.ok) setTeamLeaders(await tlRes.json());
    if (meRes.ok) { const d = await meRes.json(); setCurrentUser(d.user); }
  }, []);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "organization";
  const isTL = currentUser?.role === "teamleader";

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/enrollments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchEnrollments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove the student from this program.")) return;
    await fetch(`/api/enrollments/${id}`, { method: "DELETE" });
    fetchEnrollments();
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    setEditError("");

    // Update user details
    const userPayload: Record<string, string> = {};
    if (studentForm.name) userPayload.name = studentForm.name;
    if (studentForm.email) userPayload.email = studentForm.email;
    if (studentForm.phone) userPayload.phone = studentForm.phone;
    if (studentForm.password) userPayload.password = studentForm.password;
    if (studentForm.collegeName) userPayload.collegeName = studentForm.collegeName;
    if (studentForm.degree) userPayload.degree = studentForm.degree;
    if (studentForm.year) userPayload.year = studentForm.year;
    if (studentForm.address) userPayload.address = studentForm.address;

    const userRes = await fetch(`/api/users/${editModal.student.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPayload),
    });
    if (!userRes.ok) {
      const data = await userRes.json();
      setEditError(data.error || "Failed to update student");
      return;
    }

    // Update enrollment status + joining date
    const enrollData: Record<string, unknown> = { status: editForm.status };
    if (studentForm.joiningDate) enrollData.joiningDate = studentForm.joiningDate;
    await fetch(`/api/enrollments/${editModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrollData),
    });
    if (studentForm.avatar) {
      await fetch(`/api/users/${editModal.student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: studentForm.avatar }),
      });
    }
    setEditModal(null);
    fetchEnrollments();
  };

  const viewOfferLetter = () => {
    window.location.href = "/dashboard/letters";
  };

  const handleTransfer = async (enrollmentId: string, newBatchId: string) => {
    await fetch(`/api/enrollments/${enrollmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: newBatchId }),
    });
    setTransferModal(null);
    fetchEnrollments();
  };

  const generateCertificate = async (enrollmentId: string) => {
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId }),
    });
    if (res.ok) {
      alert("Certificate generated successfully!");
      fetchEnrollments();
    }
  };

  const filtered = enrollments.filter((e) => {
    if (filter !== "" && e.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return e.student.name.toLowerCase().includes(q) || e.student.email.toLowerCase().includes(q) || (e.student.phone && e.student.phone.includes(q)) || e.batch.program.title.toLowerCase().includes(q) || (e.student.employeeId && e.student.employeeId.toLowerCase().includes(q));
    }
    return true;
  });

  const getJoinStatus = (e: Enrollment) => {
    if (e.status !== "selected") return null;
    if (e._count.attendances > 0) return { label: "Joined", color: "bg-emerald-500/10 text-emerald-400" };
    if (e.joiningDate && new Date(e.joiningDate) < new Date()) {
      return { label: "Not Joined", color: "bg-red-500/10 text-red-400" };
    }
    return { label: "Awaiting Join", color: "bg-amber-500/10 text-amber-400" };
  };

  const getFeeLabel = (e: Enrollment) => {
    const ft = e.feeType || e.batch.program.feeType;
    if (ft === "paid") return "Student Pays";
    if (ft === "stipend") return "Company Pays Stipend";
    return "Free";
  };

  const getFilteredForExport = () => {
    return (enrollments || []) as unknown as Record<string, unknown>[];
  };

  const handleExportCSV = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    exportToCSV(data as Record<string, unknown>[], "Students", [{ key: "studentName", label: "Name" }, { key: "studentEmail", label: "Email" }, { key: "program", label: "Program" }, { key: "status", label: "Status" }]);
  };

  const handleExportPDF = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    const cols = [{ key: "studentName", label: "Name" }, { key: "studentEmail", label: "Email" }, { key: "program", label: "Program" }, { key: "status", label: "Status" }];
    exportToPDF("Students", buildTableHTML(data as Record<string, unknown>[], cols));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search students..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
          <p className="text-slate-400 text-sm">Manage enrolled students across all programs</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={() => { window.open('/api/export?type=students&format=csv', '_blank'); }} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-green-700">📥 Export CSV</button>
          <div className="relative min-w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, email, phone..." className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm text-white focus:ring-2 focus:ring-[#0EA5B8] focus:border-indigo-500" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400">✕</button>}
          </div>
          {["", "applied", "interview_scheduled", "selected", "active", "completed", "dropped", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg transition ${filter === s ? "bg-[#0EA5B8] text-white" : "bg-transparent text-slate-400 hover:bg-white/10"}`}
            >
              {s === "" ? "All" : s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-transparent border border-[#0EA5B8]/20 rounded-lg p-3">
          <span className="text-sm font-medium text-[#0EA5B8]">{selectedIds.length} selected</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-sm border rounded px-2 py-1">
            <option value="">Choose action...</option>
            <option value="bulk_select">Select All</option>
            <option value="bulk_reject">Reject All</option>
            <option value="bulk_attendance">Mark Attendance</option>
          </select>
          <button disabled={!bulkAction || bulkLoading} onClick={async () => {
            if (!bulkAction) return;
            setBulkLoading(true);
            const data: Record<string, string> = {};
            if (bulkAction === "bulk_attendance") { data.date = new Date().toISOString().split("T")[0]; data.status = "present"; }
            await fetch("/api/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: bulkAction, ids: selectedIds, data }) });
            setBulkLoading(false);
            setSelectedIds([]);
            setBulkAction("");
            fetchEnrollments();
          }} className="text-sm bg-[#0EA5B8] text-white px-3 py-1 rounded disabled:opacity-50">
            {bulkLoading ? "Processing..." : "Apply"}
          </button>
          <button onClick={() => setSelectedIds([])} className="text-sm text-slate-500 hover:text-slate-300">Clear</button>
        </div>
      )}

      {/* Edit Student Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Edit Student</h2>
            <p className="text-sm text-slate-400 mb-4">
              <span className="font-medium text-white">{editModal.student.name}</span> — {editModal.batch.program.title}
            </p>
            {editError && <p className="text-red-400 text-sm mb-3 bg-transparent p-2 rounded">{editError}</p>}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white border-b pb-1">Personal Details</h3>
              {/* Photo Upload */}
              <div className="flex items-center gap-4 pb-2">
                <div className="w-16 h-16 rounded-full bg-[#0EA5B8]/10 flex items-center justify-center text-[#22d3ee] text-xl font-bold overflow-hidden border-2 border-[#0EA5B8]/20">
                  {(studentForm.avatar || editModal.student.avatar) ? (
                    <img src={studentForm.avatar || editModal.student.avatar || ""} className="w-full h-full object-cover" alt="" />
                  ) : (
                    editModal.student.name.split(" ").map(n => n[0]).join("").substring(0, 2)
                  )}
                </div>
                <div>
                  <label className="text-xs text-[#22d3ee] hover:text-[#0EA5B8] cursor-pointer font-medium">
                    {avatarUploading ? "Uploading..." : "Change Photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setAvatarUploading(true);
                      const fd = new FormData(); fd.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: fd });
                      if (res.ok) { const d = await res.json(); setStudentForm({...studentForm, avatar: d.url}); }
                      setAvatarUploading(false);
                    }} />
                  </label>
                  {editModal.student.employeeId && <p className="text-xs text-slate-500 mt-1">ID: {editModal.student.employeeId}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Name</label>
                  <input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input type="email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                  <input value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Password (blank = no change)</label>
                  <input type="password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="Leave blank to keep" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">College</label>
                  <input value={studentForm.collegeName} onChange={(e) => setStudentForm({ ...studentForm, collegeName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Degree</label>
                  <input value={studentForm.degree} onChange={(e) => setStudentForm({ ...studentForm, degree: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Year</label>
                  <input value={studentForm.year} onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
                  <input value={studentForm.address} onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white border-b pb-1 mt-2">Joining & Enrollment</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Joining Date</label>
                  <input type="date" value={studentForm.joiningDate} onChange={(e) => setStudentForm({ ...studentForm, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-white">
                  <option value="applied">Applied</option>
                  <option value="pending">Pending</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="selected">Selected</option>
                  <option value="active">Active (Joined)</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped / Left Early</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEditSave} className="flex-1 px-4 py-2 bg-[#0EA5B8] text-white rounded-lg hover:bg-[#0891b2]">
                Save Changes
              </button>
              <button onClick={() => { setEditModal(null); setEditError(""); }} className="px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Batch Modal */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-2">Transfer Student to Another Batch</h2>
            <p className="text-sm text-slate-400 mb-4">
              <span className="font-medium text-white">{transferModal.student.name}</span> — Currently in {transferModal.batch.program.title} ({transferModal.batch.name})
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {batches.filter((b) => b.id !== transferModal.batch.id).map((batch) => (
                <button key={batch.id} onClick={() => handleTransfer(transferModal.id, batch.id)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] hover:bg-transparent text-left">
                  <div>
                    <div className="text-sm font-medium text-white">{batch.program.title}</div>
                    <div className="text-xs text-slate-500">{batch.name}</div>
                  </div>
                  <span className="text-xs text-[#22d3ee] font-medium">Transfer Here</span>
                </button>
              ))}
            </div>
            <button onClick={() => setTransferModal(null)} className="mt-4 w-full px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Student Profile</h2>
              <button onClick={() => setViewProfile(null)} className="text-slate-500 hover:text-slate-400 text-xl">&times;</button>
            </div>
            <div className="flex items-center gap-4 mb-5 pb-4 border-b">
              <div className="w-20 h-20 rounded-full bg-[#0EA5B8]/10 flex items-center justify-center text-[#22d3ee] text-2xl font-bold overflow-hidden border-2 border-[#0EA5B8]/20">
                {viewProfile.student.avatar ? (
                  <img src={viewProfile.student.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  viewProfile.student.name.split(" ").map(n => n[0]).join("").substring(0, 2)
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{viewProfile.student.name}</h3>
                <p className="text-sm text-slate-500">{viewProfile.student.email}</p>
                {viewProfile.student.phone && <p className="text-sm text-slate-500">{viewProfile.student.phone}</p>}
                {viewProfile.student.employeeId && <p className="text-xs text-[#22d3ee] font-medium mt-1">ID: {viewProfile.student.employeeId}</p>}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-500 text-xs">Program</span><p className="font-medium text-white">{viewProfile.batch.program.title}</p></div>
                <div><span className="text-slate-500 text-xs">Batch</span><p className="font-medium text-white">{viewProfile.batch.name}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-500 text-xs">Status</span><p><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(viewProfile.status)}`}>{viewProfile.status.replace("_", " ")}</span></p></div>
                <div><span className="text-slate-500 text-xs">Joining Date</span><p className="font-medium text-white">{viewProfile.joiningDate ? formatDate(viewProfile.joiningDate) : "—"}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-500 text-xs">College</span><p className="font-medium text-white">{viewProfile.student.collegeName || "—"}</p></div>
                <div><span className="text-slate-500 text-xs">Degree</span><p className="font-medium text-white">{viewProfile.student.degree || "—"}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-500 text-xs">Year</span><p className="font-medium text-white">{viewProfile.student.year || "—"}</p></div>
                <div><span className="text-slate-500 text-xs">DOB</span><p className="font-medium text-white">{viewProfile.student.dob ? formatDate(viewProfile.student.dob) : "—"}</p></div>
              </div>
              <div><span className="text-slate-500 text-xs">Address</span><p className="font-medium text-white">{viewProfile.student.address || "—"}</p></div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                <div className="text-center"><span className="text-slate-500 text-xs block">Attendance</span><p className="font-bold text-[#22d3ee] text-lg">{viewProfile._count.attendances}</p></div>
                <div className="text-center"><span className="text-slate-500 text-xs block">Certificates</span><p className="font-bold text-emerald-400 text-lg">{viewProfile._count.certificates}</p></div>
                <div className="text-center"><span className="text-slate-500 text-xs block">Payments</span><p className="font-bold text-amber-600 text-lg">{viewProfile._count.payments}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div><span className="text-slate-500 text-xs">Fee Type</span><p className="font-medium text-white">{getFeeLabel(viewProfile)}</p></div>
                <div><span className="text-slate-500 text-xs">Work Timing</span><p className="font-medium text-white">{viewProfile.workTiming || "—"}</p></div>
              </div>
            </div>
            <button onClick={() => setViewProfile(null)} className="mt-5 w-full px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">
              Close
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 border border-white/[0.06] text-center">
          <p className="text-4xl mb-4">👥</p>
          <p className="text-slate-400">No students found. Students will appear here after they enroll.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-transparent">
                <tr>
                  {isAdmin && <th className="px-3 py-3"><input type="checkbox" onChange={e => { if (e.target.checked) setSelectedIds(filtered.map(e2 => e2.id)); else setSelectedIds([]); }} checked={selectedIds.length === filtered.length && filtered.length > 0} /></th>}
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Employee ID</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Program</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Joining Date</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Attendance</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((enrollment) => {
                  const joinStatus = getJoinStatus(enrollment);
                  return (
                    <tr key={enrollment.id} className={`hover:bg-transparent ${selectedIds.includes(enrollment.id) ? 'bg-transparent' : ''}`}>
                      {isAdmin && <td className="px-3 py-4"><input type="checkbox" checked={selectedIds.includes(enrollment.id)} onChange={e => { if (e.target.checked) setSelectedIds([...selectedIds, enrollment.id]); else setSelectedIds(selectedIds.filter(x => x !== enrollment.id)); }} /></td>}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0EA5B8]/10 flex items-center justify-center text-[#22d3ee] text-sm font-bold shrink-0 overflow-hidden">
                            {enrollment.student.avatar ? (
                              <img src={enrollment.student.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                              enrollment.student.name.split(" ").map(n => n[0]).join("").substring(0, 2)
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">{enrollment.student.name}</div>
                            <div className="text-xs text-slate-500">{enrollment.student.email}</div>
                            {enrollment.student.phone && <div className="text-xs text-slate-500">{enrollment.student.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#22d3ee] font-medium">{enrollment.student.employeeId || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{enrollment.batch.program.title}</div>
                        <div className="text-xs text-slate-500">{enrollment.batch.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400">{enrollment.joiningDate ? new Date(enrollment.joiningDate).toLocaleDateString("en-IN") : "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(enrollment.status)}`}>
                          {enrollment.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{enrollment._count.attendances} days</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => setViewProfile(enrollment)}
                            className="text-xs bg-transparent text-slate-300 px-2 py-1 rounded hover:bg-transparent border"
                          >
                            View
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setEditModal(enrollment);
                                  setEditForm({ status: enrollment.status, remarks: "" });
                                  setStudentForm({
                                    name: enrollment.student.name || "",
                                    email: enrollment.student.email || "",
                                    phone: enrollment.student.phone || "",
                                    password: "",
                                    collegeName: enrollment.student.collegeName || "",
                                    degree: enrollment.student.degree || "",
                                    year: enrollment.student.year || "",
                                    address: enrollment.student.address || "",
                                    joiningDate: enrollment.joiningDate ? new Date(enrollment.joiningDate).toISOString().split("T")[0] : "",
                                    avatar: enrollment.student.avatar || "",
                                  });
                                  setEditError("");
                                }}
                                className="text-xs bg-transparent text-slate-300 px-2 py-1 rounded hover:bg-transparent border"
                              >
                                Edit
                              </button>
                              {enrollment.status === "selected" && enrollment._count.attendances === 0 && (
                                <button onClick={() => updateStatus(enrollment.id, "rejected")}
                                  className="text-xs bg-transparent text-red-400 px-2 py-1 rounded hover:bg-red-500/10">
                                  Reject
                                </button>
                              )}
                              {(enrollment.status === "selected" || enrollment.status === "active") && (
                                <button onClick={() => updateStatus(enrollment.id, "dropped")}
                                  className="text-xs bg-transparent text-orange-400 px-2 py-1 rounded hover:bg-orange-500/10">
                                  Mark Dropped
                                </button>
                              )}
                              {enrollment.status === "selected" && (
                                <button onClick={() => viewOfferLetter()}
                                  className="text-xs bg-transparent text-[#22d3ee] px-2 py-1 rounded hover:bg-[#0EA5B8]/10">
                                  Offer Letter
                                </button>
                              )}
                              {enrollment.status === "completed" && enrollment._count.certificates === 0 && (
                                <button onClick={() => generateCertificate(enrollment.id)}
                                  className="text-xs bg-transparent text-amber-400 px-2 py-1 rounded hover:bg-amber-500/10">
                                  Certificate
                                </button>
                              )}
                              {(enrollment.status === "active" || enrollment.status === "selected") && (
                                <button onClick={() => setTransferModal(enrollment)}
                                  className="text-xs bg-transparent text-[#60a5fa] px-2 py-1 rounded hover:bg-blue-500/10">
                                  Transfer Batch
                                </button>
                              )}
                              <button onClick={() => handleDelete(enrollment.id)}
                                className="text-xs bg-transparent text-red-400 px-2 py-1 rounded hover:bg-red-500/10">
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
