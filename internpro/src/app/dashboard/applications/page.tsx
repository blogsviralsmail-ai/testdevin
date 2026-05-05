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

  const fetchApplications = useCallback(async () => {
    const res = await fetch(`/api/enrollments?status=${filter}`);
    const data = await res.json();
    setEnrollments(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleReject = async (id: string) => {
    await fetch(`/api/enrollments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    fetchApplications();
  };

  const handleScheduleInterview = async (enrollmentId: string) => {
    const scheduledAt = prompt("Interview Date & Time (YYYY-MM-DD HH:MM):");
    if (!scheduledAt) return;
    const meetLink = prompt("Meet Link (optional):");

    await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        mode: "online",
        meetLink: meetLink || null,
      }),
    });
    fetchApplications();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Applications</h1>
          <p className="text-gray-600">Review student applications, documents, and schedule interviews</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
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
                        onClick={() => handleScheduleInterview(e.id)}
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
