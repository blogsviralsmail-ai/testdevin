"use client";

import { useState, useEffect, useCallback } from "react";

interface Enrollment {
  id: string;
  status: string;
  createdAt: string;
  student: { id: string; name: string; email: string; phone: string; collegeName: string; degree: string; year: string };
  batch: { program: { title: string; domain: string; mode: string } };
  _count: { interviews: number };
}

export default function ApplicationsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState("applied");
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState<Enrollment | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: "", time: "10:00", mode: "online", meetLink: "", duration: "30",
  });

  const fetchApplications = useCallback(async () => {
    const res = await fetch(`/api/enrollments?status=${filter}`);
    const data = await res.json();
    setEnrollments(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this application?")) return;
    await fetch(`/api/enrollments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
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
      }),
    });
    setScheduleModal(null);
    setScheduleForm({ date: "", time: "10:00", mode: "online", meetLink: "", duration: "30" });
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (optional)</label>
                <input type="url" value={scheduleForm.meetLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetLink: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
                  placeholder="https://meet.google.com/... or Zoom link" />
                <p className="text-xs text-gray-500 mt-1">Student ko ye link dikhega. Baad me bhi add/edit kar sakte ho Interviews page se.</p>
              </div>
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
                </div>
                <div className="flex gap-2">
                  {filter === "applied" && (
                    <>
                      <button
                        onClick={() => setScheduleModal(e)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                      >
                        Schedule Interview
                      </button>
                      <button
                        onClick={() => handleReject(e.id)}
                        className="px-4 py-2 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100"
                      >
                        Reject
                      </button>
                    </>
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
    </div>
  );
}
