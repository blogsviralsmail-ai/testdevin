"use client";

import { useState, useEffect, useCallback } from "react";
import { getStatusColor, formatDate } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  method: string;
  user: { name: string; email: string };
  enrollment: { id: string; batchId: string };
}

interface Enrollment {
  id: string;
  student: { name: string };
  batch: { name: string; program: { title: string } };
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showMark, setShowMark] = useState(false);

  const fetchData = useCallback(async () => {
    const [attRes, enrollRes] = await Promise.all([
      fetch(`/api/attendance?date=${selectedDate}`),
      fetch("/api/enrollments?status=active"),
    ]);
    if (attRes.ok) setRecords(await attRes.json());
    if (enrollRes.ok) setEnrollments(await enrollRes.json());
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markAttendance = async (enrollmentId: string, status: string) => {
    const now = new Date();
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentId,
        date: selectedDate,
        status,
        method: "manual",
        checkIn: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      }),
    });
    fetchData();
  };

  const markAll = async (status: string) => {
    for (const enrollment of enrollments) {
      await markAttendance(enrollment.id, status);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 text-sm">Track daily attendance for all students</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <button onClick={() => setShowMark(!showMark)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
            {showMark ? "View Records" : "Mark Attendance"}
          </button>
        </div>
      </div>

      {showMark ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Mark Attendance - {formatDate(selectedDate)}</h2>
            <div className="flex gap-2">
              <button onClick={() => markAll("present")} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Mark All Present</button>
              <button onClick={() => markAll("absent")} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Mark All Absent</button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {enrollments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No active enrollments found</div>
            ) : (
              enrollments.map((enrollment) => {
                const existing = records.find((r) => r.enrollment.id === enrollment.id);
                return (
                  <div key={enrollment.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{enrollment.student.name}</div>
                      <div className="text-xs text-gray-500">{enrollment.batch.program.title} - {enrollment.batch.name}</div>
                    </div>
                    <div className="flex gap-2">
                      {existing && (
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(existing.status)}`}>
                          {existing.status}
                        </span>
                      )}
                      {["present", "absent", "late", "half-day", "leave"].map((s) => (
                        <button
                          key={s}
                          onClick={() => markAttendance(enrollment.id, s)}
                          className={`text-xs px-2 py-1 rounded transition capitalize ${existing?.status === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Attendance Records - {formatDate(selectedDate)}</h2>
          </div>
          {records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No attendance records for this date</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Student</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Check In</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Check Out</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-sm text-gray-900">{record.user.name}</div>
                        <div className="text-xs text-gray-500">{record.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.status)}`}>{record.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.checkIn || "-"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.checkOut || "-"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{record.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {["present", "absent", "late", "half-day", "leave"].map((status) => {
          const count = records.filter((r) => r.status === status).length;
          return (
            <div key={status} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className={`text-2xl font-bold ${status === "present" ? "text-green-600" : status === "absent" ? "text-red-600" : "text-yellow-600"}`}>{count}</div>
              <div className="text-xs text-gray-500 capitalize mt-1">{status}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
