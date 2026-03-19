import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, LogOut, Plus, Pencil, Trash2, FolderOpen, Gem, FileText, LayoutDashboard } from "lucide-react";
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Category } from "../../types";

export default function AdminCategories() {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", name_hi: "", slug: "", description: "", description_hi: "", image_url: "", sort_order: 1 });

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    loadData();
  }, [token, navigate]);

  const loadData = () => {
    if (!token) return;
    setLoading(true);
    adminGetCategories(token)
      .then((r) => setCategories(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setForm({ name: "", name_hi: "", slug: "", description: "", description_hi: "", image_url: "", sort_order: 1 });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, name_hi: cat.name_hi, slug: cat.slug, description: cat.description, description_hi: cat.description_hi, image_url: cat.image_url, sort_order: cat.sort_order });
    setEditId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      if (editId) {
        await adminUpdateCategory(token, editId, form);
      } else {
        await adminCreateCategory(token, form);
      }
      resetForm();
      loadData();
    } catch {
      alert("Error saving category");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("क्या आप इस कैटेगरी को हटाना चाहते हैं?")) return;
    try {
      await adminDeleteCategory(token, id);
      loadData();
    } catch {
      alert("Error deleting category");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-600" />
            <div><h1 className="font-bold text-gray-800">Admin Panel</h1><p className="text-xs text-gray-500">आभूषण बाज़ार</p></div>
          </div>
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
            <Link key={item.to} to={item.to} className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm border text-sm font-medium ${item.to === "/admin/categories" ? "bg-yellow-50 border-yellow-300 text-yellow-800" : "bg-white text-gray-700 hover:bg-yellow-50"}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">कैटेगरी प्रबंधन</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-yellow-700">
            <Plus className="w-4 h-4" /> नई कैटेगरी
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
            <h3 className="font-bold text-gray-800 mb-4">{editId ? "कैटेगरी संपादित करें" : "नई कैटेगरी जोड़ें"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Name (English)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
              <input type="text" placeholder="नाम (हिंदी)" value={form.name_hi} onChange={(e) => setForm({ ...form, name_hi: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
              <input type="text" placeholder="Slug (URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
              <input type="text" placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <textarea placeholder="Description (English)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" rows={2} />
              <textarea placeholder="विवरण (हिंदी)" value={form.description_hi} onChange={(e) => setForm({ ...form, description_hi: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" rows={2} />
              <input type="number" placeholder="Sort Order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 1 })} className="px-3 py-2 border rounded-lg text-sm" />
              <div className="flex gap-2 items-end">
                <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700">{editId ? "अपडेट" : "जोड़ें"}</button>
                <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm">रद्द करें</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left">
                <th className="p-3">Image</th><th className="p-3">Name</th><th className="p-3">Hindi</th><th className="p-3">Designs</th><th className="p-3">Order</th><th className="p-3">Actions</th>
              </tr></thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-t hover:bg-gray-50">
                    <td className="p-3"><img src={cat.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" /></td>
                    <td className="p-3 font-medium">{cat.name}</td>
                    <td className="p-3">{cat.name_hi}</td>
                    <td className="p-3">{cat.design_count}</td>
                    <td className="p-3">{cat.sort_order}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
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
