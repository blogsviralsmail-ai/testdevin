import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Users, Search, Ban, CheckCircle, Trash2, RefreshCw } from 'lucide-react';

interface UserItem {
  id: string; firstName: string; lastName: string; email: string;
  role: string; status: string; emailVerified: boolean; createdAt: string;
  slotsCount?: number;
}

export default function AdminUsers() {
  const { settings } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const primary = settings?.primaryColor || '#6366f1';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data.users || res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminAPI.updateUser(userId, { status: newStatus });
      loadUsers();
    } catch { /* ignore */ }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user permanently?')) return;
    try { await adminAPI.deleteUser(userId); loadUsers(); } catch { /* ignore */ }
  };

  const filtered = users.filter(u =>
    u.firstName.toLowerCase().includes(search.toLowerCase()) ||
    u.lastName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users ({users.length})</h1>
        <button onClick={loadUsers} className="px-3 py-2 rounded-lg border hover:bg-gray-50"><RefreshCw size={18} /></button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search users..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden lg:table-cell">Joined</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: primary }}>
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {user.role !== 'admin' && (
                        <>
                          <button onClick={() => handleToggleStatus(user.id, user.status || 'active')}
                            className="p-1.5 rounded hover:bg-gray-100" title={user.status === 'active' ? 'Suspend' : 'Activate'}>
                            {user.status === 'active' ? <Ban size={14} className="text-orange-500" /> : <CheckCircle size={14} className="text-green-500" />}
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded hover:bg-red-50">
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
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
