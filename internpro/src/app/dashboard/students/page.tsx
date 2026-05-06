"use client";

import { useState, useEffect, useCallback } from "react";
import { getStatusColor, formatDate } from "@/lib/utils";

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
  student: { id: string; name: string; email: string; phone: string | null; avatar: string | null; collegeName: string | null; degree: string | null; year: string | null; address: string | null };
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
  const [studentForm, setStudentForm] = useState({ name: "", email: "", phone: "", password: "", collegeName: "", degree: "", year: "", address: "" });
  const [editError, setEditError] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transferModal, setTransferModal] = useState<Enrollment | null>(null);
  const [teamLeaders, setTeamLeaders] = useState<{ id: string; name: string }[]>([]);

  const fetchEnrollments = useCallback(async () => {
    const [res, batchRes, tlRes] = await Promise.all([
      fetch("/api/enrollments"),
      fetch("/api/batches"),
      fetch("/api/users?role=teamleader"),
    ]);
    if (res.ok) setEnrollments(await res.json());
    if (batchRes.ok) setBatches(await batchRes.json());
    if (tlRes.ok) setTeamLeaders(await tlRes.json());
  }, []);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

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

    // Update enrollment status
    await fetch(`/api/enrollments/${editModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editForm.status }),
    });
    setEditModal(null);
    fetchEnrollments();
  };

  const generateOfferLetter = (enrollmentId: string) => {
    window.open(`/api/documents/offer-letter?enrollmentId=${enrollmentId}`, "_blank");
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

  const filtered = enrollments.filter((e) =>
    filter === "" || e.status === filter
  );

  const getJoinStatus = (e: Enrollment) => {
    if (e.status !== "selected") return null;
    if (e._count.attendances > 0) return { label: "Joined", color: "bg-green-100 text-green-700" };
    if (e.joiningDate && new Date(e.joiningDate) < new Date()) {
      return { label: "Not Joined", color: "bg-red-100 text-red-700" };
    }
    return { label: "Awaiting Join", color: "bg-yellow-100 text-yellow-700" };
  };

  const getFeeLabel = (e: Enrollment) => {
    const ft = e.feeType || e.batch.program.feeType;
    if (ft === "paid") return "Student Pays";
    if (ft === "stipend") return "Company Pays Stipend";
    return "Free";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 text-sm">Manage enrolled students across all programs</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["", "applied", "interview_scheduled", "selected", "active", "completed", "dropped", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg transition ${filter === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s === "" ? "All" : s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Edit Student Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Student</h2>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium text-gray-900">{editModal.student.name}</span> — {editModal.batch.program.title}
            </p>
            {editError && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{editError}</p>}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 border-b pb-1">Personal Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password (blank = no change)</label>
                  <input type="password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Leave blank to keep" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">College</label>
                  <input value={studentForm.collegeName} onChange={(e) => setStudentForm({ ...studentForm, collegeName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Degree</label>
                  <input value={studentForm.degree} onChange={(e) => setStudentForm({ ...studentForm, degree: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                  <input value={studentForm.year} onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                  <input value={studentForm.address} onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 border-b pb-1 mt-2">Enrollment Status</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
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
              <button onClick={handleEditSave} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Save Changes
              </button>
              <button onClick={() => { setEditModal(null); setEditError(""); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Batch Modal */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Transfer Student to Another Batch</h2>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium text-gray-900">{transferModal.student.name}</span> — Currently in {transferModal.batch.program.title} ({transferModal.batch.name})
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {batches.filter((b) => b.id !== transferModal.batch.id).map((batch) => (
                <button key={batch.id} onClick={() => handleTransfer(transferModal.id, batch.id)}
                  className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-indigo-50 text-left">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{batch.program.title}</div>
                    <div className="text-xs text-gray-500">{batch.name}</div>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Transfer Here</span>
                </button>
              ))}
            </div>
            <button onClick={() => setTransferModal(null)} className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <p className="text-4xl mb-4">👥</p>
          <p className="text-gray-600">No students found. Students will appear here after they enroll.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Program</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Fee Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Join Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Attendance</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Team Leader</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((enrollment) => {
                  const joinStatus = getJoinStatus(enrollment);
                  return (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0 overflow-hidden">
                            {enrollment.student.avatar ? (
                              <img src={enrollment.student.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                              enrollment.student.name.split(" ").map(n => n[0]).join("").substring(0, 2)
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{enrollment.student.name}</div>
                            <div className="text-xs text-gray-500">{enrollment.student.email}</div>
                            {enrollment.student.phone && <div className="text-xs text-gray-400">{enrollment.student.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{enrollment.batch.program.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-600">{getFeeLabel(enrollment)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(enrollment.status)}`}>
                          {enrollment.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {joinStatus ? (
                          <span className={`text-xs px-2 py-1 rounded-full ${joinStatus.color}`}>
                            {joinStatus.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{enrollment._count.attendances} days</td>
                      <td className="px-6 py-4">
                        {(() => {
                          const batch = batches.find((b) => b.id === enrollment.batch.id);
                          const currentTL = batch?.leader?.name;
                          return (
                            <div>
                              {currentTL && <div className="text-xs text-gray-700 font-medium mb-1">{currentTL}</div>}
                              <select
                                value={batch?.leaderId || ""}
                                onChange={(e) => {
                                  const tlBatches = batches.filter((b) => b.leaderId === e.target.value);
                                  if (tlBatches.length > 0 && tlBatches[0].id !== enrollment.batch.id) {
                                    handleTransfer(enrollment.id, tlBatches[0].id);
                                  }
                                }}
                                className="text-xs px-1 py-0.5 border rounded text-gray-900 max-w-[120px]"
                              >
                                <option value="">No TL</option>
                                {teamLeaders.map((tl) => (
                                  <option key={tl.id} value={tl.id}>{tl.name}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
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
                              });
                              setEditError("");
                            }}
                            className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded hover:bg-gray-100 border"
                          >
                            Edit
                          </button>
                          {enrollment.status === "selected" && enrollment._count.attendances === 0 && (
                            <button onClick={() => updateStatus(enrollment.id, "rejected")}
                              className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">
                              Reject
                            </button>
                          )}
                          {(enrollment.status === "selected" || enrollment.status === "active") && (
                            <button onClick={() => updateStatus(enrollment.id, "dropped")}
                              className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded hover:bg-orange-100">
                              Mark Dropped
                            </button>
                          )}
                          <button onClick={() => generateOfferLetter(enrollment.id)}
                            className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100">
                            Offer Letter
                          </button>
                          {enrollment.status === "completed" && enrollment._count.certificates === 0 && (
                            <button onClick={() => generateCertificate(enrollment.id)}
                              className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-100">
                              Certificate
                            </button>
                          )}
                          {(enrollment.status === "active" || enrollment.status === "selected") && (
                            <button onClick={() => setTransferModal(enrollment)}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">
                              Transfer Batch
                            </button>
                          )}
                          <button onClick={() => handleDelete(enrollment.id)}
                            className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">
                            Delete
                          </button>
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
