import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building, Plus, Search, Edit, Trash2, Eye, ToggleLeft, ToggleRight, X, Settings, Users as UsersIcon, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Vendor { id: number; uid: string; title: string; slug: string; status: number; created_at: string; }
interface VendorUser { id: number; email: string; first_name: string; last_name: string; user_roles_id: number; status: number; }

export default function VendorsPage() {
  const { setAuth } = useAuthStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });
  const [showCreate, setShowCreate] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [vendorUsers, setVendorUsers] = useState<VendorUser[]>([]);
  const [showSettings, setShowSettings] = useState<Vendor | null>(null);
  const [vendorSettings, setVendorSettings] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ title: '', email: '', password: '' });

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/vendors?page=${page}&search=${search}`);
      const d = data.data || data;
      setVendors(d.data || d.items || d || []);
      if (d.meta) setMeta(d.meta);
    } catch { toast.error('Failed to load vendors'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vendors', formData);
      toast.success('Vendor created'); setShowCreate(false);
      setFormData({ title: '', email: '', password: '' }); fetchVendors();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVendor) return;
    try {
      await api.put(`/vendors/${editVendor.id}`, { title: formData.title });
      toast.success('Updated'); setEditVendor(null); fetchVendors();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this vendor and all associated data?')) return;
    try { await api.delete(`/vendors/${id}`); toast.success('Deleted'); fetchVendors(); }
    catch { toast.error('Failed'); }
  };

  const handleToggle = async (vendor: Vendor) => {
    try {
      await api.post(`/vendors/${vendor.id}/toggle-status`);
      toast.success(vendor.status === 1 ? 'Vendor disabled' : 'Vendor enabled'); fetchVendors();
    } catch { toast.error('Failed'); }
  };

  const viewVendorDetails = async (vendor: Vendor) => {
    setViewVendor(vendor);
    try {
      const { data } = await api.get(`/vendors/${vendor.id}/users`);
      setVendorUsers(data.data || data || []);
    } catch { /* ignore */ }
  };

  const handleLoginAs = async (vendor: Vendor) => {
    if (!confirm(`Login as vendor "${vendor.title}"? You will be logged in as this vendor's admin user.`)) return;
    try {
      const { data } = await api.post(`/vendors/${vendor.id}/login-as`);
      const d = data.data || data;
      setAuth(d.user, d.accessToken, d.refreshToken);
      toast.success(`Logged in as ${vendor.title}`);
      window.location.href = '/dashboard';
    } catch { toast.error('Failed to login as vendor'); }
  };

  const openSettings = async (vendor: Vendor) => {
    setShowSettings(vendor);
    try {
      const { data } = await api.get(`/vendors/${vendor.id}/settings`);
      const settings: Record<string, string> = {};
      (data.data || data || []).forEach((s: { name: string; value: string }) => { settings[s.name] = s.value; });
      setVendorSettings(settings);
    } catch { /* ignore */ }
  };

  const saveSettings = async () => {
    if (!showSettings) return;
    try {
      const settings = Object.entries(vendorSettings).map(([name, value]) => ({ name, value }));
      await api.put(`/vendors/${showSettings.id}/settings`, { settings });
      toast.success('Settings saved'); setShowSettings(null);
    } catch { toast.error('Failed'); }
  };

  const settingsFields = [
    { key: 'whatsapp_access_token', label: 'WhatsApp Access Token' },
    { key: 'whatsapp_phone_number_id', label: 'Phone Number ID' },
    { key: 'whatsapp_business_account_id', label: 'Business Account ID' },
    { key: 'webhook_verify_token', label: 'Webhook Verify Token' },
    { key: 'meta_app_id', label: 'Meta App ID' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Vendors</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage platform vendors (tenants)</p></div>
        <button onClick={() => { setShowCreate(true); setFormData({ title: '', email: '', password: '' }); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Add Vendor</button>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 max-w-md">
        <Search size={16} className="text-gray-400" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search vendors..." className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
        {loading ? (
          <div className="p-8 animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded" />)}</div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-gray-400"><Building size={48} className="mx-auto mb-4 opacity-50" /><p>No vendors found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
                <th className="py-3 px-4 text-left text-gray-500 font-medium">ID</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Vendor</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Slug</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Status</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Created</th>
                <th className="py-3 px-4 text-right text-gray-500 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750">
                    <td className="py-3 px-4 dark:text-gray-300">{v.id}</td>
                    <td className="py-3 px-4 font-medium dark:text-white">
                      <div className="flex items-center gap-2"><Building size={16} className="text-emerald-500" />{v.title}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{v.slug}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${v.status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v.status === 1 ? 'Active' : 'Disabled'}</span></td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(v.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewVendorDetails(v)} className="p-1 text-gray-400 hover:text-blue-500" title="View"><Eye size={16} /></button>
                        <button onClick={() => openSettings(v)} className="p-1 text-gray-400 hover:text-purple-500" title="Settings"><Settings size={16} /></button>
                        <button onClick={() => { setEditVendor(v); setFormData({ title: v.title, email: '', password: '' }); }} className="p-1 text-gray-400 hover:text-emerald-500" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => handleLoginAs(v)} className="p-1 text-gray-400 hover:text-orange-500" title="Login as Vendor"><LogIn size={16} /></button>
                        <button onClick={() => handleToggle(v)} className="p-1">{v.status === 1 ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-gray-400" />}</button>
                        <button onClick={() => handleDelete(v.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-gray-500">{meta.total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-slate-600 dark:text-gray-300">Prev</button>
              <span className="px-3 py-1 text-sm dark:text-gray-300">{page} / {meta.totalPages}</span>
              <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page === meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-slate-600 dark:text-gray-300">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Vendor */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Create Vendor</h3><button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Vendor Name *</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Admin Email *</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Admin Password *</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Create Vendor</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vendor */}
      {editVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Edit Vendor</h3><button onClick={() => setEditVendor(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Vendor Name</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Update</button>
                <button type="button" onClick={() => setEditVendor(null)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Vendor Details */}
      {viewVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Vendor Details</h3><button onClick={() => setViewVendor(null)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b dark:border-slate-700">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><Building className="text-emerald-600" size={24} /></div>
                <div><h4 className="text-xl font-bold dark:text-white">{viewVendor.title}</h4><p className="text-sm text-gray-500">/{viewVendor.slug}</p></div>
              </div>
              <div><p className="text-sm font-medium dark:text-gray-300 mb-2">Users ({vendorUsers.length})</p>
                {vendorUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b dark:border-slate-700">
                    <div className="flex items-center gap-2"><UsersIcon size={14} className="text-gray-400" /><span className="text-sm dark:text-white">{u.first_name} {u.last_name}</span></div>
                    <span className="text-xs text-gray-500">{u.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Settings */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Vendor Settings - {showSettings.title}</h3><button onClick={() => setShowSettings(null)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-4">
              {settingsFields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">{f.label}</label>
                  <input value={vendorSettings[f.key] || ''} onChange={e => setVendorSettings({...vendorSettings, [f.key]: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" />
                </div>
              ))}
              <button onClick={saveSettings} className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
