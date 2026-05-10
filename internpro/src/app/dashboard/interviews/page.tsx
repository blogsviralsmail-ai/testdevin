"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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

  const getNextDay = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const [selectionForm, setSelectionForm] = useState({
    weekoffs: "2", paidLeaves: "2",
    workTiming: "10:00 AM - 6:00 PM", joiningDate: getNextDay(),
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
      alert("Program & Batch select karna zaroori hai!");
      return;
    }
    if (!selectionForm.mode) {
      alert("Mode (Online/Offline/Hybrid) select karna zaroori hai!");
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

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{userRole === "student" ? "My Interviews" : "Interviews"}</h1>
        <p className="text-gray-600">{userRole === "student" ? "View your scheduled interviews and meeting details" : "Manage scheduled interviews and select candidates"}</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by student name, program..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
      </div>

      {/* Selection Modal */}
      {selectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Candidate — Fill Details</h2>
            <div className="space-y-3">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <label className="block text-sm font-bold text-indigo-800 mb-1">Program <span className="text-red-500">*</span></label>
                <select value={selectionForm.programId} onChange={(e) => {
                  const pid = e.target.value;
                  setSelectionForm(prev => ({ ...prev, programId: pid, batchId: "" }));
                }} className="w-full px-3 py-2 rounded-lg border text-gray-900 mb-2">
                  <option value="">-- Select Program --</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <label className="block text-sm font-bold text-indigo-800 mb-1">Batch <span className="text-red-500">*</span></label>
                <select value={selectionForm.batchId} onChange={(e) => setSelectionForm(prev => ({ ...prev, batchId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-gray-900">
                  <option value="">-- Select Batch --</option>
                  {programs.find(p => p.id === selectionForm.programId)?.batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <p className="text-xs text-indigo-600 mt-1">Program aur Batch select karna zaroori hai select karne se pehle</p>
                <label className="block text-sm font-bold text-indigo-800 mb-1 mt-2">Mode <span className="text-red-500">*</span></label>
                <select value={selectionForm.mode || ""} onChange={(e) => setSelectionForm(prev => ({ ...prev, mode: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-gray-900">
                  <option value="">-- Select Mode --</option>
                  <option value="online">Online (Work from Home)</option>
                  <option value="offline">Offline (Work from Office)</option>
                  <option value="hybrid">Hybrid (Online + Offline)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Offs (days)</label>
                  <input type="number" value={selectionForm.weekoffs} onChange={(e) => setSelectionForm({...selectionForm, weekoffs: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Leaves/month</label>
                  <input type="number" value={selectionForm.paidLeaves} onChange={(e) => setSelectionForm({...selectionForm, paidLeaves: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Timing</label>
                <input type="text" value={selectionForm.workTiming} onChange={(e) => setSelectionForm({...selectionForm, workTiming: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date <span className="text-red-500">*</span></label>
                <input type="date" value={selectionForm.joiningDate} onChange={(e) => setSelectionForm({...selectionForm, joiningDate: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-gray-900" required />
                <p className="text-xs text-gray-500 mt-1">Required — agar blank rahe toh next day auto-fill hoti hai</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                <select value={selectionForm.feeType} onChange={(e) => setSelectionForm({...selectionForm, feeType: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-gray-900">
                  <option value="free">Free — No charge, no stipend</option>
                  <option value="paid">Paid — Student pays fee to company</option>
                  <option value="stipend">Stipend — Company pays student monthly</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {selectionForm.feeType === "free" && "Student ko koi paisa nahi dena na lena — completely free internship"}
                  {selectionForm.feeType === "paid" && "Student company ko fee dega — training ke liye payment"}
                  {selectionForm.feeType === "stipend" && "Company student ko monthly stipend/salary degi — as a salary/stipend"}
                </p>
              </div>
              {selectionForm.feeType === "paid" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount (₹) — Student will pay this</label>
                  <input type="number" value={selectionForm.feeAmount} onChange={(e) => setSelectionForm({...selectionForm, feeAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
              )}
              {selectionForm.feeType === "stipend" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stipend Amount (₹/month) — Company will pay student</label>
                  <input type="number" value={selectionForm.stipendAmount} onChange={(e) => setSelectionForm({...selectionForm, stipendAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSelect} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Select & Generate Offer Letter
              </button>
              <button onClick={() => setSelectingId(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Enrollment Modal */}
      {editEnrollment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Selection Details</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary/Stipend (₹)</label>
                  <input type="number" value={editEnrollment.salary} onChange={(e) => setEditEnrollment({...editEnrollment, salary: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Offs (days)</label>
                  <input type="number" value={editEnrollment.weekoffs} onChange={(e) => setEditEnrollment({...editEnrollment, weekoffs: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Leaves/month</label>
                  <input type="number" value={editEnrollment.paidLeaves} onChange={(e) => setEditEnrollment({...editEnrollment, paidLeaves: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Timing</label>
                  <input type="text" value={editEnrollment.workTiming} onChange={(e) => setEditEnrollment({...editEnrollment, workTiming: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                <input type="date" value={editEnrollment.joiningDate} onChange={(e) => setEditEnrollment({...editEnrollment, joiningDate: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                <select value={editEnrollment.feeType} onChange={(e) => setEditEnrollment({...editEnrollment, feeType: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-gray-900">
                  <option value="free">Free</option>
                  <option value="paid">Paid — Student pays</option>
                  <option value="stipend">Stipend — Company pays</option>
                </select>
              </div>
              {editEnrollment.feeType === "paid" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount (₹)</label>
                  <input type="number" value={editEnrollment.feeAmount} onChange={(e) => setEditEnrollment({...editEnrollment, feeAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
              )}
              {editEnrollment.feeType === "stipend" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stipend Amount (₹/month)</label>
                  <input type="number" value={editEnrollment.stipendAmount} onChange={(e) => setEditEnrollment({...editEnrollment, stipendAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEditEnrollment} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                Save Changes
              </button>
              <button onClick={() => setEditEnrollment(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meet Link Modal */}
      {editMeetLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Set Meeting Link</h2>
            <p className="text-sm text-gray-600 mb-3">Student will see this link to join the interview.</p>
            <input
              type="url"
              value={editMeetLink.link}
              onChange={(e) => setEditMeetLink({ ...editMeetLink, link: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-gray-900 mb-4"
              placeholder="https://meet.google.com/abc-xyz or Zoom link"
            />
            <div className="flex gap-3">
              <button onClick={handleUpdateMeetLink} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Save Link
              </button>
              <button onClick={() => setEditMeetLink(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {interviews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-gray-500">{userRole === "student" ? "No interviews scheduled for you yet" : "No interviews scheduled yet"}</p>
        </div>
      ) : userRole === "student" ? (
        /* Student View — prominent interview details with meeting link */
        <div className="grid gap-4">
          {interviews.filter(i => !searchQuery.trim() || i.enrollment.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.enrollment.batch.program.title.toLowerCase().includes(searchQuery.toLowerCase())).map((i) => (
            <div key={i.id} className={`bg-white rounded-xl border overflow-hidden ${i.status === "scheduled" ? "border-indigo-200" : ""}`}>
              {i.status === "scheduled" && (
                <div className="bg-indigo-600 text-white px-6 py-2 text-sm font-medium">Upcoming Interview</div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900">{i.enrollment.batch.program.title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-semibold text-gray-900">{new Date(i.scheduledAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="text-sm font-semibold text-gray-900">{new Date(i.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-semibold text-gray-900">{i.duration} minutes</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Mode</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{i.mode}</p>
                  </div>
                </div>
                {i.meetLink && i.status === "scheduled" && (
                  <a href={i.meetLink} target="_blank" rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition">
                    🔗 Join Meeting
                  </a>
                )}
                {!i.meetLink && i.status === "scheduled" && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-center text-sm text-yellow-700">
                    Meeting link will be shared before the interview
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    i.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                    i.result === "selected" ? "bg-green-100 text-green-800" :
                    i.result === "rejected" ? "bg-red-100 text-red-800" :
                    i.result === "shortlisted" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {i.result === "selected" ? "Selected!" : i.result === "rejected" ? "Not Selected" : i.result === "shortlisted" ? "Shortlisted" : "Scheduled"}
                  </span>
                  {i.interviewer && <p className="text-xs text-gray-500">Interviewer: {i.interviewer.name}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Admin/TL View — existing cards with management actions */
        <div className="grid gap-4">
          {interviews.filter(i => i.result !== "selected" && i.result !== "rejected").filter(i => !searchQuery.trim() || i.enrollment.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.enrollment.batch.program.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.enrollment.student.email.toLowerCase().includes(searchQuery.toLowerCase())).map((i) => (
            <div key={i.id} className="bg-white rounded-xl p-6 border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{i.enrollment.student.name}</h3>
                  <p className="text-sm text-gray-600">{i.enrollment.student.email} | {i.enrollment.student.phone}</p>
                  <p className="text-sm text-gray-500">{i.enrollment.student.collegeName} — {i.enrollment.student.degree}</p>
                  <p className="text-sm text-indigo-600 font-medium mt-1">{i.enrollment.batch.program.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>📅 {new Date(i.scheduledAt).toLocaleString("en-IN")}</span>
                    <span>⏱ {i.duration} min</span>
                    <span>📍 {i.mode}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {i.meetLink ? (
                      <>
                        <a href={i.meetLink} target="_blank" className="text-sm text-blue-600 hover:underline">
                          Join Meeting →
                        </a>
                        {i.status === "scheduled" && (
                          <button onClick={() => setEditMeetLink({ id: i.id, link: i.meetLink || "" })}
                            className="text-xs text-gray-500 hover:text-indigo-600">
                            (Edit Link)
                          </button>
                        )}
                      </>
                    ) : (
                      i.status === "scheduled" && (
                        <button onClick={() => setEditMeetLink({ id: i.id, link: "" })}
                          className="text-sm text-indigo-600 hover:underline">
                          + Add Meeting Link
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    i.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                    i.result === "selected" ? "bg-green-100 text-green-800" :
                    i.result === "rejected" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {i.result || i.status}
                  </span>
                  {i.status === "scheduled" && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleResult(i.id, i.enrollment.id, "selected")}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
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
                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                        Select
                      </button>
                      <button onClick={() => handleResult(i.id, i.enrollment.id, "rejected")}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">
                        Reject
                      </button>
                    </div>
                  )}
                  {i.result === "selected" && (
                    <button onClick={() => setEditEnrollment({
                      enrollmentId: i.enrollment.id,
                      salary: "5000", weekoffs: "2", paidLeaves: "2",
                      workTiming: "10:00 AM - 6:00 PM", joiningDate: getNextDay(),
                      feeType: "stipend", feeAmount: "0", stipendAmount: "5000",
                    })}
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs rounded-lg hover:bg-indigo-200 mt-2">
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
