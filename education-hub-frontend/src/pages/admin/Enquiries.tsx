import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Search, Eye, Loader2, MessageSquare, Trash2, CheckSquare, Square } from "lucide-react";

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  university_name: string;
  course_name: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEnquiries();
  }, []);

  async function loadEnquiries() {
    try {
      const res = await api.get("/api/enquiries");
      setEnquiries(res.data.enquiries || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await api.put(`/api/enquiries/${id}/status`, { status });
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch {
      // empty
    }
  }

  async function deleteEnquiry(id: number) {
    if (!confirm("Are you sure you want to delete this enquiry?")) return;
    try {
      await api.delete(`/api/enquiries/${id}`);
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch { /* empty */ }
  }

  async function bulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} enquiries?`)) return;
    setDeleting(true);
    try {
      await api.post("/api/enquiries/bulk-delete", { ids: selectedIds });
      setEnquiries((prev) => prev.filter((e) => !selectedIds.includes(e.id)));
      setSelectedIds([]);
    } catch { /* empty */ }
    setDeleting(false);
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((e) => e.id));
    }
  };

  const filtered = enquiries.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search);
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
        <span className="text-sm text-gray-500">{filtered.length} enquiries</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="closed">Closed</option>
        </select>
        {selectedIds.length > 0 && (
          <button
            onClick={bulkDelete}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                    {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    No enquiries found
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className={`hover:bg-gray-50 ${selectedIds.includes(e.id) ? "bg-blue-50" : ""}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(e.id)} className="text-gray-400 hover:text-gray-600">
                        {selectedIds.includes(e.id) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{e.email}</div>
                      <div className="text-xs">{e.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {e.city && e.state ? `${e.city}, ${e.state}` : e.state || e.city || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="font-medium">{e.course_name || <span className="text-gray-400 italic">Not Selected</span>}</div>
                      <div className="text-xs text-gray-400">{e.university_name || ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={e.status}
                        onChange={(ev) => updateStatus(e.id, ev.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${
                          e.status === "new" ? "bg-blue-100 text-blue-700" :
                          e.status === "contacted" ? "bg-yellow-100 text-yellow-700" :
                          e.status === "converted" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {e.created_at ? new Date(e.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(e)} className="text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteEnquiry(e.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">Enquiry Details</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-500">Name</span>
                    <p className="text-sm font-medium">{selected.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Email</span>
                    <p className="text-sm">{selected.email}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Phone</span>
                    <p className="text-sm">{selected.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Location</span>
                    <p className="text-sm">{selected.city}, {selected.state}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">University</span>
                    <p className="text-sm">{selected.university_name || "-"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Course</span>
                    <p className="text-sm">{selected.course_name || "-"}</p>
                  </div>
                </div>
                {selected.message && (
                  <div>
                    <span className="text-xs text-gray-500">Message</span>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{selected.message}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => { deleteEnquiry(selected.id); }} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  Delete
                </button>
                <button onClick={() => setSelected(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
