"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface StudentDoc {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  status: string;
  createdAt: string;
}

interface InterviewInfo {
  id: string;
  scheduledAt: string;
  duration: number;
  mode: string;
  meetLink: string | null;
  location: string | null;
  status: string;
  result: string | null;
}

interface Enrollment {
  id: string;
  status: string;
  createdAt: string;
  student: { id: string; name: string; email: string; phone: string; avatar: string | null; collegeName: string; degree: string; year: string; address: string | null; dob: string | null; employeeId: string | null };
  batch: { program: { title: string; domain: string; mode: string } };
  interviews: InterviewInfo[];
  _count: { interviews: number };
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState("applied");
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState<Enrollment | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: "", time: "10:00", mode: "online", meetLink: "", duration: "30",
  });
  const [rejectModal, setRejectModal] = useState<Enrollment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewModal, setViewModal] = useState<Enrollment | null>(null);
  const [viewDocs, setViewDocs] = useState<StudentDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [editLinkModal, setEditLinkModal] = useState<{ interviewId: string; link: string } | null>(null);

  // Check role and redirect students
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(data => {
      if (data?.user?.role === "student") {
        router.replace("/dashboard");
      } else {
        setUserRole(data?.user?.role || null);
      }
    }).catch(() => {});
  }, [router]);

  const fetchApplications = useCallback(async () => {
    const res = await fetch(`/api/enrollments?status=${filter}`);
    const data = await res.json();
    setEnrollments(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { if (userRole && userRole !== "student") fetchApplications(); }, [fetchApplications, userRole]);

  const openViewModal = async (e: Enrollment) => {
    setViewModal(e);
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/documents?userId=${e.student.id}`);
      if (res.ok) {
        const docs = await res.json();
        setViewDocs(docs);
      }
    } catch { /* ignore */ }
    setLoadingDocs(false);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await fetch(`/api/enrollments/${rejectModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected", adminRemarks: rejectReason }),
    });
    if (rejectReason) {
      fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: rejectModal.student.email,
          subject: `Application Update — ${rejectModal.batch.program.title}`,
          html: `<p>Dear ${rejectModal.student.name},</p><p>We regret to inform you that your application for <strong>${rejectModal.batch.program.title}</strong> has not been approved.</p><p><strong>Reason:</strong> ${rejectReason}</p><p>We encourage you to apply again in the future.</p><p>Best regards,<br/>KKHS Media Private Limited</p>`,
        }),
      }).catch(() => {});
    }
    setRejectModal(null);
    setRejectReason("");
    fetchApplications();
  };

  const handleScheduleInterview = async () => {
    if (!scheduleModal || !scheduleForm.date || !scheduleForm.time) return;
    const scheduledAt = new Date(`${scheduleForm.date}T${scheduleForm.time}`).toISOString();

    await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentId: scheduleModal.id,
        scheduledAt,
        duration: parseInt(scheduleForm.duration),
        mode: scheduleForm.mode,
        meetLink: scheduleForm.meetLink || null,
        location: scheduleForm.mode === "offline" ? (scheduleForm as Record<string, string>).location || null : null,
      }),
    });
    setScheduleModal(null);
    setScheduleForm({ date: "", time: "10:00", mode: "online", meetLink: "", duration: "30" });
    alert("Interview scheduled! Student ko email notification bhi gaya hai.");
    fetchApplications();
  };

  const handleUpdateMeetLink = async () => {
    if (!editLinkModal) return;
    await fetch("/api/interviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editLinkModal.interviewId, meetLink: editLinkModal.link }),
    });
    setEditLinkModal(null);
    fetchApplications();
  };

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Applications</h1>
          <p className="text-gray-600">Review student applications, documents, and schedule interviews</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["applied", "interview_scheduled", "shortlisted", "selected", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === s ? "bg-indigo-600 text-white" : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            {s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* View Details Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Applicant Details</h2>
              <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600 overflow-hidden">
                {viewModal.student.avatar ? (
                  <img src={viewModal.student.avatar.startsWith("http") ? viewModal.student.avatar : `/uploads/${viewModal.student.avatar}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  viewModal.student.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewModal.student.name}</h3>
                <p className="text-sm text-indigo-600 font-medium">{viewModal.batch.program.title} ({viewModal.batch.program.mode})</p>
                <p className="text-xs text-gray-500">Applied: {new Date(viewModal.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>

            {/* Personal Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                <p className="text-sm text-gray-900 font-medium">{viewModal.student.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
                <p className="text-sm text-gray-900 font-medium">{viewModal.student.phone || "Not provided"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase font-medium">College / Institution</p>
                <p className="text-sm text-gray-900 font-medium">{viewModal.student.collegeName || "Not provided"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase font-medium">Degree</p>
                <p className="text-sm text-gray-900 font-medium">{viewModal.student.degree || "Not provided"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase font-medium">Year</p>
                <p className="text-sm text-gray-900 font-medium">{viewModal.student.year || "Not provided"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase font-medium">Date of Birth</p>
                <p className="text-sm text-gray-900 font-medium">{viewModal.student.dob ? new Date(viewModal.student.dob).toLocaleDateString("en-IN") : "Not provided"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-500 uppercase font-medium">Address</p>
                <p className="text-sm text-gray-900 font-medium">{viewModal.student.address || "Not provided"}</p>
              </div>
              {viewModal.student.employeeId && (
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-medium">Employee ID</p>
                  <p className="text-sm text-indigo-600 font-medium">{viewModal.student.employeeId}</p>
                </div>
              )}
            </div>

            {/* Documents / Resume Section */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>Uploaded Documents</span>
                {loadingDocs && <span className="text-xs text-gray-400">Loading...</span>}
              </h3>
              {!loadingDocs && viewDocs.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  No documents uploaded yet. Student has not submitted resume or other documents.
                </div>
              )}
              {viewDocs.length > 0 && (
                <div className="space-y-2">
                  {viewDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          doc.type === "resume" ? "bg-blue-100 text-blue-700" :
                          doc.type === "marksheet" ? "bg-green-100 text-green-700" :
                          doc.type === "id_proof" ? "bg-orange-100 text-orange-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {doc.type === "resume" ? "CV" : doc.type === "marksheet" ? "MS" : doc.type === "id_proof" ? "ID" : doc.type.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.title || doc.type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                          <p className="text-xs text-gray-500">Uploaded: {new Date(doc.createdAt).toLocaleDateString("en-IN")} | Status: <span className={doc.status === "approved" ? "text-green-600" : doc.status === "rejected" ? "text-red-600" : "text-yellow-600"}>{doc.status}</span></p>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl.startsWith("http") ? doc.fileUrl : doc.fileUrl.startsWith("/uploads/") ? doc.fileUrl : `/uploads/${doc.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition"
                      >
                        View / Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interview Details (if scheduled) */}
            {viewModal.interviews && viewModal.interviews.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Interview Details</h3>
                {viewModal.interviews.map((iv) => (
                  <div key={iv.id} className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase">Date</p>
                        <p className="text-sm font-semibold text-gray-900">{new Date(iv.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase">Time</p>
                        <p className="text-sm font-semibold text-gray-900">{new Date(iv.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase">Duration</p>
                        <p className="text-sm font-semibold text-gray-900">{iv.duration} min</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase">Mode</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{iv.mode}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {iv.meetLink ? (
                        <div className="flex items-center gap-2">
                          <a href={iv.meetLink} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline font-medium">
                            {iv.meetLink}
                          </a>
                          <button onClick={() => setEditLinkModal({ interviewId: iv.id, link: iv.meetLink || "" })}
                            className="text-xs text-gray-500 hover:text-indigo-600 underline">(Edit)</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditLinkModal({ interviewId: iv.id, link: "" })}
                          className="text-sm text-indigo-600 hover:underline font-medium">+ Add Meeting Link</button>
                      )}
                      {iv.location && <p className="text-xs text-gray-600">Location: {iv.location}</p>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        iv.result === "selected" ? "bg-green-100 text-green-700" :
                        iv.result === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{iv.result || iv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {filter === "applied" && (
                <>
                  <button
                    onClick={() => { setViewModal(null); setScheduleModal(viewModal); }}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                  >
                    Schedule Interview
                  </button>
                  <button
                    onClick={() => { setViewModal(null); setRejectModal(viewModal); setRejectReason(""); }}
                    className="px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium text-sm"
                  >
                    Reject
                  </button>
                </>
              )}
              {(filter === "interview_scheduled" || filter === "shortlisted") && viewModal.interviews?.length > 0 && !viewModal.interviews[0].meetLink && (
                <button onClick={() => setEditLinkModal({ interviewId: viewModal.interviews[0].id, link: "" })}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
                  Add Meeting Link
                </button>
              )}
              <button onClick={() => setViewModal(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Schedule Interview</h2>
            <p className="text-sm text-gray-600 mb-4">
              for <span className="font-medium text-gray-900">{scheduleModal.student.name}</span> — {scheduleModal.batch.program.title}
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
                    min={new Date().toISOString().split("T")[0]}
                    required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
                    required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                  <select value={scheduleForm.mode}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, mode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                    <option value="online">Online</option>
                    <option value="offline">Offline (In-person)</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <select value={scheduleForm.duration}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, duration: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hour</option>
                  </select>
                </div>
              </div>
              {scheduleForm.mode === "online" || scheduleForm.mode === "phone" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (optional)</label>
                  <input type="url" value={scheduleForm.meetLink}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetLink: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
                    placeholder="https://meet.google.com/... or Zoom link" />
                  <p className="text-xs text-gray-500 mt-1">Student ko ye link dikhega. Baad mein bhi add/edit kar sakte ho.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address</label>
                  <input type="text" value={(scheduleForm as Record<string, string>).location || ""}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value } as typeof scheduleForm)}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
                    placeholder="e.g., Office - 3rd Floor, Tower B, Sector 62, Noida" />
                  <p className="text-xs text-gray-500 mt-1">Offline interview ka address student ko dikhega.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleScheduleInterview}
                disabled={!scheduleForm.date || !scheduleForm.time}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                Schedule Interview
              </button>
              <button onClick={() => setScheduleModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-gray-500">No applications with status &quot;{filter.replace("_", " ")}&quot;</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((e) => (
            <div key={e.id} className="bg-white rounded-xl p-6 border hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0 overflow-hidden">
                    {e.student.avatar ? (
                      <img src={e.student.avatar.startsWith("http") ? e.student.avatar : `/uploads/${e.student.avatar}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      e.student.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{e.student.name}</h3>
                    <p className="text-sm text-gray-600">{e.student.email} | {e.student.phone}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {e.student.collegeName} — {e.student.degree} ({e.student.year} Year)
                    </p>
                    <p className="text-sm text-indigo-600 mt-2 font-medium">
                      Applied for: {e.batch.program.title} ({e.batch.program.mode})
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Applied: {new Date(e.createdAt).toLocaleDateString("en-IN")}</p>
                    {/* Interview details for scheduled students */}
                    {e.interviews && e.interviews.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                        <span className="bg-blue-50 px-2 py-1 rounded">📅 {new Date(e.interviews[0].scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span className="bg-purple-50 px-2 py-1 rounded">🕐 {new Date(e.interviews[0].scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="bg-green-50 px-2 py-1 rounded">⏱ {e.interviews[0].duration} min</span>
                        <span className="bg-orange-50 px-2 py-1 rounded capitalize">📍 {e.interviews[0].mode}</span>
                        {e.interviews[0].meetLink ? (
                          <a href={e.interviews[0].meetLink} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 px-2 py-1 rounded text-indigo-600 hover:underline">🔗 Meeting Link</a>
                        ) : (
                          <span className="bg-yellow-50 px-2 py-1 rounded text-yellow-700">⚠ No link yet</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => openViewModal(e)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 font-medium"
                  >
                    View Details
                  </button>
                  {filter === "applied" && (
                    <>
                      <button
                        onClick={() => setScheduleModal(e)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                      >
                        Schedule Interview
                      </button>
                      <button
                        onClick={() => { setRejectModal(e); setRejectReason(""); }}
                        className="px-4 py-2 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {filter === "interview_scheduled" && e.interviews?.length > 0 && (
                    <button
                      onClick={() => setEditLinkModal({ interviewId: e.interviews[0].id, link: e.interviews[0].meetLink || "" })}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-lg hover:bg-indigo-100 font-medium"
                    >
                      {e.interviews[0].meetLink ? "Edit Link" : "+ Add Link"}
                    </button>
                  )}
                  {filter === "shortlisted" && (
                    <button
                      onClick={() => {
                        window.location.href = `/dashboard/interviews?select=${e.id}`;
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                      Select & Send Offer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Meeting Link Modal */}
      {editLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{editLinkModal.link ? "Edit Meeting Link" : "Add Meeting Link"}</h2>
            <p className="text-sm text-gray-600 mb-4">Student ko ye link dikhega interview join karne ke liye.</p>
            <input
              type="url"
              value={editLinkModal.link}
              onChange={(e) => setEditLinkModal({ ...editLinkModal, link: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 mb-4"
              placeholder="https://meet.google.com/abc-xyz or Zoom link"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={handleUpdateMeetLink}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                Save Link
              </button>
              <button onClick={() => setEditLinkModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Reason */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Reject Application</h2>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{rejectModal.student.name}</strong> — {rejectModal.batch.program.title}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
                rows={3}
                placeholder="e.g., Resume not submitted, Incomplete profile, Not matching requirements..."
                required
              />
              <p className="text-xs text-gray-400 mt-1">This reason will be emailed to the student.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleReject} disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                Reject & Send Email
              </button>
              <button onClick={() => setRejectModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
