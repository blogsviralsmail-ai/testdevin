"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import DataToolbar from "@/components/DataToolbar";
import { exportToCSV, exportToPDF, buildTableHTML } from "@/lib/export-utils";
interface Interview {
  id: string;
  scheduledAt: string;
  duration: number;
  mode: string;
  meetLink: string | null;
  status: string;
  feedback: string | null;
  result: string | null;
  enrollment: {
    id: string;
    studentId: string;
    batchId: string;
    student: { id: string; name: string; email: string; phone: string; collegeName: string; degree: string };
    batch: { id: string; name: string; program: { id: string; title: string; domain: string } };
  };
  interviewer: { name: string; email: string } | null;
}

interface ProgramBatch {
  id: string;
  title: string;
  batches: { id: string; name: string }[];
}

export default function InterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [editMeetLink, setEditMeetLink] = useState<{ id: string; link: string } | null>(null);
  const [editEnrollment, setEditEnrollment] = useState<{ enrollmentId: string; salary: string; weekoffs: string; paidLeaves: string; workTiming: string; joiningDate: string; feeType: string; feeAmount: string; stipendAmount: string } | null>(null);
  const [viewDetails, setViewDetails] = useState<Interview | null>(null);
  const [studentDocs, setStudentDocs] = useState<{documents: {id: string; type: string; url: string; fileUrl?: string; name: string; title?: string}[]; resume?: string} | null>(null);

  const getNextDay = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const [selectionForm, setSelectionForm] = useState({
    weekoffs: "4", paidLeaves: "1",
    workTiming: "9:30 AM - 6:30 PM", joiningDate: getNextDay(),
    feeType: "stipend", feeAmount: "0", stipendAmount: "5000",
    programId: "", batchId: "", mode: "",
  });
  const [programs, setPrograms] = useState<ProgramBatch[]>([]);

  const fetchInterviews = useCallback(async () => {
    const res = await fetch("/api/interviews");
    const data = await res.json();
    setInterviews(data);
    setLoading(false);
  }, []);

  const [userRole, setUserRole] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(data => {
      if (data?.user?.role) setUserRole(data.user.role);
    }).catch(() => {});
  }, [router]);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  useEffect(() => {
    fetch("/api/batches").then(r => r.ok ? r.json() : []).then(batches => {
      const programMap = new Map<string, ProgramBatch>();
      for (const b of batches) {
        const prog = b.program;
        if (!prog) continue;
        if (!programMap.has(prog.id)) {
          programMap.set(prog.id, { id: prog.id, title: prog.title, batches: [] });
        }
        programMap.get(prog.id)!.batches.push({ id: b.id, name: b.name });
      }
      setPrograms(Array.from(programMap.values()));
    }).catch(() => {});
  }, []);

  const handleResult = async (id: string, enrollmentId: string, result: string) => {
    if (result === "selected") {
      // Pre-fill current program/batch from interview's enrollment
      const interview = interviews.find(i => i.enrollment.id === enrollmentId);
      if (interview) {
        setSelectionForm(prev => ({
          ...prev,
          programId: interview.enrollment.batch.program.id,
          batchId: interview.enrollment.batchId,
        }));
      }
      setSelectingId(enrollmentId);
      return;
    }
    await fetch("/api/interviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "completed", result }),
    });
    fetchInterviews();
  };

  const handleSelect = async () => {
    if (!selectingId) return;
    if (!selectionForm.joiningDate) {
      alert("Joining date is required!");
      return;
    }
    if (!selectionForm.batchId) {
      alert("Program & Batch selection is required!");
      return;
    }
    if (!selectionForm.mode) {
      alert("Mode (Online/Offline/Hybrid) selection is required!");
      return;
    }
    // Update enrollment batch and mode
    await fetch(`/api/enrollments/${selectingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: selectionForm.batchId, preferredMode: selectionForm.mode }),
    });
    // Calculate salary from stipend
    const stipendVal = selectionForm.feeType === "stipend" ? parseFloat(selectionForm.stipendAmount) : 0;
    await fetch("/api/offer-letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentId: selectingId,
        salary: stipendVal,
        weekoffs: parseInt(selectionForm.weekoffs),
        paidLeaves: parseInt(selectionForm.paidLeaves),
        workTiming: selectionForm.workTiming,
        joiningDate: selectionForm.joiningDate,
        feeType: selectionForm.feeType,
        feeAmount: parseFloat(selectionForm.feeAmount),
        stipendAmount: parseFloat(selectionForm.stipendAmount),
        mode: selectionForm.mode,
      }),
    });
    setSelectingId(null);
    fetchInterviews();
  };

  const handleEditEnrollment = async () => {
    if (!editEnrollment) return;
    await fetch(`/api/enrollments/${editEnrollment.enrollmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salary: parseFloat(editEnrollment.salary),
        weekoffs: parseInt(editEnrollment.weekoffs),
        paidLeaves: parseInt(editEnrollment.paidLeaves),
        workTiming: editEnrollment.workTiming,
        joiningDate: editEnrollment.joiningDate,
        feeType: editEnrollment.feeType,
        feeAmount: parseFloat(editEnrollment.feeAmount),
        stipendAmount: parseFloat(editEnrollment.stipendAmount),
      }),
    });
    setEditEnrollment(null);
    fetchInterviews();
  };

  const handleUpdateMeetLink = async () => {
    if (!editMeetLink) return;
    await fetch("/api/interviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editMeetLink.id, meetLink: editMeetLink.link }),
    });
    setEditMeetLink(null);
    fetchInterviews();
  };

  if (loading) return <div className="p-6 text-slate-300">Loading...</div>;

  const getFilteredForExport = () => {
    return (interviews || []) as unknown as Record<string, unknown>[];
  };

  const handleExportCSV = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    exportToCSV(data as Record<string, unknown>[], "Interviews", [{ key: "studentName", label: "Student" }, { key: "program", label: "Program" }, { key: "scheduledAt", label: "Scheduled" }, { key: "status", label: "Status" }]);
  };

  const handleExportPDF = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    const cols = [{ key: "studentName", label: "Student" }, { key: "program", label: "Program" }, { key: "scheduledAt", label: "Scheduled" }, { key: "status", label: "Status" }];
    exportToPDF("Interviews", buildTableHTML(data as Record<string, unknown>[], cols));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{userRole === "student" ? "My Interviews" : "Interviews"}</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search interviews..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
        <p className="text-slate-400">{userRole === "student" ? "View your scheduled interviews and meeting details" : "Manage scheduled interviews and select candidates"}</p>
      </div>

      {/* Search */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border p-4 mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by student name, program..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-white focus:ring-2 focus:ring-[#0EA5B8] focus:border-indigo-500" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400">✕</button>}
        </div>
      </div>

      {/* Selection Modal */}
      {selectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Select Candidate — Fill Details</h2>
            <div className="space-y-3">
              <div className="bg-transparent border border-[#0EA5B8]/20 rounded-lg p-3">
                <label className="block text-sm font-bold text-[#0EA5B8] mb-1">Program <span className="text-red-500">*</span></label>
                <select value={selectionForm.programId} onChange={(e) => {
                  const pid = e.target.value;
                  setSelectionForm(prev => ({ ...prev, programId: pid, batchId: "" }));
                }} className="w-full px-3 py-2 rounded-lg border text-white mb-2">
                  <option value="">-- Select Program --</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <label className="block text-sm font-bold text-[#0EA5B8] mb-1">Batch <span className="text-red-500">*</span></label>
                <select value={selectionForm.batchId} onChange={(e) => setSelectionForm(prev => ({ ...prev, batchId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-white">
                  <option value="">-- Select Batch --</option>
                  {programs.find(p => p.id === selectionForm.programId)?.batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <p className="text-xs text-[#22d3ee] mt-1">Program and Batch must be selected before proceeding</p>
                <label className="block text-sm font-bold text-[#0EA5B8] mb-1 mt-2">Mode <span className="text-red-500">*</span></label>
                <select value={selectionForm.mode || ""} onChange={(e) => setSelectionForm(prev => ({ ...prev, mode: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-white">
                  <option value="">-- Select Mode --</option>
                  <option value="online">Online (Work from Home)</option>
                  <option value="offline">Offline (Work from Office)</option>
                  <option value="hybrid">Hybrid (Online + Offline)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Weekly Offs (days)</label>
                  <input type="number" value={selectionForm.weekoffs} onChange={(e) => setSelectionForm({...selectionForm, weekoffs: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Paid Leaves/month</label>
                  <input type="number" value={selectionForm.paidLeaves} onChange={(e) => setSelectionForm({...selectionForm, paidLeaves: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Work Timing</label>
                <input type="text" value={selectionForm.workTiming} onChange={(e) => setSelectionForm({...selectionForm, workTiming: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Joining Date <span className="text-red-500">*</span></label>
                <input type="date" value={selectionForm.joiningDate} onChange={(e) => setSelectionForm({...selectionForm, joiningDate: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-white" required />
                <p className="text-xs text-slate-500 mt-1">Required — agar blank rahe toh next day auto-fill hoti hai</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fee Type</label>
                <select value={selectionForm.feeType} onChange={(e) => setSelectionForm({...selectionForm, feeType: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-white">
                  <option value="free">Free — No charge, no stipend</option>
                  <option value="paid">Paid — Student pays fee to company</option>
                  <option value="stipend">Stipend — Company pays student monthly</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {selectionForm.feeType === "free" && "No payment required — completely free internship"}
                  {selectionForm.feeType === "paid" && "Student company ko fee dega — training ke liye payment"}
                  {selectionForm.feeType === "stipend" && "Company student ko monthly stipend/salary degi — as a salary/stipend"}
                </p>
              </div>
              {selectionForm.feeType === "paid" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Fee Amount (₹) — Student will pay this</label>
                  <input type="number" value={selectionForm.feeAmount} onChange={(e) => setSelectionForm({...selectionForm, feeAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-white" />
                </div>
              )}
              {selectionForm.feeType === "stipend" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Stipend Amount (₹/month) — Company will pay student</label>
                  <input type="number" value={selectionForm.stipendAmount} onChange={(e) => setSelectionForm({...selectionForm, stipendAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-white" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSelect} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Select & Generate Offer Letter
              </button>
              <button onClick={() => setSelectingId(null)} className="px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Enrollment Modal */}
      {editEnrollment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Edit Selection Details</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Monthly Salary/Stipend (₹)</label>
                  <input type="number" value={editEnrollment.salary} onChange={(e) => setEditEnrollment({...editEnrollment, salary: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Weekly Offs (days)</label>
                  <input type="number" value={editEnrollment.weekoffs} onChange={(e) => setEditEnrollment({...editEnrollment, weekoffs: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Paid Leaves/month</label>
                  <input type="number" value={editEnrollment.paidLeaves} onChange={(e) => setEditEnrollment({...editEnrollment, paidLeaves: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Work Timing</label>
                  <input type="text" value={editEnrollment.workTiming} onChange={(e) => setEditEnrollment({...editEnrollment, workTiming: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Joining Date</label>
                <input type="date" value={editEnrollment.joiningDate} onChange={(e) => setEditEnrollment({...editEnrollment, joiningDate: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fee Type</label>
                <select value={editEnrollment.feeType} onChange={(e) => setEditEnrollment({...editEnrollment, feeType: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-white">
                  <option value="free">Free</option>
                  <option value="paid">Paid — Student pays</option>
                  <option value="stipend">Stipend — Company pays</option>
                </select>
              </div>
              {editEnrollment.feeType === "paid" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Fee Amount (₹)</label>
                  <input type="number" value={editEnrollment.feeAmount} onChange={(e) => setEditEnrollment({...editEnrollment, feeAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-white" />
                </div>
              )}
              {editEnrollment.feeType === "stipend" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Stipend Amount (₹/month)</label>
                  <input type="number" value={editEnrollment.stipendAmount} onChange={(e) => setEditEnrollment({...editEnrollment, stipendAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-white" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEditEnrollment} className="flex-1 px-4 py-2 bg-[#0EA5B8] text-white rounded-lg hover:bg-[#0891b2] font-medium">
                Save Changes
              </button>
              <button onClick={() => setEditEnrollment(null)} className="px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meet Link Modal */}
      {editMeetLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Set Meeting Link</h2>
            <p className="text-sm text-slate-400 mb-3">Student will see this link to join the interview.</p>
            <input
              type="url"
              value={editMeetLink.link}
              onChange={(e) => setEditMeetLink({ ...editMeetLink, link: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-white mb-4"
              placeholder="https://meet.google.com/abc-xyz or Zoom link"
            />
            <div className="flex gap-3">
              <button onClick={handleUpdateMeetLink} className="flex-1 px-4 py-2 bg-[#0EA5B8] text-white rounded-lg hover:bg-[#0891b2]">
                Save Link
              </button>
              <button onClick={() => setEditMeetLink(null)} className="px-4 py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setViewDetails(null); setStudentDocs(null); }}>
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#0EA5B8] to-[#a78bfa] text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">{viewDetails.enrollment.student.name}</h2>
              <p className="text-indigo-100 text-sm">{viewDetails.enrollment.batch.program.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3">
                  <p className="text-xs text-slate-500 font-medium">Email</p>
                  <p className="text-sm text-white">{viewDetails.enrollment.student.email}</p>
                </div>
                <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3">
                  <p className="text-xs text-slate-500 font-medium">Phone</p>
                  <p className="text-sm text-white">{viewDetails.enrollment.student.phone || "N/A"}</p>
                </div>
                <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3">
                  <p className="text-xs text-slate-500 font-medium">College</p>
                  <p className="text-sm text-white">{viewDetails.enrollment.student.collegeName || "N/A"}</p>
                </div>
                <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3">
                  <p className="text-xs text-slate-500 font-medium">Degree</p>
                  <p className="text-sm text-white">{viewDetails.enrollment.student.degree || "N/A"}</p>
                </div>
                <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3">
                  <p className="text-xs text-slate-500 font-medium">Program</p>
                  <p className="text-sm text-white">{viewDetails.enrollment.batch.program.title}</p>
                </div>
                <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3">
                  <p className="text-xs text-slate-500 font-medium">Batch</p>
                  <p className="text-sm text-white">{viewDetails.enrollment.batch.name}</p>
                </div>
                <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3">
                  <p className="text-xs text-slate-500 font-medium">Interview Date</p>
                  <p className="text-sm text-white">{new Date(viewDetails.scheduledAt).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3">
                  <p className="text-xs text-slate-500 font-medium">Mode</p>
                  <p className="text-sm text-white capitalize">{viewDetails.mode}</p>
                </div>
              </div>
              {viewDetails.feedback && (
                <div className="bg-transparent border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-amber-400 font-medium mb-1">Feedback</p>
                  <p className="text-sm text-white">{viewDetails.feedback}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-white mb-2">Documents & Resume</h3>
                {studentDocs === null ? (
                  <p className="text-sm text-slate-500">Loading documents...</p>
                ) : studentDocs.documents.length === 0 ? (
                  <p className="text-sm text-slate-500">No documents uploaded yet</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {studentDocs.documents.map((doc) => {
                      const docUrl = doc.fileUrl || doc.url || "#";
                      return (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border border-blue-100">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{doc.type === 'resume' ? '📄' : doc.type === 'photo' ? '🖼️' : '📎'}</span>
                            <div>
                              <p className="text-sm font-medium text-white">{doc.title || doc.name || doc.type}</p>
                              <p className="text-xs text-slate-500 capitalize">{doc.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-[#0EA5B8] text-white text-xs rounded-lg hover:bg-[#0891b2] font-medium flex items-center gap-1">
                              👁 View
                            </a>
                            <a href={docUrl} download className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium flex items-center gap-1">
                              ⬇ Download
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <button onClick={() => { setViewDetails(null); setStudentDocs(null); }} className="w-full py-2 bg-transparent text-slate-300 rounded-lg hover:bg-white/10 font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {interviews.length === 0 ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 text-center border">
          <p className="text-slate-500">{userRole === "student" ? "No interviews scheduled for you yet" : "No interviews scheduled yet"}</p>
        </div>
      ) : userRole === "student" ? (
        /* Student View — prominent interview details with meeting link */
        <div className="grid gap-4">
          {interviews.filter(i => !searchQuery.trim() || i.enrollment.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.enrollment.batch.program.title.toLowerCase().includes(searchQuery.toLowerCase())).map((i) => (
            <div key={i.id} className={`rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border overflow-hidden ${i.status === "scheduled" ? "border-[#0EA5B8]/20" : ""}`}>
              {i.status === "scheduled" && (
                <div className="bg-[#0EA5B8] text-white px-6 py-2 text-sm font-medium">Upcoming Interview</div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-bold text-white">{i.enrollment.batch.program.title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3 text-center">
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="text-sm font-semibold text-white">{new Date(i.scheduledAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3 text-center">
                    <p className="text-xs text-slate-500">Time</p>
                    <p className="text-sm font-semibold text-white">{new Date(i.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3 text-center">
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="text-sm font-semibold text-white">{i.duration} minutes</p>
                  </div>
                  <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-3 text-center">
                    <p className="text-xs text-slate-500">Mode</p>
                    <p className="text-sm font-semibold text-white capitalize">{i.mode}</p>
                  </div>
                </div>
                {i.meetLink && i.status === "scheduled" && (
                  <a href={i.meetLink} target="_blank" rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-[#0EA5B8] text-white rounded-lg hover:bg-[#0891b2] font-semibold text-sm transition">
                    🔗 Join Meeting
                  </a>
                )}
                {!i.meetLink && i.status === "scheduled" && (
                  <div className="mt-4 p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] text-center text-sm text-amber-400">
                    Meeting link will be shared before the interview
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    i.status === "scheduled" ? "bg-blue-500/10 text-blue-800" :
                    i.result === "selected" ? "bg-emerald-500/10 text-green-800" :
                    i.result === "rejected" ? "bg-red-500/10 text-red-800" :
                    i.result === "shortlisted" ? "bg-amber-500/10 text-yellow-800" :
                    "bg-transparent text-white"
                  }`}>
                    {i.result === "selected" ? "Selected!" : i.result === "rejected" ? "Not Selected" : i.result === "shortlisted" ? "Shortlisted" : "Scheduled"}
                  </span>
                  {i.interviewer && <p className="text-xs text-slate-500">Interviewer: {i.interviewer.name}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Admin/TL View — existing cards with management actions */
        <div className="grid gap-4">
          {interviews.filter(i => i.result !== "selected" && i.result !== "rejected").filter(i => !searchQuery.trim() || i.enrollment.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.enrollment.batch.program.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.enrollment.student.email.toLowerCase().includes(searchQuery.toLowerCase())).map((i) => (
            <div key={i.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{i.enrollment.student.name}</h3>
                  <p className="text-sm text-slate-400">{i.enrollment.student.email} | {i.enrollment.student.phone}</p>
                  <p className="text-sm text-slate-500">{i.enrollment.student.collegeName} — {i.enrollment.student.degree}</p>
                  <p className="text-sm text-[#22d3ee] font-medium mt-1">{i.enrollment.batch.program.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span>📅 {new Date(i.scheduledAt).toLocaleString("en-IN")}</span>
                    <span>⏱ {i.duration} min</span>
                    <span>📍 {i.mode}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {i.meetLink ? (
                      <>
                        <a href={i.meetLink} target="_blank" className="text-sm text-[#60a5fa] hover:underline">
                          Join Meeting →
                        </a>
                        {i.status === "scheduled" && (
                          <button onClick={() => setEditMeetLink({ id: i.id, link: i.meetLink || "" })}
                            className="text-xs text-slate-500 hover:text-[#22d3ee]">
                            (Edit Link)
                          </button>
                        )}
                      </>
                    ) : (
                      i.status === "scheduled" && (
                        <button onClick={() => setEditMeetLink({ id: i.id, link: "" })}
                          className="text-sm text-[#22d3ee] hover:underline">
                          + Add Meeting Link
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    i.status === "scheduled" ? "bg-blue-500/10 text-blue-800" :
                    i.result === "selected" ? "bg-emerald-500/10 text-green-800" :
                    i.result === "rejected" ? "bg-red-500/10 text-red-800" :
                    "bg-amber-500/10 text-yellow-800"
                  }`}>
                    {i.result || i.status}
                  </span>
                  {i.status === "scheduled" && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleResult(i.id, i.enrollment.id, "selected")}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-green-700">
                        Select
                      </button>
                      <button onClick={() => handleResult(i.id, i.enrollment.id, "shortlisted")}
                        className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600">
                        Shortlist
                      </button>
                      <button onClick={() => handleResult(i.id, i.enrollment.id, "rejected")}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">
                        Reject
                      </button>
                    </div>
                  )}
                  {i.result === "shortlisted" && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleResult(i.id, i.enrollment.id, "selected")}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-green-700">
                        Select
                      </button>
                      <button onClick={() => handleResult(i.id, i.enrollment.id, "rejected")}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">
                        Reject
                      </button>
                    </div>
                  )}
                  <button onClick={() => { setViewDetails(i); fetch(`/api/documents?userId=${i.enrollment.studentId}`).then(r => r.ok ? r.json() : []).then(d => setStudentDocs({ documents: Array.isArray(d) ? d : [] })).catch(() => setStudentDocs({ documents: [] })); }} className="px-3 py-1.5 bg-[#0EA5B8]/10 text-[#22d3ee] text-xs rounded-lg hover:bg-[#0EA5B8]/20 font-medium mt-1">
                    👁 View Details
                  </button>
                  {i.result === "selected" && (
                    <button onClick={() => setEditEnrollment({
                      enrollmentId: i.enrollment.id,
                      salary: "5000", weekoffs: "4", paidLeaves: "1",
                      workTiming: "9:30 AM - 6:30 PM", joiningDate: getNextDay(),
                      feeType: "stipend", feeAmount: "0", stipendAmount: "5000",
                    })}
                      className="px-3 py-1.5 bg-[#0EA5B8]/10 text-[#22d3ee] text-xs rounded-lg hover:bg-[#0EA5B8]/20 mt-2">
                      Edit Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
