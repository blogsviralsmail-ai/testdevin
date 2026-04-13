import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Shield, ShieldCheck, ShieldAlert, Users, CheckCircle, XCircle, Crown, Eye, Pencil, Trash2, Plus, Radio, Video, ShoppingCart, Package, Settings, BarChart3, MessageSquare, Tag, UserPlus, Store, Server } from 'lucide-react';

interface Role {
  name: string;
  label: string;
  description: string;
  permissions: string[];
  color: string;
}

const PERMISSION_LABELS: Record<string, { label: string; icon: typeof Shield; category: string }> = {
  dashboard: { label: 'View Dashboard', icon: BarChart3, category: 'Dashboard' },
  users: { label: 'View Users', icon: Users, category: 'Users' },
  'users.create': { label: 'Create Users', icon: Plus, category: 'Users' },
  'users.edit': { label: 'Edit Users', icon: Pencil, category: 'Users' },
  'users.delete': { label: 'Delete Users', icon: Trash2, category: 'Users' },
  slots: { label: 'View Slots', icon: Radio, category: 'Slots' },
  'slots.manage': { label: 'Manage Slots', icon: Radio, category: 'Slots' },
  'slots.delete': { label: 'Delete Slots', icon: Trash2, category: 'Slots' },
  videos: { label: 'View Videos', icon: Video, category: 'Videos' },
  'videos.delete': { label: 'Delete Videos', icon: Trash2, category: 'Videos' },
  orders: { label: 'View Orders', icon: ShoppingCart, category: 'Orders' },
  'orders.manage': { label: 'Manage Orders', icon: ShoppingCart, category: 'Orders' },
  products: { label: 'View Plans', icon: Package, category: 'Plans' },
  'products.create': { label: 'Create Plans', icon: Plus, category: 'Plans' },
  'products.edit': { label: 'Edit Plans', icon: Pencil, category: 'Plans' },
  'products.delete': { label: 'Delete Plans', icon: Trash2, category: 'Plans' },
  settings: { label: 'View Settings', icon: Settings, category: 'Settings' },
  'settings.edit': { label: 'Edit Settings', icon: Pencil, category: 'Settings' },
  analytics: { label: 'View Analytics', icon: BarChart3, category: 'Analytics' },
  contacts: { label: 'View Messages', icon: MessageSquare, category: 'Messages' },
  'contacts.delete': { label: 'Delete Messages', icon: Trash2, category: 'Messages' },
  roles: { label: 'View Roles', icon: Shield, category: 'Roles' },
  'roles.manage': { label: 'Manage Roles', icon: Crown, category: 'Roles' },
  coupons: { label: 'Manage Coupons', icon: Tag, category: 'Coupons' },
  resellers: { label: 'Manage Resellers', icon: Store, category: 'Resellers' },
  affiliates: { label: 'Manage Affiliates', icon: UserPlus, category: 'Affiliates' },
  servers: { label: 'Manage Servers', icon: Server, category: 'Servers' },
  own_profile: { label: 'Own Profile', icon: Users, category: 'Self' },
  own_slots: { label: 'Own Slots', icon: Radio, category: 'Self' },
  own_videos: { label: 'Own Videos', icon: Video, category: 'Self' },
  own_orders: { label: 'Own Orders', icon: ShoppingCart, category: 'Self' },
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Crown,
  moderator: ShieldCheck,
  user: ShieldAlert,
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  admin: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', gradient: 'from-red-500 to-orange-500' },
  moderator: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', gradient: 'from-blue-500 to-cyan-500' },
  user: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', gradient: 'from-green-500 to-emerald-500' },
};

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await adminAPI.getRoles();
      setRoles(res.data.roles);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const getCategories = (permissions: string[]) => {
    const cats: Record<string, string[]> = {};
    permissions.forEach(p => {
      const info = PERMISSION_LABELS[p];
      if (info) {
        if (!cats[info.category]) cats[info.category] = [];
        cats[info.category].push(p);
      }
    });
    return cats;
  };

  const activeRole = roles.find(r => r.name === selectedRole);
  const allPermissions = Object.keys(PERMISSION_LABELS).filter(p => !p.startsWith('own_'));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Shield className="text-indigo-400" size={24} />
            Role Management
          </h1>
          <p className="text-sm text-tertiary mt-1">Manage roles and their access permissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-tertiary hover:text-secondary'}`}
          >
            Card View
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === 'matrix' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-tertiary hover:text-secondary'}`}
          >
            Matrix View
          </button>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const RoleIcon = ROLE_ICONS[role.name] || Shield;
          const colors = ROLE_COLORS[role.name] || ROLE_COLORS.user;
          const isSelected = selectedRole === role.name;
          return (
            <button
              key={role.name}
              onClick={() => setSelectedRole(role.name)}
              className={`relative p-5 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? `${colors.bg} ${colors.border} border-2 shadow-lg`
                  : 'card-premium border-transparent hover:border-[rgb(var(--border))]'
              }`}
            >
              {isSelected && (
                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-gradient-to-r ${colors.gradient} animate-pulse`} />
              )}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center mb-3`}>
                <RoleIcon size={20} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-primary">{role.label}</h3>
              <p className="text-xs text-tertiary mt-1">{role.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-xs font-medium ${colors.text}`}>
                  {role.permissions.length} permissions
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {viewMode === 'cards' && activeRole && (
        <>
          {/* Permission Categories */}
          <div className="card-premium rounded-xl p-6">
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              {(() => {
                const RIcon = ROLE_ICONS[activeRole.name] || Shield;
                return <RIcon size={18} className={ROLE_COLORS[activeRole.name]?.text || 'text-gray-400'} />;
              })()}
              {activeRole.label} Permissions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(getCategories(activeRole.permissions)).map(([category, perms]) => (
                <div key={category} className="rounded-lg p-4" style={{ background: 'rgb(var(--bg-muted))' }}>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    {(() => {
                      const catPerm = PERMISSION_LABELS[perms[0]];
                      if (catPerm) {
                        const CatIcon = catPerm.icon;
                        return <CatIcon size={14} className="text-indigo-400" />;
                      }
                      return null;
                    })()}
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {perms.map(p => {
                      const info = PERMISSION_LABELS[p];
                      const isView = p.endsWith('.create') === false && p.endsWith('.edit') === false && p.endsWith('.delete') === false && p.endsWith('.manage') === false;
                      return (
                        <div key={p} className="flex items-center gap-2 text-xs">
                          {isView ? (
                            <Eye size={12} className="text-emerald-400 flex-shrink-0" />
                          ) : p.endsWith('.delete') ? (
                            <Trash2 size={12} className="text-red-400 flex-shrink-0" />
                          ) : p.endsWith('.create') ? (
                            <Plus size={12} className="text-blue-400 flex-shrink-0" />
                          ) : (
                            <Pencil size={12} className="text-amber-400 flex-shrink-0" />
                          )}
                          <span className="text-secondary">{info?.label || p}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What this role CAN'T do */}
          {activeRole.name !== 'admin' && (
            <div className="card-premium rounded-xl p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <XCircle size={18} className="text-red-400" />
                Restricted Access
              </h2>
              <div className="flex flex-wrap gap-2">
                {allPermissions.filter(p => !activeRole.permissions.includes(p)).map(p => {
                  const info = PERMISSION_LABELS[p];
                  return (
                    <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                      <XCircle size={11} />
                      {info?.label || p}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === 'matrix' && (
        /* Permission Matrix */
        <div className="card-premium rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgb(var(--bg-muted))' }}>
                  <th className="text-left px-4 py-3 text-secondary font-semibold">Permission</th>
                  {roles.map(role => {
                    const colors = ROLE_COLORS[role.name] || ROLE_COLORS.user;
                    return (
                      <th key={role.name} className="text-center px-4 py-3">
                        <span className={`inline-flex items-center gap-1 ${colors.text} font-semibold`}>
                          {role.label}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {allPermissions.map((perm, i) => {
                  const info = PERMISSION_LABELS[perm];
                  return (
                    <tr key={perm} className={i % 2 === 0 ? '' : ''} style={i % 2 === 1 ? { background: 'rgb(var(--bg-muted) / 0.3)' } : {}}>
                      <td className="px-4 py-2.5 text-secondary font-medium">
                        {info?.label || perm}
                      </td>
                      {roles.map(role => (
                        <td key={role.name} className="text-center px-4 py-2.5">
                          {role.permissions.includes(perm) ? (
                            <CheckCircle size={16} className="inline text-emerald-400" />
                          ) : (
                            <XCircle size={16} className="inline text-red-400/40" />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Access Summary */}
      <div className="card-premium rounded-xl p-6">
        <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Shield size={18} className="text-indigo-400" />
          Admin Panel Access by Role
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Admin */}
          <div className="rounded-lg p-4 border border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Crown size={16} className="text-red-400" />
              <span className="text-sm font-semibold text-red-400">Admin</span>
            </div>
            <ul className="space-y-1.5 text-xs text-secondary">
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Full Dashboard Access</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> User Management (CRUD)</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Role Assignment</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Plans & Pricing</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Site Settings</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Server Management</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Analytics & Revenue</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Delete Anything</li>
            </ul>
          </div>
          {/* Moderator */}
          <div className="rounded-lg p-4 border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-blue-400" />
              <span className="text-sm font-semibold text-blue-400">Moderator</span>
            </div>
            <ul className="space-y-1.5 text-xs text-secondary">
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> View Dashboard</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> View & Edit Users</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Manage Slots</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> View Videos & Orders</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> View Messages</li>
              <li className="flex items-center gap-1.5"><XCircle size={11} className="text-red-400/60" /> No Plan Changes</li>
              <li className="flex items-center gap-1.5"><XCircle size={11} className="text-red-400/60" /> No Settings Access</li>
              <li className="flex items-center gap-1.5"><XCircle size={11} className="text-red-400/60" /> No Delete Access</li>
            </ul>
          </div>
          {/* User */}
          <div className="rounded-lg p-4 border border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={16} className="text-green-400" />
              <span className="text-sm font-semibold text-green-400">User</span>
            </div>
            <ul className="space-y-1.5 text-xs text-secondary">
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Own Dashboard</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Own Live Slots</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Own Videos</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Own Orders</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Own Profile</li>
              <li className="flex items-center gap-1.5"><XCircle size={11} className="text-red-400/60" /> No Admin Access</li>
              <li className="flex items-center gap-1.5"><XCircle size={11} className="text-red-400/60" /> No Other Users</li>
              <li className="flex items-center gap-1.5"><XCircle size={11} className="text-red-400/60" /> No Site Settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
