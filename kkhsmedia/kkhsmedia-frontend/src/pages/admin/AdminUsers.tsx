import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Plus, Search, Trash2, Shield, ShieldCheck, ShieldAlert, UserCog, Key, X, ChevronDown, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserData {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  isVerified?: boolean;
  totalSlots?: number;
  activeSlots?: number;
  planUnlimited?: boolean;
  createdAt?: string;
}

const ROLES = [
  { value: 'admin', label: 'Admin', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', desc: 'Full access' },
  { value: 'moderator', label: 'Moderator', icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', desc: 'Manage content' },
  { value: 'user', label: 'User', icon: Shield, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', desc: 'Basic access' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const rowAnim = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [showResetPw, setShowResetPw] = useState<string | null>(null);
  const [resetPwValue, setResetPwValue] = useState('Temp@1234');
  const [msg, setMsg] = useState('');
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'user' });

  const fetchUsers = () => {
    setLoading(true);
    adminAPI.getUsers({ search, limit: 100 }).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.users || []);
      setUsers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const uid = (u: UserData) => u._id || u.id || '';

  const handleCreate = async () => {
    try {
      await adminAPI.createUser(createForm);
      setShowCreate(false);
      setCreateForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'user' });
      setMsg('User created successfully!');
      fetchUsers();
    } catch { setMsg('Failed to create user.'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setShowRoleMenu(null);
      setMsg('Role updated to ' + newRole);
      fetchUsers();
    } catch { setMsg('Failed to update role.'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete the user and all their data.')) return;
    try { await adminAPI.deleteUser(id); fetchUsers(); setMsg('User deleted.'); } catch { setMsg('Failed to delete.'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await adminAPI.resetUserPassword(userId, resetPwValue);
      setShowResetPw(null);
      setResetPwValue('Temp@1234');
      setMsg('Password reset successfully!');
    } catch { setMsg('Failed to reset password.'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    try { await adminAPI.updateUser(id, { status: newStatus }); fetchUsers(); } catch { /* ignore */ }
  };

  const getRoleBadge = (role: string) => {
    const r = ROLES.find(item => item.value === role) || ROLES[2];
    const Icon = r.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${r.bg} ${r.color} border ${r.border}`}>
        <Icon size={12} />
        {r.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <UserCog size={24} className="text-indigo-400" /> User Management
          </h1>
          <p className="text-sm text-tertiary mt-1">{users.length} users total</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20">
          <Plus size={16} /> Create User
        </motion.button>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl text-sm font-medium border ${
              msg.includes('success') || msg.includes('updated') || msg.includes('deleted') || msg.includes('created') || msg.includes('reset')
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgb(var(--bg-elevated))] border border-white/5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" />
      </motion.div>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="surface-elevated rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Slots</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="flex items-center gap-3"><div className="skeleton w-9 h-9 rounded-full" /><div><div className="skeleton h-3 w-28 mb-1.5" /><div className="skeleton h-2.5 w-36" /></div></div></td>
                    <td><div className="skeleton h-6 w-20 rounded-lg" /></td>
                    <td><div className="skeleton h-5 w-14 rounded-full" /></td>
                    <td><div className="skeleton h-3 w-10" /></td>
                    <td><div className="skeleton h-3 w-20" /></td>
                    <td></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-tertiary text-sm">No users found</td></tr>
              ) : (
                users.map(user => {
                  const userId = uid(user);
                  return (
                  <motion.tr key={userId} variants={rowAnim} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-primary">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-tertiary">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="relative">
                        <button onClick={() => setShowRoleMenu(showRoleMenu === userId ? null : userId)}
                          className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                          {getRoleBadge(user.role)}
                          <ChevronDown size={12} className="text-tertiary" />
                        </button>
                        <AnimatePresence>
                          {showRoleMenu === userId && (
                            <motion.div initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.95 }}
                              className="absolute z-50 top-full mt-1 left-0 w-48 bg-[rgb(var(--bg-elevated))] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                              {ROLES.map(role => {
                                const RIcon = role.icon;
                                return (
                                <button key={role.value} onClick={() => handleRoleChange(userId, role.value)}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors ${user.role === role.value ? 'bg-white/[0.03]' : ''}`}>
                                  <RIcon size={14} className={role.color} />
                                  <div className="text-left">
                                    <div className="font-medium text-primary">{role.label}</div>
                                    <div className="text-[10px] text-tertiary">{role.desc}</div>
                                  </div>
                                  {user.role === role.value && <Crown size={12} className="ml-auto text-amber-400" />}
                                </button>
                              );})}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                    <td>
                      <button onClick={() => handleStatusToggle(userId, user.status || 'active')}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          (user.status || 'active') === 'active' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}>
                        {user.status || 'active'}
                      </button>
                    </td>
                    <td>
                      <span className="text-sm text-secondary">
                        {user.activeSlots || 0}/{user.totalSlots || 0}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-tertiary">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setShowResetPw(userId)}
                          className="p-1.5 rounded-lg hover:bg-amber-500/10 text-tertiary hover:text-amber-400 transition-colors" title="Reset Password">
                          <Key size={14} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(userId)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-tertiary hover:text-red-400 transition-colors" title="Delete User">
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );})
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[rgb(var(--bg-elevated))] border border-white/10 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2"><Plus size={18} className="text-indigo-400" /> Create New User</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-white/5"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="First Name" value={createForm.firstName}
                    onChange={e => setCreateForm({...createForm, firstName: e.target.value})}
                    className="px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50" />
                  <input type="text" placeholder="Last Name" value={createForm.lastName}
                    onChange={e => setCreateForm({...createForm, lastName: e.target.value})}
                    className="px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50" />
                </div>
                <input type="email" placeholder="Email" value={createForm.email}
                  onChange={e => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50" />
                <input type="password" placeholder="Password" value={createForm.password}
                  onChange={e => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50" />
                <input type="tel" placeholder="Phone (optional)" value={createForm.phone}
                  onChange={e => setCreateForm({...createForm, phone: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50" />

                {/* Role Selection */}
                <div>
                  <label className="text-xs font-medium text-tertiary mb-2 block">Assign Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(role => {
                      const RoleIcon = role.icon;
                      return (
                      <button key={role.value} onClick={() => setCreateForm({...createForm, role: role.value})}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          createForm.role === role.value
                            ? `${role.bg} ${role.border} ${role.color}`
                            : 'border-white/5 text-tertiary hover:border-white/10'
                        }`}>
                        <RoleIcon size={18} />
                        <span className="text-xs font-medium">{role.label}</span>
                      </button>
                    );})}
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20">
                  Create User
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetPw && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowResetPw(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[rgb(var(--bg-elevated))] border border-white/10 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold flex items-center gap-2"><Key size={16} className="text-amber-400" /> Reset Password</h2>
                <button onClick={() => setShowResetPw(null)} className="p-1 rounded-lg hover:bg-white/5"><X size={18} /></button>
              </div>
              <p className="text-xs text-tertiary mb-3">Set a new temporary password for this user.</p>
              <input type="text" value={resetPwValue} onChange={e => setResetPwValue(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-white/10 text-sm focus:outline-none focus:border-amber-500/50 mb-3" />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { if (showResetPw) handleResetPassword(showResetPw); }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium">
                Reset Password
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
