"use client";

import { useState, useEffect, useCallback } from "react";

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
    student: { id: string; name: string; email: string; phone: string; collegeName: string; degree: string };
    batch: { program: { title: string; domain: string } };
  };
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [editMeetLink, setEditMeetLink] = useState<{ id: string; link: string } | null>(null);
  const [selectionForm, setSelectionForm] = useState({
    salary: "5000", weekoffs: "2", paidLeaves: "2",
    workTiming: "10:00 AM - 6:00 PM", joiningDate: "",
    feeType: "stipend", feeAmount: "0", stipendAmount: "5000",
  });

  const fetchInterviews = useCallback(async () => {
    const res = await fetch("/api/interviews");
    const data = await res.json();
    setInterviews(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const handleResult = async (id: string, enrollmentId: string, result: string) => {
    if (result === "selected") {
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
    await fetch("/api/offer-letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentId: selectingId,
        salary: parseFloat(selectionForm.salary),
        weekoffs: parseInt(selectionForm.weekoffs),
        paidLeaves: parseInt(selectionForm.paidLeaves),
        workTiming: selectionForm.workTiming,
        joiningDate: selectionForm.joiningDate || new Date().toISOString(),
        feeType: selectionForm.feeType,
        feeAmount: parseFloat(selectionForm.feeAmount),
        stipendAmount: parseFloat(selectionForm.stipendAmount),
      }),
    });
    setSelectingId(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
        <p className="text-gray-600">Manage scheduled interviews and select candidates</p>
      </div>

      {/* Selection Modal */}
      {selectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Candidate — Fill Details</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary/Stipend (₹)</label>
                  <input type="number" value={selectionForm.salary} onChange={(e) => setSelectionForm({...selectionForm, salary: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Offs (days)</label>
                  <input type="number" value={selectionForm.weekoffs} onChange={(e) => setSelectionForm({...selectionForm, weekoffs: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Leaves/month</label>
                  <input type="number" value={selectionForm.paidLeaves} onChange={(e) => setSelectionForm({...selectionForm, paidLeaves: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Timing</label>
                  <input type="text" value={selectionForm.workTiming} onChange={(e) => setSelectionForm({...selectionForm, workTiming: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                <input type="date" value={selectionForm.joiningDate} onChange={(e) => setSelectionForm({...selectionForm, joiningDate: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border text-gray-900" />
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
          <p className="text-gray-500">No interviews scheduled yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {interviews.map((i) => (
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
