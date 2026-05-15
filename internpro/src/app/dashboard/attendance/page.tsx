"use client";

import { useState, useEffect, useCallback } from "react";
import { getStatusColor, formatDate } from "@/lib/utils";

import DataToolbar from "@/components/DataToolbar";
import { serverExportCSV, serverExportPDF } from "@/lib/export-utils";
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

interface UserSession {
  id: string;
  role: string;
}

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showMark, setShowMark] = useState(false);
  const [autoCheckedIn, setAutoCheckedIn] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [myEnrollmentId, setMyEnrollmentId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [attRes, enrollRes, meRes] = await Promise.all([
      fetch(`/api/attendance?date=${selectedDate}`),
      fetch("/api/enrollments?status=selected"),
      fetch("/api/auth/me"),
    ]);
    if (attRes.ok) setRecords(await attRes.json());
    if (enrollRes.ok) {
      const enrollData = await enrollRes.json();
      setEnrollments(enrollData);
    }
    if (meRes.ok) {
      const meData = await meRes.json();
      setUser(meData.user);
      // For students, find their enrollment ID for attendance download
      if (meData.user?.role === "student") {
        const myEnrollRes = await fetch("/api/enrollments?status=selected");
        if (myEnrollRes.ok) {
          const myEnrolls = await myEnrollRes.json();
          if (myEnrolls.length > 0) setMyEnrollmentId(myEnrolls[0].id);
        }
      }
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto check-in for students when they access the page
  useEffect(() => {
    if (user?.role === "student" && !autoCheckedIn) {
      autoCheckIn();
    }
  }, [user, autoCheckedIn]);

  const autoCheckIn = async () => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const checkIn = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: today,
        status: "present",
        method: "auto",
        checkIn,
      }),
    });
    if (res.ok) {
      setAutoCheckedIn(true);
      fetchData();
    }
  };

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

  const isStudent = user?.role === "student";
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecord = isStudent && selectedDate === todayStr ? records[0] : undefined;

  const handleExportCSV = () => serverExportCSV("attendance");

  const handleExportPDF = () => serverExportPDF("attendance", "Attendance");

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(records.map((item: { id: string }) => item.id)));
  };
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} attendance records?`)) return;
    setBulkDeleting(true);
    await fetch("/api/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk_delete_attendance", ids: Array.from(selectedIds) }) });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search attendance..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
          <p className="text-slate-400 text-sm">
            {isStudent ? "Your attendance is auto-tracked when you open this page" : "Track daily attendance for all students"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm text-white"
          />
          {isStudent && myEnrollmentId && (
            <button onClick={() => window.open(`/api/attendance-download?enrollmentId=${myEnrollmentId}`, '_blank')} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-green-700">Download Attendance PDF</button>
          )}
          {!isStudent && (
            <>
              <button onClick={() => { window.open(`/api/export?type=attendance&format=csv&date=${selectedDate}`, '_blank'); }} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-green-700">📥 Export</button>
              <button onClick={() => setShowMark(!showMark)} className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2] transition">
                {showMark ? "View Records" : "Mark Attendance"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Auto Check-in Banner for Students */}
      {isStudent && (
        <div className={`rounded-xl p-4 mb-6 text-sm border ${autoCheckedIn ? "bg-transparent border-green-200 text-green-800" : "bg-transparent border-blue-200 text-blue-800"}`}>
          {autoCheckedIn ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <div>
                <strong>Auto Check-in Done!</strong> — {todayStr === selectedDate ? "Today" : formatDate(selectedDate)} ka attendance mark ho gaya hai.
                {todayRecord && <span className="ml-2">Check-in: {records[0]?.checkIn || "—"}</span>}
              </div>
            </div>
          ) : (
            <div>
              <strong>Auto Attendance:</strong> Jab aap dashboard kholte ho, aapki attendance automatically mark ho jaati hai.
              Agar aap kaam kar rahe ho (tasks submit, resources dekh rahe ho) — sab track hota hai.
            </div>
          )}
        </div>
      )}

      {!isStudent && showMark ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] overflow-hidden">
          <div className="p-4 bg-transparent flex items-center justify-between">
            <h2 className="font-semibold text-white">Mark Attendance - {formatDate(selectedDate)}</h2>
            <div className="flex gap-2">
              <button onClick={() => markAll("present")} className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-green-200">Mark All Present</button>
              <button onClick={() => markAll("absent")} className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-200">Mark All Absent</button>
            </div>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {enrollments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No active enrollments found</div>
            ) : (
              enrollments.map((enrollment) => {
                const existing = records.find((r) => r.enrollment.id === enrollment.id);
                return (
                  <div key={enrollment.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-white">{enrollment.student.name}</div>
                      <div className="text-xs text-slate-500">{enrollment.batch.program.title} - {enrollment.batch.name}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {existing && (
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(existing.status)}`}>
                          {existing.status} {existing.method === "auto" ? "(Auto)" : ""}
                        </span>
                      )}
                      {["present", "absent", "late", "half-day", "leave"].map((s) => (
                        <button
                          key={s}
                          onClick={() => markAttendance(enrollment.id, s)}
                          className={`text-xs px-2 py-1 rounded transition capitalize ${existing?.status === s ? "bg-[#0EA5B8] text-white" : "bg-transparent text-slate-400 hover:bg-white/10"}`}
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
        <>
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <span className="text-sm text-red-400 font-medium">{selectedIds.size} selected</span>
            <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">{bulkDeleting ? "Deleting..." : "Delete Selected"}</button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/20">Clear</button>
          </div>
        )}
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-transparent">
                <tr>
                  <th className="p-3 w-10"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === records.length} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8]" /></th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Login Time</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Last Active</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Work Hours</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      No attendance records for {formatDate(selectedDate)}
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-transparent">
                      <td className="p-3 w-10"><input type="checkbox" checked={selectedIds.has(record.id)} onChange={() => toggleSelect(record.id)} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8]" /></td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white text-sm">{record.user.name}</div>
                        <div className="text-xs text-slate-500">{record.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{formatDate(record.date)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{record.checkIn || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{record.checkOut || "—"}</td>
                      <td className="px-6 py-4">
                        {record.checkIn && record.checkOut ? (() => {
                          const [inH, inM] = record.checkIn.split(":").map(Number);
                          const [outH, outM] = record.checkOut.split(":").map(Number);
                          const mins = (outH * 60 + outM) - (inH * 60 + inM);
                          const hrs = Math.floor(mins / 60);
                          const m = mins % 60;
                          const label = mins < 240 ? "Half Day" : mins < 360 ? "Short Day" : "Full Day";
                          const color = mins < 240 ? "text-orange-600" : mins < 360 ? "text-amber-400" : "text-emerald-400";
                          return (
                            <div>
                              <span className="text-sm text-white">{hrs}h {m}m</span>
                              <span className={`text-xs ml-1 font-medium ${color}`}>({label})</span>
                            </div>
                          );
                        })() : <span className="text-xs text-slate-500">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${record.method === "auto" ? "bg-blue-500/10 text-[#60a5fa]" : "bg-transparent text-slate-400"}`}>
                          {record.method === "auto" ? "Auto" : "Manual"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
