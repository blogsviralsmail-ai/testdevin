"use client";

import { useEffect, useState } from "react";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: string;
  category: string;
  tags: string | null;
  isPublished: boolean;
  views: number;
  createdAt: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", coverImage: "", category: "General", tags: "", isPublished: false });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const fetchBlogs = () => {
    fetch("/api/blogs")
      .then((r) => r.json())
      .then((data) => { setBlogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchBlogs(); }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.content) return alert("Title and content are required");
    setSaving(true);
    const method = editingBlog ? "PUT" : "POST";
    const body = editingBlog ? { ...form, id: editingBlog.id } : form;
    const res = await fetch("/api/blogs", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      setShowEditor(false);
      setEditingBlog(null);
      setForm({ title: "", content: "", excerpt: "", coverImage: "", category: "General", tags: "", isPublished: false });
      fetchBlogs();
    } else {
      alert("Error saving blog");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    await fetch(`/api/blogs?id=${id}`, { method: "DELETE" });
    fetchBlogs();
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!confirm(`Delete ${selected.length} blog posts?`)) return;
    await fetch(`/api/blogs?ids=${selected.join(",")}`, { method: "DELETE" });
    setSelected([]);
    fetchBlogs();
  };

  const togglePublish = async (blog: Blog) => {
    await fetch("/api/blogs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: blog.id, isPublished: !blog.isPublished }) });
    fetchBlogs();
  };

  const openEditor = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
      setForm({ title: blog.title, content: blog.content, excerpt: blog.excerpt || "", coverImage: blog.coverImage || "", category: blog.category, tags: blog.tags || "", isPublished: blog.isPublished });
    } else {
      setEditingBlog(null);
      setForm({ title: "", content: "", excerpt: "", coverImage: "", category: "General", tags: "", isPublished: false });
    }
    setShowEditor(true);
  };

  const inputCls = "w-full px-4 py-2 border rounded-lg text-sm text-white";
  const inputStyle = { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Management</h1>
          <p className="text-slate-400 text-sm">Write and manage blog posts for your website</p>
        </div>
        <button onClick={() => openEditor()}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
          + New Blog Post
        </button>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <span className="text-sm text-red-300">{selected.length} selected</span>
          <button onClick={handleBulkDelete} className="px-3 py-1 rounded text-sm bg-red-600 text-white hover:bg-red-700">Delete Selected</button>
          <button onClick={() => setSelected([])} className="px-3 py-1 rounded text-sm text-slate-400 hover:text-white">Cancel</button>
        </div>
      )}

      {/* Blog Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6" style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editingBlog ? "Edit Blog Post" : "New Blog Post"}</h2>
              <button onClick={() => setShowEditor(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls} style={inputStyle} placeholder="Blog post title..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputCls} style={inputStyle} placeholder="e.g., Career Tips, Internship Guide" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className={inputCls} style={inputStyle} placeholder="internship, career, skills" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Cover Image URL</label>
                <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  className={inputCls} style={inputStyle} placeholder="https://example.com/image.jpg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Excerpt (short description)</label>
                <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className={inputCls} style={inputStyle} rows={2} placeholder="Brief summary of the blog post..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Content * (HTML supported)</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className={inputCls} style={{ ...inputStyle, minHeight: "300px", fontFamily: "monospace" }}
                  placeholder="<h2>Introduction</h2><p>Write your blog content here...</p>" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-300">Publish immediately</label>
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-5 h-5 rounded" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSubmit} disabled={saving}
                  className="px-6 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
                  {saving ? "Saving..." : editingBlog ? "Update Post" : "Create Post"}
                </button>
                <button onClick={() => setShowEditor(false)} className="px-6 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-slate-600">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog List */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-slate-400 text-lg mb-2">No blog posts yet</p>
          <p className="text-slate-500 text-sm">Click &quot;+ New Blog Post&quot; to write your first blog</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blogs.map((blog) => (
            <div key={blog.id} className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <input type="checkbox" checked={selected.includes(blog.id)}
                onChange={(e) => setSelected(e.target.checked ? [...selected, blog.id] : selected.filter((s) => s !== blog.id))}
                className="w-4 h-4 rounded" />
              {blog.coverImage ? (
                <img src={blog.coverImage} alt="" className="w-16 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-12 rounded-lg flex items-center justify-center bg-white/5 text-xl">📝</div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{blog.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{blog.category}</span>
                  <span>•</span>
                  <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{blog.views} views</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${blog.isPublished ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"}`}>
                {blog.isPublished ? "Published" : "Draft"}
              </span>
              <button onClick={() => togglePublish(blog)} className="px-3 py-1 rounded text-xs text-slate-400 hover:text-white border border-slate-600">
                {blog.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button onClick={() => openEditor(blog)} className="px-3 py-1 rounded text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-600/30">Edit</button>
              <button onClick={() => handleDelete(blog.id)} className="px-3 py-1 rounded text-xs text-red-400 hover:text-red-300 border border-red-600/30">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
