"use client";

import { useState, useEffect, useCallback } from "react";
import { getStatusColor, formatDate } from "@/lib/utils";

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  student: { id: string; name: string; email: string; phone: string | null };
  batch: { program: { title: string; domain: string; feeType: string; feeAmount: number; stipendAmount: number } };
  _count: { attendances: number; certificates: number; payments: number };
}

export default function StudentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState("");

  const fetchEnrollments = useCallback(async () => {
    const res = await fetch("/api/enrollments");
    if (res.ok) setEnrollments(await res.json());
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

  const generateOfferLetter = (enrollmentId: string) => {
    window.open(`/api/documents/offer-letter?enrollmentId=${enrollmentId}`, "_blank");
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 text-sm">Manage enrolled students across all programs</p>
        </div>
        <div className="flex gap-2">
          {["", "pending", "approved", "active", "completed", "dropped"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg transition ${filter === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

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
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Enrolled</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Attendance</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{enrollment.student.name}</div>
                        <div className="text-xs text-gray-500">{enrollment.student.email}</div>
                        {enrollment.student.phone && <div className="text-xs text-gray-400">{enrollment.student.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{enrollment.batch.program.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(enrollment.enrolledAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{enrollment._count.attendances} days</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {enrollment.status === "pending" && (
                          <button onClick={() => updateStatus(enrollment.id, "approved")} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">Approve</button>
                        )}
                        {enrollment.status === "approved" && (
                          <button onClick={() => updateStatus(enrollment.id, "active")} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">Activate</button>
                        )}
                        {(enrollment.status === "active" || enrollment.status === "approved") && (
                          <button onClick={() => updateStatus(enrollment.id, "completed")} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100">Complete</button>
                        )}
                        <button onClick={() => generateOfferLetter(enrollment.id)} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100">Offer Letter</button>
                        {enrollment.status === "completed" && enrollment._count.certificates === 0 && (
                          <button onClick={() => generateCertificate(enrollment.id)} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-100">Certificate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
