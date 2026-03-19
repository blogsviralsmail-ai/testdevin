import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, LogOut, Plus, Pencil, Trash2, FolderOpen, Gem, FileText, LayoutDashboard } from "lucide-react";
import { adminGetDesigns, adminGetCategories, adminCreateDesign, adminUpdateDesign, adminDeleteDesign } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Design, Category } from "../../types";

export default function AdminDesigns() {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", title_hi: "", slug: "", category_id: 0, description: "", description_hi: "",
    weight_grams: 0, purity: "22K", price_range: "", images: "" as string, tags: "", is_featured: false,
  });

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    loadData();
  }, [token, navigate]);

  const loadData = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([adminGetDesigns(token, 1, 100), adminGetCategories(token)])
      .then(([d, c]) => { setDesigns(d.data); setCategories(c.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setForm({ title: "", title_hi: "", slug: "", category_id: 0, description: "", description_hi: "", weight_grams: 0, purity: "22K", price_range: "", images: "", tags: "", is_featured: false });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (d: Design) => {
    setForm({
      title: d.title, title_hi: d.title_hi, slug: d.slug, category_id: d.category_id,
      description: d.description || "", description_hi: d.description_hi || "",
      weight_grams: d.weight_grams, purity: d.purity, price_range: d.price_range || "",
      images: Array.isArray(d.images) ? d.images.join(", ") : (d.images || ""),
      tags: d.tags || "", is_featured: d.is_featured === 1,
    });
    setEditId(d.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const data = {
      ...form,
      images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editId) await adminUpdateDesign(token, editId, data);
      else await adminCreateDesign(token, data);
      resetForm();
      loadData();
    } catch { alert("Error saving design"); }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("क्या आप इस डिज़ाइन को हटाना चाहते हैं?")) return;
    try { await adminDeleteDesign(token, id); loadData(); } catch { alert("Error"); }
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
            <Link key={item.to} to={item.to} className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm border text-sm font-medium ${item.to === "/admin/designs" ? "bg-yellow-50 border-yellow-300 text-yellow-800" : "bg-white text-gray-700 hover:bg-yellow-50"}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">डिज़ाइन प्रबंधन ({designs.length})</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-yellow-700">
            <Plus className="w-4 h-4" /> नया डिज़ाइन
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
            <h3 className="font-bold text-gray-800 mb-4">{editId ? "डिज़ाइन संपादित करें" : "नया डिज़ाइन जोड़ें"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Title (English)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
              <input type="text" placeholder="शीर्षक (हिंदी)" value={form.title_hi} onChange={(e) => setForm({ ...form, title_hi: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
              <input type="text" placeholder="Slug (URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: parseInt(e.target.value) })} className="px-3 py-2 border rounded-lg text-sm" required>
                <option value={0}>Select Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name_hi} ({c.name})</option>)}
              </select>
              <input type="number" placeholder="Weight (grams)" value={form.weight_grams || ""} onChange={(e) => setForm({ ...form, weight_grams: parseFloat(e.target.value) || 0 })} className="px-3 py-2 border rounded-lg text-sm" />
              <select value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                <option value="24K">24K</option><option value="22K">22K</option><option value="18K">18K</option><option value="Silver">Silver</option><option value="Artificial">Artificial</option>
              </select>
              <input type="text" placeholder="Price Range (e.g. ₹15,000 - ₹25,000)" value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder="Image URLs (comma separated)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <textarea placeholder="Description (English)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" rows={2} />
              <textarea placeholder="विवरण (हिंदी)" value={form.description_hi} onChange={(e) => setForm({ ...form, description_hi: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" rows={2} />
              <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured Design
              </label>
              <div className="flex gap-2 md:col-span-2">
                <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700">{editId ? "अपडेट" : "जोड़ें"}</button>
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
                <th className="p-3">Image</th><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Weight</th><th className="p-3">Purity</th><th className="p-3">Views</th><th className="p-3">Actions</th>
              </tr></thead>
              <tbody>
                {designs.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="p-3"><img src={Array.isArray(d.images) && d.images.length > 0 ? d.images[0] : "https://via.placeholder.com/48"} alt="" className="w-12 h-12 rounded-lg object-cover" /></td>
                    <td className="p-3"><div className="font-medium">{d.title_hi}</div><div className="text-xs text-gray-500">{d.title}</div></td>
                    <td className="p-3">{d.category_name_hi || d.category_name || "-"}</td>
                    <td className="p-3">{d.weight_grams}g</td>
                    <td className="p-3">{d.purity}</td>
                    <td className="p-3">{d.views}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(d)} className="text-blue-600 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
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
