import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { UserPlus, Users, Trash2, Edit, Shield, Search } from 'lucide-react';

interface TeamMember { id: number; first_name: string; last_name: string; email: string; username: string; role: string; status: number; created_at: string; }

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', username: '', password: '', role: 'agent' });

  const fetchData = async () => { setLoading(true); try { const { data } = await api.get('/team'); setMembers((data.data || data)?.data || data.data || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!formData.email || !formData.first_name || !formData.password) { toast.error('Name, email & password required'); return; }
    try { await api.post('/team', formData); toast.success('Team member added'); setShowAdd(false); setFormData({ first_name: '', last_name: '', email: '', username: '', password: '', role: 'agent' }); fetchData(); }
    catch { toast.error('Failed to add member'); }
  };

  const handleDelete = async (id: number) => { if (!confirm('Remove this team member?')) return; try { await api.delete(`/team/${id}`); toast.success('Removed'); fetchData(); } catch { toast.error('Failed'); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Users className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">Team Management</h1></div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"><UserPlus size={18} /> Add Member</button>
      </div>
      {showAdd && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          <h3 className="font-semibold dark:text-white mb-4">Add Team Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="First Name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Last Name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <option value="agent">Agent</option><option value="manager">Manager</option><option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="bg-emerald-500 text-white px-4 py-2 rounded-lg">Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg dark:border-slate-600 dark:text-gray-300">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> :
         members.length === 0 ? <div className="p-12 text-center"><Users size={48} className="mx-auto text-gray-300 mb-4" /><h3 className="text-lg font-semibold dark:text-white">No Team Members</h3><p className="text-gray-500 mt-2">Add team members to collaborate on chat and campaigns.</p></div> : (
          <table className="w-full"><thead className="bg-gray-50 dark:bg-slate-700"><tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Name</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Email</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Role</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
          </tr></thead><tbody className="divide-y dark:divide-slate-700">
            {members.map(m => (
              <tr key={m.id}><td className="px-4 py-3 text-sm dark:text-white">{m.first_name} {m.last_name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.email}</td>
                <td className="px-4 py-3 text-sm"><span className="flex items-center gap-1"><Shield size={14} />{m.role}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${m.status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.status === 1 ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
              </tr>))}
          </tbody></table>)}
      </div>
    </div>
  );
}
