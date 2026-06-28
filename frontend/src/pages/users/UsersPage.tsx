import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Plus, Search, Edit, Trash2, Eye, X, Shield, ToggleLeft, ToggleRight } from 'lucide-react';

interface User { id: number; uid: string; email: string; first_name: string; last_name: string; user_roles_id: number; vendors_id: number; status: number; email_verified_at: string; created_at: string; }

const roleLabels: Record<number, string> = { 1: 'Super Admin', 2: 'Vendor Admin', 3: 'Vendor User' };
const roleColors: Record<number, string> = { 1: 'bg-red-100 text-red-700', 2: 'bg-blue-100 text-blue-700', 3: 'bg-gray-100 text-gray-700' };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '', role: '1' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users?page=${page}&search=${search}`);
      const d = data.data || data;
      setUsers(d.items || d.data || d || []);
      if (d.meta) setMeta(d.meta);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', { email: formData.email, password: formData.password, firstName: formData.firstName, lastName: formData.lastName, roleId: parseInt(formData.role) });
      toast.success('User created'); setShowCreate(false);
      setFormData({ email: '', password: '', firstName: '', lastName: '', role: '1' }); fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      await api.put(`/users/${editUser.id}`, { firstName: formData.firstName, lastName: formData.lastName, roleId: parseInt(formData.role) });
      toast.success('Updated'); setEditUser(null); fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    try { await api.delete(`/users/${id}`); toast.success('Deleted'); fetchUsers(); }
    catch { toast.error('Failed'); }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { status: user.status === 1 ? 0 : 1 });
      toast.success(user.status === 1 ? 'Disabled' : 'Enabled'); fetchUsers();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">User Management</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage platform users and roles</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Add User</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: meta.total, color: 'text-blue-500' },
          { label: 'Active', value: users.filter(u => u.status === 1).length, color: 'text-green-500' },
          { label: 'Admins', value: users.filter(u => u.user_roles_id === 1).length, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 max-w-md">
        <Search size={16} className="text-gray-400" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
        {loading ? (
          <div className="p-8 animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
                <th className="py-3 px-4 text-left text-gray-500 font-medium">User</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Email</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Role</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Status</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Created</th>
                <th className="py-3 px-4 text-right text-gray-500 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xs font-bold">{(u.first_name?.[0] || '?').toUpperCase()}</div>
                        <span className="font-medium dark:text-white">{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 dark:text-gray-300">{u.email}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[u.user_roles_id] || roleColors[3]}`}>{roleLabels[u.user_roles_id] || 'User'}</span></td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status === 1 ? 'Active' : 'Disabled'}</span></td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditUser(u); setFormData({ email: u.email, password: '', firstName: u.first_name, lastName: u.last_name || '', role: String(u.user_roles_id) }); }} className="p-1 text-gray-400 hover:text-emerald-500"><Edit size={16} /></button>
                        <button onClick={() => handleToggleStatus(u)} className="p-1">{u.status === 1 ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-gray-400" />}</button>
                        {u.user_roles_id !== 1 && <button onClick={() => handleDelete(u.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Create User</h3><button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">First Name *</label><input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Last Name</label><input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Email *</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Password *</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                  <option value="1">Super Admin</option><option value="2">Vendor Admin</option><option value="3">Vendor User</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Create User</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Edit User</h3><button onClick={() => setEditUser(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">First Name</label><input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Last Name</label><input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                  <option value="1">Super Admin</option><option value="2">Vendor Admin</option><option value="3">Vendor User</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Update User</button>
                <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
