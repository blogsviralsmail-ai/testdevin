import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Trash2, X, ClipboardList, Edit2, Calendar } from "lucide-react";

interface Exam {
  id: number; name: string; university_name: string; category_name: string;
  session_name: string; exam_date: string; exam_time: string; venue: string;
  exam_type: string; status: string; center_id: number | null; center_name: string | null;
}

export default function CenterExamTimetable() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState({ name: "", category_id: "", session_id: "", exam_date: "", exam_time: "", venue: "", exam_type: "regular", status: "scheduled", visibility: "all" });
  const [universities, setUniversities] = useState<Array<{id: number; name: string}>>([]);
  const [categories, setCategories] = useState<Array<{id: number; name: string; university_name: string; university_id: number}>>([]);
  const [universityId, setUniversityId] = useState("");

  const load = () => {
    api.get("/api/exams").then((r) => { setExams(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get("/api/universities").then((r) => setUniversities(r.data)).catch(() => {});
    api.get("/api/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", category_id: "", session_id: "", exam_date: "", exam_time: "", venue: "", exam_type: "regular", status: "scheduled", visibility: "all" });
    setUniversityId("");
    setShowForm(true);
  };

  const openEdit = (e: Exam) => {
    setEditing(e);
    setForm({ name: e.name, category_id: "", session_id: "", exam_date: e.exam_date || "", exam_time: e.exam_time || "", venue: e.venue || "", exam_type: e.exam_type, status: e.status, visibility: "all" });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        session_id: form.session_id ? parseInt(form.session_id) : null,
      };
      if (editing) {
        await api.put(`/api/exams/${editing.id}`, payload);
      } else {
        await api.post("/api/exams", payload);
      }
      setShowForm(false);
      load();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this exam?")) { await api.delete(`/api/exams/${id}`); load(); }
  };

  const myExams = exams.filter(e => e.center_id !== null);
  const adminExams = exams.filter(e => e.center_id === null);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="h-6 w-6 text-emerald-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Exam Timetable</h1>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Exam
        </button>
      </div>

      {/* My Center Exams */}
      <div>
        <h2 className="text-lg font-semibold text-emerald-800 mb-3">My Center Exams ({myExams.length})</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-emerald-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Exam</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Course</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Time</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Venue</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myExams.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="h-9 w-9 bg-emerald-100 rounded-lg flex items-center justify-center"><ClipboardList className="h-4 w-4 text-emerald-600" /></div>
                      <p className="font-medium text-sm">{e.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{e.category_name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{e.exam_date || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{e.exam_time || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{e.venue || "-"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${e.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{e.status}</span></td>
                  <td className="px-4 py-3 text-right flex gap-1 justify-end">
                    <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-emerald-600"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {myExams.length === 0 && <div className="p-8 text-center text-gray-500">No center exams created yet</div>}
        </div>
      </div>

      {/* Admin Exams (read-only) */}
      <div>
        <h2 className="text-lg font-semibold text-blue-800 mb-3">Admin Exams ({adminExams.length})</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-blue-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Exam</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Course</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">University</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminExams.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center"><ClipboardList className="h-4 w-4 text-blue-600" /></div>
                      <p className="font-medium text-sm">{e.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{e.category_name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{e.university_name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{e.exam_date || "-"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${e.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {adminExams.length === 0 && <div className="p-8 text-center text-gray-500">No admin exams available</div>}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? "Edit Exam" : "Add Exam"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4 text-sm text-emerald-800">
              This exam will be visible to your center's students.
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                <select value={universityId} onChange={(e) => { setUniversityId(e.target.value); setForm({ ...form, category_id: "" }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                  <option value="">Select University</option>{universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} disabled={!universityId} className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none ${!universityId ? "bg-gray-100 cursor-not-allowed" : ""}`}>
                  <option value="">{universityId ? "Select Course" : "Select University first"}</option>
                  {universityId && categories.filter((c) => c.university_id === parseInt(universityId)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam Date</label>
                  <input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam Time</label>
                  <input type="time" value={form.exam_time} onChange={(e) => setForm({ ...form, exam_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="e.g. Room 101, Main Building" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                    <option value="regular">Regular</option><option value="mark_back">Mark Back</option><option value="supplementary">Supplementary</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                    <option value="scheduled">Scheduled</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700">
                {editing ? "Update Exam" : "Create Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
