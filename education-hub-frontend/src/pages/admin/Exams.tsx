import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Trash2, X, ClipboardList } from "lucide-react";

interface Exam {
  id: number; name: string; university_name: string; category_name: string;
  session_name: string; exam_date: string; exam_type: string; status: string;
}

export default function AdminExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", university_id: "", category_id: "", session_id: "", exam_date: "", exam_type: "regular", status: "scheduled" });
  const [universities, setUniversities] = useState<Array<{id: number; name: string}>>([]);
  const [categories, setCategories] = useState<Array<{id: number; name: string; university_name: string; university_id: number}>>([]);
  const [tab, setTab] = useState("timetable");

  const load = () => api.get("/api/exams").then((r) => setExams(r.data));
  useEffect(() => {
    load();
    api.get("/api/universities").then((r) => setUniversities(r.data));
    api.get("/api/categories").then((r) => setCategories(r.data));
  }, []);

  const handleSave = async () => {
    await api.post("/api/exams", {
      ...form,
      university_id: form.university_id ? parseInt(form.university_id) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      session_id: form.session_id ? parseInt(form.session_id) : null,
    });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete?")) { await api.delete(`/api/exams/${id}`); load(); }
  };

  const tabs = [
    { id: "timetable", label: "Exam Timetable" },
    { id: "markback", label: "Mark Back Exams" },
    { id: "appeared", label: "Appeared Students" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Exam
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? "bg-white shadow-sm text-blue-700" : "text-gray-600 hover:text-gray-900"}`}>{t.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Exam</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Course</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">University</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams.filter((e) => {
              if (tab === "markback") return e.exam_type === "mark_back";
              return true;
            }).map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-indigo-100 rounded-lg flex items-center justify-center"><ClipboardList className="h-4 w-4 text-indigo-600" /></div>
                    <p className="font-medium text-sm">{e.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{e.category_name || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{e.university_name || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{e.exam_date || "—"}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{e.exam_type}</span></td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${e.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{e.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exams.length === 0 && <div className="p-8 text-center text-gray-500">No exams found</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Exam</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                <select value={form.university_id} onChange={(e) => setForm({ ...form, university_id: e.target.value, category_id: "" })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                  <option value="">Select</option>{universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} disabled={!form.university_id} className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none ${!form.university_id ? "bg-gray-100 cursor-not-allowed" : ""}`}>
                  <option value="">{form.university_id ? "Select Course" : "← Pehle University select karo"}</option>
                  {form.university_id && categories
                    .filter((c) => c.university_id === parseInt(form.university_id))
                    .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam Date</label><input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                  <option value="regular">Regular</option><option value="mark_back">Mark Back</option><option value="supplementary">Supplementary</option>
                </select>
              </div>
              <button onClick={handleSave} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Create Exam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
