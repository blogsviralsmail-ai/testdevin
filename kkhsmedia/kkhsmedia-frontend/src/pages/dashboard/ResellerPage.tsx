import { useState, useEffect } from 'react';
import { resellerAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ResellerPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'clients'>('dashboard');
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', email: '', password: '', maxSlots: 5 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [dashRes, clientsRes] = await Promise.all([
        resellerAPI.getDashboard(),
        resellerAPI.getClients(),
      ]);
      setDashboard(dashRes.data);
      setClients(clientsRes.data?.clients || []);
    } catch {
      toast.error('Reseller access required');
    } finally { setLoading(false); }
  };

  const addClient = async () => {
    if (!newClient.email || !newClient.password) return toast.error('Email and password required');
    try {
      await resellerAPI.createClient(newClient);
      toast.success('Client created');
      setShowAdd(false);
      setNewClient({ firstName: '', lastName: '', email: '', password: '', maxSlots: 5 });
      loadData();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'suspended' : 'active';
    await resellerAPI.updateClientStatus(id, newStatus);
    loadData();
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client and all their data?')) return;
    await resellerAPI.deleteClient(id);
    toast.success('Client deleted');
    loadData();
  };

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reseller Panel</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Dashboard</button>
          <button onClick={() => setTab('clients')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'clients' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Clients</button>
        </div>
      </div>

      {tab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-1">{dashboard.brandName || 'Reseller Dashboard'}</h2>
            <p className="text-sm opacity-75">Manage your clients and earn commissions</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Clients', value: `${dashboard.totalClients}/${dashboard.maxClients}`, color: 'bg-blue-50 text-blue-700' },
              { label: 'Active Clients', value: dashboard.activeClients, color: 'bg-green-50 text-green-700' },
              { label: 'Total Slots', value: dashboard.totalSlots, color: 'bg-purple-50 text-purple-700' },
              { label: 'Streaming Now', value: dashboard.streamingSlots, color: 'bg-orange-50 text-orange-700' },
              { label: 'Total Revenue', value: `₹${dashboard.totalRevenue}`, color: 'bg-teal-50 text-teal-700' },
              { label: 'Your Commission', value: `₹${dashboard.commission}`, color: 'bg-indigo-50 text-indigo-700' },
              { label: 'Commission Rate', value: `${dashboard.commissionRate}%`, color: 'bg-yellow-50 text-yellow-700' },
            ].map((card, i) => (
              <div key={i} className={`rounded-lg p-4 ${card.color}`}>
                <p className="text-sm font-medium opacity-75">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'clients' && (
        <div className="space-y-4">
          <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Client</button>

          {showAdd && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" value={newClient.firstName} onChange={e => setNewClient({ ...newClient, firstName: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={newClient.lastName} onChange={e => setNewClient({ ...newClient, lastName: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" value={newClient.password} onChange={e => setNewClient({ ...newClient, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Slots</label>
                <input type="number" value={newClient.maxSlots} onChange={e => setNewClient({ ...newClient, maxSlots: parseInt(e.target.value) || 5 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={addClient} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Create Client</button>
                <button onClick={() => setShowAdd(false)} className="bg-gray-100 px-4 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border">
            {clients.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No clients yet. Add your first client!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500">Slots</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500">Streaming</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {clients.map((client: any) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{client.firstName} {client.lastName}</td>
                        <td className="px-4 py-3 text-gray-500">{client.email}</td>
                        <td className="px-4 py-3 text-center">{client.totalSlots}/{client.maxSlots}</td>
                        <td className="px-4 py-3 text-center">{client.streamingSlots}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleStatus(client.id, client.status)} className="text-blue-600 hover:underline text-xs mr-2">
                            {client.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button onClick={() => deleteClient(client.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
