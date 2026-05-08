"use client";
import { useState, useEffect } from "react";

interface Testimonial { id: string; name: string; role?: string; content: string; rating: number; avatar?: string; videoUrl?: string; isPublished: boolean; createdAt: string; }

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [form, setForm] = useState({ name: "", role: "", content: "", rating: 5, videoUrl: "", isPublished: true });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user || d));
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => { const r = await fetch("/api/testimonials"); if (r.ok) setTestimonials(await r.json()); };

  const saveTestimonial = async () => {
    if (editing) {
      await fetch(`/api/testimonials/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); setForm({ name: "", role: "", content: "", rating: 5, videoUrl: "", isPublished: true }); fetchTestimonials();
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    fetchTestimonials();
  };

  const editTestimonial = (t: Testimonial) => {
    setEditing(t); setForm({ name: t.name, role: t.role || "", content: t.content, rating: t.rating, videoUrl: t.videoUrl || "", isPublished: t.isPublished }); setShowForm(true);
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
          <p className="text-sm text-gray-500">Student reviews and success stories</p>
        </div>
        {isAdmin && <button onClick={() => { setEditing(null); setForm({ name: "", role: "", content: "", rating: 5, videoUrl: "", isPublished: true }); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ Add Testimonial</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.map(t => (
          <div key={t.id} className="bg-white rounded-xl p-5 border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">{t.name[0]}</div>
              <div>
                <p className="font-medium text-sm">{t.name}</p>
                {t.role && <p className="text-xs text-gray-500">{t.role}</p>}
              </div>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map(s => <span key={s} className={`text-sm ${s <= t.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>)}
            </div>
            <p className="text-sm text-gray-600 line-clamp-4">{t.content}</p>
            {t.videoUrl && <a href={t.videoUrl} target="_blank" rel="noopener" className="text-xs text-indigo-600 mt-2 block">🎥 Watch Video</a>}
            {isAdmin && (
              <div className="flex gap-3 mt-3 pt-3 border-t">
                <button onClick={() => editTestimonial(t)} className="text-xs text-indigo-600">Edit</button>
                <button onClick={() => deleteTestimonial(t.id)} className="text-xs text-red-600">Delete</button>
                {!t.isPublished && <span className="text-xs text-gray-400 ml-auto">Hidden</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {testimonials.length === 0 && <div className="text-center py-12 text-gray-400">No testimonials yet.</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">{editing ? "Edit" : "Add"} Testimonial</h2>
            <div className="space-y-3">
              <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Role (e.g. Full Stack Intern)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <textarea placeholder="Review content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border rounded-lg h-24" />
              <div className="flex items-center gap-3">
                <label className="text-sm">Rating:</label>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setForm({ ...form, rating: s })} className={`text-xl ${s <= form.rating ? "text-yellow-400" : "text-gray-200"}`}>★</button>
                ))}
              </div>
              <input placeholder="Video URL (optional)" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} /><span className="text-sm">Published (show on homepage)</span></label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={saveTestimonial} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
