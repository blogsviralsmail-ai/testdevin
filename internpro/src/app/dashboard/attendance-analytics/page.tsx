"use client";
import { useState, useEffect } from "react";

interface BatchStat { batchId: string; batchName: string; totalStudents: number; activeStudents: number; completedStudents: number; attendanceRate: number; }
interface ProgramAnalytic { programId: string; programTitle: string; duration: number; totalStudents: number; activeStudents: number; completedStudents: number; dropOffRate: number; attendanceRate: number; batches: BatchStat[]; }
interface AnalyticsData { overall: { totalPrograms: number; totalStudents: number; activeStudents: number; completedStudents: number; avgAttendanceRate: number }; programs: ProgramAnalytic[]; }

export default function AttendanceAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/attendance-analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (!data) return <div className="p-6">Failed to load analytics.</div>;

  const { overall, programs } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Analytics</h1>
        <p className="text-sm text-gray-500">Program-wise and batch-wise attendance trends</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-2xl font-bold text-indigo-600">{overall.totalPrograms}</p>
          <p className="text-xs text-gray-500 mt-1">Programs</p>
        </div>
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-2xl font-bold text-blue-600">{overall.totalStudents}</p>
          <p className="text-xs text-gray-500 mt-1">Total Students</p>
        </div>
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-2xl font-bold text-green-600">{overall.activeStudents}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-2xl font-bold text-purple-600">{overall.completedStudents}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-2xl font-bold text-orange-600">{overall.avgAttendanceRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Avg Attendance</p>
        </div>
      </div>

      {/* Program-wise Breakdown */}
      <div className="space-y-4">
        {programs.map(p => (
          <div key={p.programId} className="bg-white rounded-xl border overflow-hidden">
            <div
              className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedProgram(expandedProgram === p.programId ? null : p.programId)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.programTitle}</h3>
                  <p className="text-xs text-gray-400">{p.duration} days &middot; {p.batches.length} batch(es)</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-gray-900">{p.totalStudents}</p>
                    <p className="text-xs text-gray-400">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-600">{p.attendanceRate}%</p>
                    <p className="text-xs text-gray-400">Attendance</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-red-600">{p.dropOffRate}%</p>
                    <p className="text-xs text-gray-400">Drop-off</p>
                  </div>
                  <span className="text-gray-400">{expandedProgram === p.programId ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Attendance bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${p.attendanceRate >= 80 ? "bg-green-500" : p.attendanceRate >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${p.attendanceRate}%` }} />
              </div>
            </div>

            {expandedProgram === p.programId && p.batches.length > 0 && (
              <div className="border-t px-5 py-4 bg-gray-50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b">
                      <th className="text-left py-2">Batch</th>
                      <th className="text-center py-2">Total</th>
                      <th className="text-center py-2">Active</th>
                      <th className="text-center py-2">Completed</th>
                      <th className="text-center py-2">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.batches.map(b => (
                      <tr key={b.batchId} className="border-b last:border-0">
                        <td className="py-2 font-medium">{b.batchName}</td>
                        <td className="py-2 text-center">{b.totalStudents}</td>
                        <td className="py-2 text-center text-green-600">{b.activeStudents}</td>
                        <td className="py-2 text-center text-purple-600">{b.completedStudents}</td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.attendanceRate >= 80 ? "bg-green-100 text-green-700" : b.attendanceRate >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                            {b.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
