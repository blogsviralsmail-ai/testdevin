import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, BookOpen, Loader2 } from "lucide-react";
import api from "../../lib/api";

interface Exam {
  id: number;
  name: string;
  exam_date: string;
  exam_time: string;
  venue: string;
  exam_type: string;
  status: string;
  category_name: string;
}

export default function StudentExamTimetable() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<{ category_name: string; category_id: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // First get student profile to know their course (category_id)
      const studentRes = await api.get("/api/students/me");
      const student = studentRes.data;
      if (student && student.category_id) {
        setStudentInfo({ category_name: student.category_name || "N/A", category_id: student.category_id });
        // Now fetch exams for this student's course
        const examsRes = await api.get(`/api/exams/student/my-exams`);
        setExams(Array.isArray(examsRes.data) ? examsRes.data : []);
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-amber-100 text-amber-700 border-amber-200";
      case "ongoing": return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed": return "bg-green-100 text-green-700 border-green-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "regular": return "bg-blue-50 text-blue-700";
      case "supplementary": return "bg-orange-50 text-orange-700";
      case "internal": return "bg-purple-50 text-purple-700";
      default: return "bg-gray-50 text-gray-600";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBD";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", weekday: "short" });
    } catch { return dateStr; }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "TBD";
    try {
      const [h, m] = timeStr.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const h12 = hour % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    } catch { return timeStr; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Separate upcoming and past exams
  const now = new Date();
  const upcomingExams = exams.filter(e => {
    if (!e.exam_date) return true;
    return new Date(e.exam_date) >= new Date(now.toISOString().split("T")[0]) && e.status !== "completed" && e.status !== "cancelled";
  });
  const pastExams = exams.filter(e => {
    if (!e.exam_date) return false;
    return new Date(e.exam_date) < new Date(now.toISOString().split("T")[0]) || e.status === "completed" || e.status === "cancelled";
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" /> Exam Timetable
          </h1>
          {studentInfo && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> Course: <span className="font-medium text-gray-700">{studentInfo.category_name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">{exams.length} Total Exams</span>
          <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg font-medium">{upcomingExams.length} Upcoming</span>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Exams Scheduled</h3>
          <p className="text-sm text-gray-400">There are no exams scheduled for your course yet. Check back later.</p>
        </div>
      ) : (
        <>
          {/* Upcoming Exams */}
          {upcomingExams.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Upcoming Exams
              </h2>
              <div className="space-y-3">
                {upcomingExams.map(exam => (
                  <div key={exam.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(exam.exam_type)}`}>
                            {exam.exam_type}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            {formatDate(exam.exam_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-green-500" />
                            {formatTime(exam.exam_time)}
                          </span>
                          {exam.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-red-500" />
                              {exam.venue}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(exam.status)}`}>
                        {exam.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Exams */}
          {pastExams.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" /> Past Exams
              </h2>
              <div className="space-y-2">
                {pastExams.map(exam => (
                  <div key={exam.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 opacity-80">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-700">{exam.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getTypeColor(exam.exam_type)}`}>
                            {exam.exam_type}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(exam.exam_date)}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(exam.exam_time)}</span>
                          {exam.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {exam.venue}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(exam.status)}`}>
                        {exam.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
