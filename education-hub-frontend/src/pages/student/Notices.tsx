import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Bell, Pin, Search, Filter } from "lucide-react";

interface Notice {
  id: number; title: string; content: string; category: string; priority: string;
  is_pinned: number; attachment_url: string; created_at: string;
}

const CATEGORIES = ["All", "General", "Academic", "Exam", "Fee", "Holiday", "Event", "Placement", "Other"];

export default function StudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => { load(); }, []);

  async function load() {
    try { const r = await api.get("/api/notices"); setNotices(r.data); } catch {} finally { setLoading(false); }
  }

  const filtered = notices.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || n.category === category;
    return matchSearch && matchCat;
  });

  const priorityColor = (p: string) => p === "urgent" ? "border-l-red-500 bg-red-50/50" : p === "important" ? "border-l-yellow-500 bg-yellow-50/50" : "border-l-blue-500";
  const priorityBadge = (p: string) => p === "urgent" ? "bg-red-100 text-red-700" : p === "important" ? "bg-yellow-100 text-yellow-700" : "";

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
        <h1 className="text-xl sm:text-2xl font-bold">Notice Board</h1>
        <span className="text-xs sm:text-sm text-gray-500">({filtered.length})</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notices..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(n => (
          <div key={n.id} className={`bg-white rounded-xl border-l-4 border border-gray-200 p-4 ${priorityColor(n.priority)}`}>
            <div className="flex items-start gap-3">
              {n.is_pinned ? <Pin className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" /> : null}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{n.title}</h3>
                  {n.priority !== "normal" && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(n.priority)}`}>{n.priority.toUpperCase()}</span>}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{n.category}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{n.content}</p>
                <div className="flex items-center gap-4 mt-3">
                  <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  {n.attachment_url && <a href={n.attachment_url} target="_blank" className="text-xs text-blue-600 hover:underline">View Attachment</a>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No notices found</p>
          </div>
        )}
      </div>
    </div>
  );
}
