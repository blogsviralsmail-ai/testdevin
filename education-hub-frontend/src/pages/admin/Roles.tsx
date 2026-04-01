import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Edit2, Trash2, X, Shield, Users, Eye, EyeOff, KeyRound } from "lucide-react";

interface Role {
  id: number; name: string; description: string; permissions: string | Record<string, boolean>; status: string; created_at: string;
}

const parsePerms = (p: string | Record<string, boolean> | null | undefined): Record<string, boolean> => {
  if (!p) return {};
  if (typeof p === 'object') return p as Record<string, boolean>;
  try { return JSON.parse(p); } catch { return {}; }
};

interface RoleUser {
  id: number; name: string; email: string; phone: string; username: string; role_id: number; role_name: string; status: string;
}

const MODULES = [
  "dashboard", "universities", "categories", "students", "form_builder",
  "exams", "accounts", "support", "documents", "branches",
  "enquiries", "team", "testimonials", "settings", "roles", "delete_entries",
  "counselor_leads", "fees", "payment_settings", "sub_centers", "commission",
  "deal_fees", "announcements", "exam_timetable", "leads", "communication",
  "notices", "analytics", "placements", "blog", "gallery", "careers", "popups",
  "fees_chain"
];

export default function AdminRoles() {
  const [tab, setTab] = useState<"roles" | "users">("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", permissions: {} as Record<string, boolean>, status: "active" });
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", phone: "", username: "", password: "", role_id: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState<RoleUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const loadRoles = () => api.get("/api/roles").then(r => setRoles(r.data)).catch(() => {});
  const loadUsers = () => api.get("/api/roles/users").then(r => setUsers(r.data)).catch(() => {});
  useEffect(() => { loadRoles(); loadUsers(); }, []);

  const openNewRole = () => {
    setEditId(null);
    const perms: Record<string, boolean> = {};
    MODULES.forEach(m => perms[m] = false);
    setForm({ name: "", description: "", permissions: perms, status: "active" });
    setShowForm(true);
  };

  const openEditRole = (r: Role) => {
    setEditId(r.id);
    const perms: Record<string, boolean> = parsePerms(r.permissions);
    MODULES.forEach(m => { if (!(m in perms)) perms[m] = false; });
    setForm({ name: r.name, description: r.description || "", permissions: perms, status: r.status });
    setShowForm(true);
  };

  const saveRole = async () => {
    const payload = { ...form, permissions: JSON.stringify(form.permissions) };
    if (editId) await api.put("/api/roles/" + editId, payload);
    else await api.post("/api/roles", payload);
    setShowForm(false);
    loadRoles();
  };

  const deleteRole = async (id: number) => {
    if (confirm("Delete this role?")) { await api.delete("/api/roles/" + id); loadRoles(); }
  };

  const openNewUser = () => {
    setEditUserId(null);
    setUserForm({ name: "", email: "", phone: "", username: "", password: "", role_id: roles[0]?.id?.toString() || "" });
    setShowUserForm(true);
  };

  const openEditUser = (u: RoleUser) => {
    setEditUserId(u.id);
    setUserForm({ name: u.name, email: u.email || "", phone: u.phone || "", username: u.username, password: "", role_id: String(u.role_id) });
    setShowUserForm(true);
  };

  const saveUser = async () => {
    const rid = parseInt(userForm.role_id);
    const payload = { ...userForm, role_id: isNaN(rid) ? null : rid };
    if (editUserId) await api.put("/api/roles/users/" + editUserId, payload);
    else await api.post("/api/roles/users", payload);
    setShowUserForm(false);
    loadUsers();
  };

  const deleteUser = async (id: number) => {
    if (confirm("Delete this user?")) { await api.delete("/api/roles/users/" + id); loadUsers(); }
  };

  const togglePerm = (mod: string) => {
    setForm(f => ({ ...f, permissions: { ...f.permissions, [mod]: !f.permissions[mod] } }));
  };

  const openResetPwd = (u: RoleUser) => {
    setResetPwdUser(u);
    setNewPassword("");
    setShowNewPwd(false);
    setResetMsg("");
  };

  const resetPassword = async () => {
    if (!resetPwdUser || !newPassword) return;
    try {
      await api.put("/api/roles/users/" + resetPwdUser.id + "/reset-password", { new_password: newPassword });
      setResetMsg("Password changed successfully!");
      setTimeout(() => { setResetPwdUser(null); setResetMsg(""); }, 1500);
    } catch {
      setResetMsg("Failed to change password");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Shield className="h-6 w-6 text-indigo-600" /> Role Management</h1>
        <button onClick={tab === "roles" ? openNewRole : openNewUser} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add {tab === "roles" ? "Role" : "User"}
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setTab("roles")} className={"px-4 py-2 text-sm font-medium border-b-2 " + (tab === "roles" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500")}>
          <Shield className="h-4 w-4 inline mr-1" /> Roles ({roles.length})
        </button>
        <button onClick={() => setTab("users")} className={"px-4 py-2 text-sm font-medium border-b-2 " + (tab === "users" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500")}>
          <Users className="h-4 w-4 inline mr-1" /> Users ({users.length})
        </button>
      </div>

      {tab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(r => {
            const perms = parsePerms(r.permissions);
            const activePerms = Object.entries(perms).filter(([, v]) => v).map(([k]) => k);
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{r.name}</h3>
                    <p className="text-xs text-gray-500">{r.description}</p>
                  </div>
                  <span className={"text-xs px-2 py-0.5 rounded-full " + (r.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>{r.status}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {activePerms.length > 0 ? activePerms.map(p => (
                    <span key={p} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded capitalize">{p.replace(/_/g, " ")}</span>
                  )) : <span className="text-xs text-gray-400">No permissions</span>}
                </div>
                <div className="flex gap-1 pt-2 border-t border-gray-100">
                  <button onClick={() => openEditRole(r)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => deleteRole(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
          {roles.length === 0 && <div className="col-span-3 text-center py-12 text-gray-500">No roles created yet</div>}
        </div>
      )}

      {tab === "users" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Username</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><p className="text-sm font-medium">{u.name}</p></td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                    <p>{u.email}</p>
                    <p className="text-xs text-gray-400">{u.phone}</p>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{u.role_name || "N/A"}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{u.username}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openResetPwd(u)} className="p-1.5 text-gray-400 hover:text-amber-600" title="Reset Password"><KeyRound className="h-4 w-4" /></button>
                    <button onClick={() => openEditUser(u)} className="p-1.5 text-gray-400 hover:text-indigo-600" title="Edit User"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => deleteUser(u.id)} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete User"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="p-8 text-center text-gray-500">No role users yet</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editId ? "Edit" : "Create"} Role</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Module Permissions</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MODULES.map(m => (
                    <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={!!form.permissions[m]} onChange={() => togglePerm(m)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                      <span className="capitalize">{m.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={saveRole} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 text-sm">
                {editId ? "Update" : "Create"} Role
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editUserId ? "Edit" : "Create"} Role User</h2>
              <button onClick={() => setShowUserForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select value={userForm.role_id} onChange={e => setUserForm({ ...userForm, role_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
                  <option value="">Select Role</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {editUserId ? "(leave empty to keep)" : "*"}</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button onClick={saveUser} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 text-sm">
                {editUserId ? "Update" : "Create"} User
              </button>
            </div>
          </div>
        </div>
      )}
      {resetPwdUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><KeyRound className="h-5 w-5 text-amber-500" /> Reset Password</h2>
              <button onClick={() => setResetPwdUser(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Change password for <strong>{resetPwdUser.name}</strong> ({resetPwdUser.username})</p>
            {resetMsg && <div className={"text-sm px-3 py-2 rounded-lg mb-3 " + (resetMsg.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{resetMsg}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                <div className="relative">
                  <input type={showNewPwd ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm pr-10" />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button onClick={resetPassword} disabled={!newPassword} className="w-full bg-amber-500 text-white py-2.5 rounded-lg font-medium hover:bg-amber-600 text-sm disabled:opacity-50">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
