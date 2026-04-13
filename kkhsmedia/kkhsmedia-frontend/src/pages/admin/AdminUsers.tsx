import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Search, UserPlus, Shield, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  _id: string; firstName: string; lastName: string; email: string;
  role: string; isVerified: boolean; createdAt?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'user' });

  const fetchUsers = async () => {
    try { const r = await adminAPI.getUsers(); setUsers(r.data); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(form);
      setShowCreate(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try { await adminAPI.deleteUser(id); fetchUsers(); } catch {}
  };

  const handleToggleRole = async (id: string, currentRole: string) => {
    try { await adminAPI.updateUser(id, { role: currentRole === 'admin' ? 'user' : 'admin' }); fetchUsers(); } catch {}
  };

  const filtered = users.filter(u =>
    (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Users</h1>
          <p className="text-xs text-tertiary mt-0.5">{users.length} total users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-premium btn-premium-primary text-xs">
          <UserPlus size={14} /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search users..." className="input-premium pl-9 max-w-xs" />
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-4 w-32" /></td>
                    <td><div className="skeleton h-4 w-40" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-xs text-tertiary">No users found</td></tr>
              ) : (
                filtered.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-primary">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="text-xs">{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-accent' : 'badge-neutral'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.isVerified ? 'badge-success' : 'badge-warning'}`}>
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleRole(user._id, user.role)}
                          className="p-1.5 rounded-md btn-premium-ghost" title="Toggle role">
                          <Shield size={13} />
                        </button>
                        <button onClick={() => handleDelete(user._id)}
                          className="p-1.5 rounded-md btn-premium-ghost text-red-400 hover:!bg-red-500/10" title="Delete">
                          <Trash2 size={13} />
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

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md card-premium p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-primary">Create User</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-md btn-premium-ghost"><X size={16} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">First Name</label>
                    <input required value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))} className="input-premium" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Last Name</label>
                    <input required value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))} className="input-premium" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Email</label>
                  <input type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="input-premium" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Password</label>
                  <input type="password" required value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} className="input-premium" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))} className="input-premium">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-premium btn-premium-secondary text-xs">Cancel</button>
                  <button type="submit" className="btn-premium btn-premium-primary text-xs">Create User</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
