import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Building2, Plus, Eye, Trash2, X, Globe, Users, Calendar } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";
const BASE_DOMAIN = import.meta.env.VITE_BASE_DOMAIN || "eduhub.kkhsmedia.com";

function getToken() {
  return localStorage.getItem("platform_token");
}

interface Tenant {
  id: number;
  name: string;
  slug: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  company_name: string;
  plan: string;
  is_active: number;
  created_at: string;
  stats?: { students: number; users: number; enquiries: number };
}

export default function PlatformTenants() {
  const [searchParams] = useSearchParams();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(searchParams.get("action") === "create");
  const [viewTenant, setViewTenant] = useState<Tenant | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "", slug: "", admin_name: "", admin_email: "", admin_phone: "",
    admin_password: "Admin@123", company_name: "", tagline: "", primary_color: "#3b82f6", secondary_color: "#1e40af",
    plan: "starter", max_students: 500, max_users: 10,
  });

  const headers = { Authorization: `Bearer ${getToken()}` };

  const loadTenants = () => {
    setLoading(true);
    axios.get(`${API}/api/platform/tenants`, { headers })
      .then(r => setTenants(r.data.tenants || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTenants(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await axios.post(`${API}/api/platform/tenants`, form, { headers });
      setSuccess(`Tenant "${form.name}" created! Subdomain: ${form.slug}.${BASE_DOMAIN}`);
      setShowCreate(false);
      setForm({ name: "", slug: "", admin_name: "", admin_email: "", admin_phone: "",
        admin_password: "Admin@123", company_name: "", tagline: "", primary_color: "#3b82f6", secondary_color: "#1e40af",
        plan: "starter", max_students: 500, max_users: 10 });
      loadTenants();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      setError(axErr.response?.data?.detail || "Failed to create tenant");
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (slug: string) => {
    if (!confirm("Are you sure you want to deactivate this tenant?")) return;
    try {
      await axios.delete(`${API}/api/platform/tenants/${slug}`, { headers });
      loadTenants();
    } catch { /* ignore */ }
  };

  const viewDetails = async (slug: string) => {
    try {
      const r = await axios.get(`${API}/api/platform/tenants/${slug}`, { headers });
      setViewTenant(r.data.tenant || r.data);
    } catch { /* ignore */ }
  };

  const autoSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> New Tenant
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess("")}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map(t => (
          <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <p className="text-xs text-gray-500">{t.company_name || t.slug}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${t.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {t.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />
                <a href={`https://${t.slug}.${BASE_DOMAIN}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {t.slug}.{BASE_DOMAIN}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                <span>{t.admin_name} ({t.admin_email})</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => viewDetails(t.slug)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition">
                <Eye className="h-3.5 w-3.5" /> View
              </button>
              {t.is_active ? (
                <button onClick={() => handleDeactivate(t.slug)} className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition">
                  <Trash2 className="h-3.5 w-3.5" /> Deactivate
                </button>
              ) : null}
            </div>
          </div>
        ))}

        {tenants.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tenants yet. Create your first franchise!</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold">Create New Tenant</h2>
              <button onClick={() => { setShowCreate(false); setError(""); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Franchise Name *</label>
                  <input type="text" required value={form.name}
                    onChange={e => { setForm({...form, name: e.target.value, slug: autoSlug(e.target.value)}); }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Rajesh Education" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain Slug *</label>
                  <div className="flex items-center">
                    <input type="text" required value={form.slug}
                      onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")})}
                      className="w-full px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="rajesh" />
                    <span className="px-2 py-2 bg-gray-100 border border-l-0 rounded-r-lg text-xs text-gray-500 whitespace-nowrap">.{BASE_DOMAIN}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={form.company_name}
                  onChange={e => setForm({...form, company_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Company display name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input type="text" value={form.tagline}
                  onChange={e => setForm({...form, tagline: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Franchise tagline" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name *</label>
                  <input type="text" required value={form.admin_name}
                    onChange={e => setForm({...form, admin_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
                  <input type="email" required value={form.admin_email}
                    onChange={e => setForm({...form, admin_email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Phone</label>
                  <input type="text" value={form.admin_phone}
                    onChange={e => setForm({...form, admin_phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
                  <input type="password" required value={form.admin_password}
                    onChange={e => setForm({...form, admin_password: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Admin login password" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primary_color}
                      onChange={e => setForm({...form, primary_color: e.target.value})}
                      className="h-10 w-14 border rounded cursor-pointer" />
                    <input type="text" value={form.primary_color}
                      onChange={e => setForm({...form, primary_color: e.target.value})}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.secondary_color}
                      onChange={e => setForm({...form, secondary_color: e.target.value})}
                      className="h-10 w-14 border rounded cursor-pointer" />
                    <input type="text" value={form.secondary_color}
                      onChange={e => setForm({...form, secondary_color: e.target.value})}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input type="number" value={form.max_students}
                    onChange={e => setForm({...form, max_students: parseInt(e.target.value) || 500})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
                  <input type="number" value={form.max_users}
                    onChange={e => setForm({...form, max_users: parseInt(e.target.value) || 10})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setError(""); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {creating ? "Creating..." : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold">{viewTenant.name}</h2>
              <button onClick={() => setViewTenant(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Slug:</span> <span className="font-medium">{viewTenant.slug}</span></div>
                <div><span className="text-gray-500">Plan:</span> <span className="font-medium capitalize">{viewTenant.plan}</span></div>
                <div><span className="text-gray-500">Admin:</span> <span className="font-medium">{viewTenant.admin_name}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{viewTenant.admin_email}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{viewTenant.admin_phone || "-"}</span></div>
                <div><span className="text-gray-500">Status:</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${viewTenant.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {viewTenant.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {viewTenant.stats && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-2">Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{viewTenant.stats.students}</p>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{viewTenant.stats.users}</p>
                      <p className="text-xs text-gray-500">Users</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{viewTenant.stats.enquiries}</p>
                      <p className="text-xs text-gray-500">Enquiries</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-1">Access URL</h3>
                <a href={`https://${viewTenant.slug}.${BASE_DOMAIN}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm">
                  https://{viewTenant.slug}.{BASE_DOMAIN}
                </a>
              </div>

              <div className="text-xs text-gray-400">
                Created: {new Date(viewTenant.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
