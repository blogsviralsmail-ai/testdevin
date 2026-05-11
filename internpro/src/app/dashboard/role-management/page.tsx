"use client";

import { useState, useEffect, useCallback } from "react";

interface Permission {
  key: string;
  label: string;
  group: string;
}

interface RolePerm {
  id: string;
  permission: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  permissions: RolePerm[];
  createdAt: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ displayName: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [assigningUser, setAssigningUser] = useState<string | null>(null);
  const [assignRole, setAssignRole] = useState("");
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [rolesRes, usersRes] = await Promise.all([
      fetch("/api/roles"),
      fetch("/api/users"),
    ]);
    if (rolesRes.ok) {
      const data = await rolesRes.json();
      setRoles(data.roles);
      setAllPermissions(data.allPermissions);
      // Seed if no roles exist
      if (data.roles.length === 0) {
        await fetch("/api/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "seed" }),
        });
        const r2 = await fetch("/api/roles");
        if (r2.ok) {
          const d2 = await r2.json();
          setRoles(d2.roles);
          setAllPermissions(d2.allPermissions);
        }
      }
    }
    if (usersRes.ok) {
      const data = await usersRes.json();
      setUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const grouped = allPermissions.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setSelectedPerms(new Set(role.permissions.map(p => p.permission)));
    setShowCreate(false);
  };

  const togglePerm = (key: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    const groupPerms = allPermissions.filter(p => p.group === group).map(p => p.key);
    const allSelected = groupPerms.every(p => selectedPerms.has(p));
    setSelectedPerms(prev => {
      const next = new Set(prev);
      groupPerms.forEach(p => { if (allSelected) next.delete(p); else next.add(p); });
      return next;
    });
  };

  const selectAllPerms = () => {
    setSelectedPerms(new Set(allPermissions.map(p => p.key)));
  };

  const clearAllPerms = () => {
    setSelectedPerms(new Set());
  };

  const saveRole = async () => {
    setSaving(true);
    if (editingRole) {
      await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: editingRole.id,
          displayName: editingRole.displayName,
          description: editingRole.description,
          permissions: Array.from(selectedPerms),
        }),
      });
    }
    setSaving(false);
    setEditingRole(null);
    fetchData();
  };

  const createRole = async () => {
    if (!newRole.displayName) return;
    setSaving(true);
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        name: newRole.displayName.toLowerCase().replace(/\s+/g, "_"),
        displayName: newRole.displayName,
        description: newRole.description,
        permissions: Array.from(selectedPerms),
      }),
    });
    setSaving(false);
    setShowCreate(false);
    setNewRole({ displayName: "", description: "" });
    setSelectedPerms(new Set());
    fetchData();
  };

  const deleteRole = async (id: string) => {
    if (!confirm("Delete this role? Users with this role will need reassignment.")) return;
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    fetchData();
  };

  const handleAssignRole = async (userId: string, roleName: string) => {
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign_role", userId, roleName }),
    });
    setAssigningUser(null);
    fetchData();
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Role Management</h1>
          <p className="text-sm text-slate-500">Manage roles, permissions, and user access rights</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        <button onClick={() => setActiveTab("roles")} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "roles" ? "bg-[#0EA5B8] text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
          Roles & Permissions
        </button>
        <button onClick={() => setActiveTab("users")} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "users" ? "bg-[#0EA5B8] text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
          User Role Assignment
        </button>
      </div>

      {/* Roles Tab */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setShowCreate(true); setEditingRole(null); setSelectedPerms(new Set()); }}
              className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm">+ Create New Role</button>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div key={role.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{role.displayName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{role.name}</p>
                    {role.description && <p className="text-xs text-slate-400 mt-1">{role.description}</p>}
                  </div>
                  {role.isSystem && <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">System</span>}
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500">{role.permissions.length} permissions</p>
                  <div className="flex flex-wrap gap-1 mt-2 max-h-20 overflow-hidden">
                    {role.permissions.slice(0, 8).map(p => (
                      <span key={p.id} className="text-[10px] px-1.5 py-0.5 bg-[#0EA5B8]/10 text-[#22d3ee] rounded">{p.permission}</span>
                    ))}
                    {role.permissions.length > 8 && <span className="text-[10px] text-slate-500">+{role.permissions.length - 8} more</span>}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => startEdit(role)} className="text-xs px-3 py-1.5 bg-[#0EA5B8]/20 text-[#22d3ee] rounded-lg hover:bg-[#0EA5B8]/30">Edit Permissions</button>
                  {!role.isSystem && (
                    <button onClick={() => deleteRole(role.id)} className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Edit/Create Permission Panel */}
          {(editingRole || showCreate) && (
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  {editingRole ? `Edit: ${editingRole.displayName}` : "Create New Role"}
                </h2>
                <button onClick={() => { setEditingRole(null); setShowCreate(false); }} className="text-sm text-slate-500 hover:text-slate-300">Close</button>
              </div>

              {showCreate && (
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Role Name</label>
                    <input value={newRole.displayName} onChange={e => setNewRole(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="e.g. Content Manager" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                    <input value={newRole.description} onChange={e => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg text-sm text-white" placeholder="Brief description of this role" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-slate-300 font-medium">Permissions ({selectedPerms.size}/{allPermissions.length})</span>
                <button onClick={selectAllPerms} className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">Select All</button>
                <button onClick={clearAllPerms} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">Clear All</button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(grouped).map(([group, perms]) => {
                  const allInGroup = perms.every(p => selectedPerms.has(p.key));
                  return (
                    <div key={group} className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4">
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input type="checkbox" checked={allInGroup} onChange={() => toggleGroup(group)}
                          className="rounded border-white/20 bg-white/5 accent-[#0EA5B8] w-4 h-4" />
                        <span className="text-sm font-semibold text-white">{group}</span>
                      </label>
                      <div className="space-y-2">
                        {perms.map(p => (
                          <label key={p.key} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={selectedPerms.has(p.key)} onChange={() => togglePerm(p.key)}
                              className="rounded border-white/20 bg-white/5 accent-[#0EA5B8] w-3.5 h-3.5" />
                            <span className="text-xs text-slate-300">{p.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={editingRole ? saveRole : createRole} disabled={saving}
                  className="px-6 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm hover:bg-[#0891b2] disabled:opacity-50">
                  {saving ? "Saving..." : editingRole ? "Save Changes" : "Create Role"}
                </button>
                <button onClick={() => { setEditingRole(null); setShowCreate(false); }}
                  className="px-6 py-2 bg-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/20">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr className="text-left text-slate-400">
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Current Role</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-medium">{u.name}</td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      u.role === "admin" ? "bg-red-500/20 text-red-400" :
                      u.role === "organization" ? "bg-purple-500/20 text-purple-400" :
                      u.role === "teamleader" ? "bg-amber-500/20 text-amber-400" :
                      u.role === "agent" ? "bg-blue-500/20 text-blue-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>
                      {roles.find(r => r.name === u.role)?.displayName || u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    {assigningUser === u.id ? (
                      <div className="flex items-center gap-2">
                        <select value={assignRole} onChange={e => setAssignRole(e.target.value)}
                          className="px-2 py-1 border rounded text-xs text-white bg-transparent">
                          <option value="">Select Role</option>
                          {roles.map(r => <option key={r.id} value={r.name}>{r.displayName}</option>)}
                        </select>
                        <button onClick={() => { if (assignRole) handleAssignRole(u.id, assignRole); }}
                          className="text-xs px-2 py-1 bg-[#0EA5B8] text-white rounded">Save</button>
                        <button onClick={() => setAssigningUser(null)} className="text-xs px-2 py-1 bg-white/10 text-slate-300 rounded">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setAssigningUser(u.id); setAssignRole(u.role); }}
                        className="text-xs px-3 py-1.5 bg-[#0EA5B8]/20 text-[#22d3ee] rounded-lg hover:bg-[#0EA5B8]/30">Change Role</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
