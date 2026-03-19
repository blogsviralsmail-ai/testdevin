import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, LogOut, Plus, Pencil, Trash2, FolderOpen, Gem, FileText, LayoutDashboard } from "lucide-react";
import { adminGetBlogs, adminCreateBlog, adminUpdateBlog, adminDeleteBlog } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Blog } from "../../types";

export default function AdminBlogs() {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", title_hi: "", slug: "", content: "", content_hi: "", excerpt_hi: "",
    category: "", tags: "", image_url: "", is_published: true,
  });

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    loadData();
  }, [token, navigate]);

  const loadData = () => {
    if (!token) return;
    setLoading(true);
    adminGetBlogs(token, 1, 100)
      .then((r) => setBlogs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setForm({ title: "", title_hi: "", slug: "", content: "", content_hi: "", excerpt_hi: "", category: "", tags: "", image_url: "", is_published: true });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (b: Blog) => {
    setForm({
      title: b.title, title_hi: b.title_hi, slug: b.slug,
      content: b.content || "", content_hi: b.content_hi || "", excerpt_hi: b.excerpt_hi || "",
      category: b.category || "", tags: b.tags || "", image_url: b.image_url || "",
      is_published: b.is_published === 1,
    });
    setEditId(b.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      if (editId) await adminUpdateBlog(token, editId, form);
      else await adminCreateBlog(token, form);
      resetForm();
      loadData();
    } catch { alert("Error saving blog"); }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("क्या आप इस लेख को हटाना चाहते हैं?")) return;
    try { await adminDeleteBlog(token, id); loadData(); } catch { alert("Error"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3"><Crown className="w-6 h-6 text-yellow-600" /><div><h1 className="font-bold text-gray-800">Admin Panel</h1><p className="text-xs text-gray-500">आभूषण बाज़ार</p></div></div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{username}</span>
            <Link to="/" className="text-sm text-yellow-700">साइट देखें</Link>
            <button onClick={() => { logout(); navigate("/admin/login"); }} className="text-sm text-red-600 flex items-center gap-1"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="flex flex-wrap gap-2 mb-8">
          {[
            { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
            { to: "/admin/categories", label: "Categories", icon: FolderOpen },
            { to: "/admin/designs", label: "Designs", icon: Gem },
            { to: "/admin/blogs", label: "Blogs", icon: FileText },
          ].map((item) => (
            <Link key={item.to} to={item.to} className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm border text-sm font-medium ${item.to === "/admin/blogs" ? "bg-yellow-50 border-yellow-300 text-yellow-800" : "bg-white text-gray-700 hover:bg-yellow-50"}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">ब्लॉग प्रबंधन ({blogs.length})</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-yellow-700">
            <Plus className="w-4 h-4" /> नया लेख
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
            <h3 className="font-bold text-gray-800 mb-4">{editId ? "लेख संपादित करें" : "नया लेख जोड़ें"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Title (English)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
              <input type="text" placeholder="शीर्षक (हिंदी)" value={form.title_hi} onChange={(e) => setForm({ ...form, title_hi: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
              <input type="text" placeholder="Slug (URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
              <input type="text" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <textarea placeholder="Excerpt (Hindi)" value={form.excerpt_hi} onChange={(e) => setForm({ ...form, excerpt_hi: e.target.value })} className="px-3 py-2 border rounded-lg text-sm md:col-span-2" rows={2} />
              <textarea placeholder="Content (English)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" rows={6} />
              <textarea placeholder="सामग्री (हिंदी)" value={form.content_hi} onChange={(e) => setForm({ ...form, content_hi: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" rows={6} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Published
              </label>
              <div className="flex gap-2">
                <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700">{editId ? "अपडेट" : "प्रकाशित करें"}</button>
                <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm">रद्द करें</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left">
                <th className="p-3">Image</th><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Views</th><th className="p-3">Actions</th>
              </tr></thead>
              <tbody>
                {blogs.map((b) => (
                  <tr key={b.id} className="border-t hover:bg-gray-50">
                    <td className="p-3"><img src={b.image_url || "https://via.placeholder.com/48"} alt="" className="w-12 h-12 rounded-lg object-cover" /></td>
                    <td className="p-3"><div className="font-medium">{b.title_hi}</div><div className="text-xs text-gray-500">{b.title}</div></td>
                    <td className="p-3">{b.category}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${b.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {b.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="p-3">{b.views}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(b)} className="text-blue-600 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
