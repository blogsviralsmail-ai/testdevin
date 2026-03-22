import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";
const token = () => localStorage.getItem("center_token") || localStorage.getItem("token") || "";
const api = axios.create({ baseURL: API });
api.interceptors.request.use((c) => { c.headers.Authorization = `Bearer ${token()}`; return c; });

interface Role { id: number; name: string; description: string; permissions: string; permissions_obj: Record<string, boolean>; status: string; user_count: number; created_at: string; }
interface RoleUser { id: number; username: string; name: string; email: string; phone: string; role: string; role_name: string; role_id: number; permissions_obj: Record<string, boolean>; is_active: number; created_at: string; }

const CENTER_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "students", label: "Students" },
  { key: "documents", label: "Documents" },
  { key: "fees", label: "Accounts / Fees" },
  { key: "payment_settings", label: "Payment Settings" },
  { key: "sub_centers", label: "Sub-centers" },
  { key: "commission", label: "Commission" },
  { key: "deal_fees", label: "Deal Fees" },
  { key: "counselor_leads", label: "Counselor Leads" },
  { key: "announcements", label: "Announcements" },
  { key: "exam_timetable", label: "Exam Timetable" },
  { key: "support", label: "Support Tickets" },
  { key: "fees_chain", label: "Fees Chain" },
  { key: "settings", label: "Settings" },
  { key: "roles", label: "Roles & Team" },
];

export default function CenterRoleManagement() {
  const [tab, setTab] = useState<"roles" | "users">("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Role form
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editRoleId, setEditRoleId] = useState<number | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [rolePerms, setRolePerms] = useState<Record<string, boolean>>({});
  const [savingRole, setSavingRole] = useState(false);

  // User form
  const [showUserForm, setShowUserForm] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRoleId, setUserRoleId] = useState<number>(0);
  const [savingUser, setSavingUser] = useState(false);

  // Password reset
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPass, setNewPass] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, uRes, mRes] = await Promise.all([
        api.get("/api/center-roles/roles"),
        api.get("/api/center-roles/users"),
        api.get("/api/center-roles/modules"),
      ]);
      setRoles(rRes.data || []);
      setUsers(uRes.data || []);
      setModules(mRes.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Role CRUD ──
  const openRoleForm = (role?: Role) => {
    if (role) {
      setEditRoleId(role.id);
      setRoleName(role.name);
      setRoleDesc(role.description || "");
      setRolePerms(role.permissions_obj || {});
    } else {
      setEditRoleId(null);
      setRoleName("");
      setRoleDesc("");
      setRolePerms({});
    }
    setShowRoleForm(true);
  };

  const saveRole = async () => {
    if (!roleName.trim()) { alert("Role name is required"); return; }
    setSavingRole(true);
    const body = { name: roleName, description: roleDesc, permissions: JSON.stringify(rolePerms), status: "active" };
    try {
      if (editRoleId) {
        await api.put(`/api/center-roles/roles/${editRoleId}`, body);
      } else {
        await api.post("/api/center-roles/roles", body);
      }
      setShowRoleForm(false);
      load();
    } catch (e: any) { alert(e?.response?.data?.detail || "Error"); }
    setSavingRole(false);
  };

  const deleteRole = async (id: number) => {
    if (!confirm("Delete this role?")) return;
    try { await api.delete(`/api/center-roles/roles/${id}`); load(); } catch (e: any) { alert(e?.response?.data?.detail || "Error"); }
  };

  // ── User CRUD ──
  const saveUser = async () => {
    if (!userName || !userUsername || !userPassword || !userRoleId) { alert("Fill all required fields"); return; }
    setSavingUser(true);
    try {
      await api.post("/api/center-roles/users", {
        name: userName, email: userEmail, phone: userPhone,
        username: userUsername, password: userPassword, role_id: userRoleId,
      });
      setShowUserForm(false);
      setUserName(""); setUserEmail(""); setUserPhone(""); setUserUsername(""); setUserPassword(""); setUserRoleId(0);
      load();
    } catch (e: any) { alert(e?.response?.data?.detail || "Error"); }
    setSavingUser(false);
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Delete this employee?")) return;
    try { await api.delete(`/api/center-roles/users/${id}`); load(); } catch (e: any) { alert(e?.response?.data?.detail || "Error"); }
  };

  const resetPassword = async () => {
    if (!resetUserId || !newPass) { alert("Enter new password"); return; }
    try {
      await api.put(`/api/center-roles/users/${resetUserId}/reset-password`, { new_password: newPass });
      alert("Password reset successfully");
      setResetUserId(null); setNewPass("");
    } catch (e: any) { alert(e?.response?.data?.detail || "Error"); }
  };

  const togglePerm = (key: string) => setRolePerms((p) => ({ ...p, [key]: !p[key] }));
  const selectAllPerms = () => {
    const all: Record<string, boolean> = {};
    CENTER_MODULES.forEach((m) => { all[m.key] = true; });
    setRolePerms(all);
  };
  const clearAllPerms = () => setRolePerms({});

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Roles & Team Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        <button onClick={() => setTab("roles")} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "roles" ? "bg-white text-blue-700 shadow" : "text-gray-600"}`}>
          Roles ({roles.length})
        </button>
        <button onClick={() => setTab("users")} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "users" ? "bg-white text-blue-700 shadow" : "text-gray-600"}`}>
          Team Members ({users.length})
        </button>
      </div>

      {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}

      {/* ── ROLES TAB ── */}
      {!loading && tab === "roles" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => openRoleForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ Create Role</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">{r.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                </div>
                {r.description && <p className="text-sm text-gray-500">{r.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(r.permissions_obj || {}).filter(([, v]) => v).map(([k]) => (
                    <span key={k} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{k.replace(/_/g, " ")}</span>
                  ))}
                  {Object.keys(r.permissions_obj || {}).filter((k) => r.permissions_obj[k]).length === 0 && (
                    <span className="text-xs text-gray-400 italic">No permissions set</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-500">{r.user_count} user(s)</span>
                  <div className="flex gap-1">
                    <button onClick={() => openRoleForm(r)} className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100">Edit</button>
                    <button onClick={() => deleteRole(r.id)} className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {roles.length === 0 && <p className="text-gray-400 col-span-3 text-center py-8">No roles created yet. Create one to get started.</p>}
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {!loading && tab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowUserForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">+ Add Employee</button>
          </div>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Permissions</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No team members yet</td></tr>}
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500">{u.email}</div>
                      <div className="text-xs text-gray-500">{u.phone}</div>
                    </td>
                    <td className="px-4 py-3"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{u.role_name}</span></td>
                    <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Object.entries(u.permissions_obj || {}).filter(([, v]) => v).slice(0, 4).map(([k]) => (
                          <span key={k} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{k.replace(/_/g, " ")}</span>
                        ))}
                        {Object.keys(u.permissions_obj || {}).filter((k) => u.permissions_obj[k]).length > 4 && (
                          <span className="text-xs text-gray-400">+{Object.keys(u.permissions_obj).filter((k) => u.permissions_obj[k]).length - 4} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setResetUserId(u.id); setNewPass(""); }} className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs hover:bg-amber-100" title="Reset Password">🔑</button>
                        <button onClick={() => deleteUser(u.id)} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE/EDIT ROLE MODAL ── */}
      {showRoleForm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowRoleForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editRoleId ? "Edit Role" : "Create New Role"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role Name *</label>
                <input value={roleName} onChange={(e) => setRoleName(e.target.value)} className="w-full border rounded-lg p-2" placeholder="e.g. Counselor, Data Entry, Accountant" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} className="w-full border rounded-lg p-2" placeholder="Brief description of this role" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Module Access</label>
                  <div className="flex gap-2">
                    <button onClick={selectAllPerms} className="text-xs text-blue-600 hover:underline">Select All</button>
                    <button onClick={clearAllPerms} className="text-xs text-red-600 hover:underline">Clear All</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CENTER_MODULES.map((m) => (
                    <label key={m.key} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${rolePerms[m.key] ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                      <input type="checkbox" checked={!!rolePerms[m.key]} onChange={() => togglePerm(m.key)} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowRoleForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button onClick={saveRole} disabled={savingRole} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {savingRole ? "Saving..." : editRoleId ? "Update Role" : "Create Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD EMPLOYEE MODAL ── */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowUserForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Add Employee</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input value={userUsername} onChange={(e) => setUserUsername(e.target.value)} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign Role *</label>
                <select value={userRoleId} onChange={(e) => setUserRoleId(Number(e.target.value))} className="w-full border rounded-lg p-2">
                  <option value={0}>Select Role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowUserForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button onClick={saveUser} disabled={savingUser} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {savingUser ? "Creating..." : "Create Employee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {resetUserId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setResetUserId(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Reset Password</h3>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full border rounded-lg p-2 mb-4" placeholder="New password" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setResetUserId(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={resetPassword} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
