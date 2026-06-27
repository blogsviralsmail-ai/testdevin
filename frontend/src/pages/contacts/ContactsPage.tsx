import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Plus, Search, Upload, Download, Tag, Trash2, Edit, Eye, Ban, CheckCircle, X, UserPlus } from 'lucide-react';

interface Contact {
  id: number; uid: string; first_name: string; last_name: string; wa_id: string;
  email: string; phone: string; country: string; status: number; unread_count: number;
  last_message_at: string; created_at: string;
}
interface Label { id: number; title: string; text_color: string; }
interface ContactGroup { id: number; title: string; description: string; }

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', waId: '', email: '', phone: '', country: '' });
  const [labelForm, setLabelForm] = useState({ title: '', color: '#10B981' });
  const [groupForm, setGroupForm] = useState({ title: '', description: '' });
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups' | 'labels'>('contacts');

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/contacts?page=${page}&search=${search}`);
      const d = data.data || data;
      setContacts(d.data || d.items || []);
      if (d.meta) setMeta(d.meta);
    } catch { toast.error('Failed to load contacts'); }
    finally { setLoading(false); }
  }, [page, search]);

  const fetchLabels = async () => {
    try {
      const { data } = await api.get('/contacts/labels/all');
      setLabels((data.data || data) || []);
    } catch { /* ignore */ }
  };

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/contact-groups');
      const d = data.data || data;
      setGroups(d.items || d.data || d || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchContacts(); fetchLabels(); fetchGroups(); }, [fetchContacts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/contacts', formData);
      toast.success('Contact created');
      setShowCreate(false);
      setFormData({ firstName: '', lastName: '', waId: '', email: '', phone: '', country: '' });
      fetchContacts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create contact');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContact) return;
    try {
      await api.put(`/contacts/${editContact.id}`, formData);
      toast.success('Contact updated');
      setEditContact(null);
      fetchContacts();
    } catch { toast.error('Failed to update contact'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success('Contact deleted');
      fetchContacts();
    } catch { toast.error('Failed to delete'); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} contacts?`)) return;
    try {
      await api.post('/contacts/bulk-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} contacts deleted`);
      setSelectedIds([]);
      fetchContacts();
    } catch { toast.error('Failed to delete'); }
  };

  const handleBlock = async (id: number) => {
    try { await api.post(`/contacts/${id}/block`); toast.success('Contact blocked'); fetchContacts(); }
    catch { toast.error('Failed'); }
  };

  const handleUnblock = async (id: number) => {
    try { await api.post(`/contacts/${id}/unblock`); toast.success('Contact unblocked'); fetchContacts(); }
    catch { toast.error('Failed'); }
  };

  const handleExport = async () => {
    try {
      const { data } = await api.get('/contacts/export/csv');
      const rows = (data.data || data) as Record<string, unknown>[];
      const csv = ['First Name,Last Name,WhatsApp ID,Email,Country,Created At',
        ...rows.map((r) => `${r.first_name},${r.last_name},${r.wa_id},${r.email || ''},${r.country || ''},${r.created_at}`)
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'contacts.csv'; a.click();
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/contacts/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const d = data.data || data;
      toast.success(`Imported: ${d.imported}, Skipped: ${d.skipped}`);
      setShowImport(false);
      fetchContacts();
    } catch { toast.error('Import failed'); }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/contacts/labels', labelForm);
      toast.success('Label created');
      setLabelForm({ title: '', color: '#10B981' });
      fetchLabels();
    } catch { toast.error('Failed'); }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/contact-groups', groupForm);
      toast.success('Group created');
      setGroupForm({ title: '', description: '' });
      fetchGroups();
    } catch { toast.error('Failed'); }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedIds(prev => prev.length === contacts.length ? [] : contacts.map(c => c.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Contacts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your WhatsApp contacts, groups, and labels</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-3 py-2 border dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300"><Upload size={16} /> Import</button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300"><Download size={16} /> Export</button>
          <button onClick={() => { setShowCreate(true); setFormData({ firstName: '', lastName: '', waId: '', email: '', phone: '', country: '' }); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Add Contact</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b dark:border-slate-700">
        {(['contacts', 'groups', 'labels'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 px-1 text-sm font-medium capitalize border-b-2 transition ${activeTab === tab ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab} {tab === 'contacts' ? `(${meta.total})` : tab === 'groups' ? `(${groups.length})` : `(${labels.length})`}</button>
        ))}
      </div>

      {activeTab === 'contacts' && (
        <>
          {/* Search & Bulk Actions */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search contacts by name, phone, email..." className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white" />
            </div>
            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <span className="text-sm text-gray-500">{selectedIds.length} selected</span>
                <button onClick={handleBulkDelete} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete Selected</button>
              </div>
            )}
          </div>

          {/* Contact Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            {loading ? (
              <div className="p-8 animate-pulse space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-slate-700 rounded" />)}</div>
            ) : contacts.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><Users size={48} className="mx-auto mb-4 opacity-50" /><p>No contacts found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
                      <th className="py-3 px-4 text-left"><input type="checkbox" checked={selectedIds.length === contacts.length} onChange={toggleAll} /></th>
                      <th className="py-3 px-4 text-left text-gray-500 font-medium">Name</th>
                      <th className="py-3 px-4 text-left text-gray-500 font-medium">WhatsApp ID</th>
                      <th className="py-3 px-4 text-left text-gray-500 font-medium">Email</th>
                      <th className="py-3 px-4 text-left text-gray-500 font-medium">Country</th>
                      <th className="py-3 px-4 text-left text-gray-500 font-medium">Status</th>
                      <th className="py-3 px-4 text-left text-gray-500 font-medium">Unread</th>
                      <th className="py-3 px-4 text-left text-gray-500 font-medium">Last Message</th>
                      <th className="py-3 px-4 text-right text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(c => (
                      <tr key={c.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750">
                        <td className="py-3 px-4"><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                        <td className="py-3 px-4 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xs font-bold">{(c.first_name?.[0] || '?').toUpperCase()}</div>
                            <div><div className="font-medium">{c.first_name} {c.last_name}</div></div>
                          </div>
                        </td>
                        <td className="py-3 px-4 dark:text-gray-300">{c.wa_id}</td>
                        <td className="py-3 px-4 dark:text-gray-300">{c.email || '-'}</td>
                        <td className="py-3 px-4 dark:text-gray-300">{c.country || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.status === 1 ? 'Active' : 'Blocked'}</span>
                        </td>
                        <td className="py-3 px-4">{c.unread_count > 0 && <span className="bg-emerald-500 text-white text-xs rounded-full px-2 py-0.5">{c.unread_count}</span>}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{c.last_message_at ? new Date(c.last_message_at).toLocaleString() : '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setViewContact(c)} className="p-1 text-gray-400 hover:text-blue-500" title="View"><Eye size={16} /></button>
                            <button onClick={() => { setEditContact(c); setFormData({ firstName: c.first_name, lastName: c.last_name || '', waId: c.wa_id, email: c.email || '', phone: c.phone || '', country: c.country || '' }); }} className="p-1 text-gray-400 hover:text-emerald-500" title="Edit"><Edit size={16} /></button>
                            {c.status === 1 ? <button onClick={() => handleBlock(c.id)} className="p-1 text-gray-400 hover:text-orange-500" title="Block"><Ban size={16} /></button> : <button onClick={() => handleUnblock(c.id)} className="p-1 text-gray-400 hover:text-green-500" title="Unblock"><CheckCircle size={16} /></button>}
                            <button onClick={() => handleDelete(c.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {meta.totalPages > 1 && (
              <div className="p-4 border-t dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm text-gray-500">{meta.total} total contacts</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-slate-600 dark:text-gray-300">Prev</button>
                  <span className="px-3 py-1 text-sm dark:text-gray-300">{page} / {meta.totalPages}</span>
                  <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page === meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-slate-600 dark:text-gray-300">Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowGroupModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"><Plus size={16} /> Create Group</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map(g => (
              <div key={g.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2"><UserPlus className="text-emerald-500" size={20} /><h3 className="font-semibold dark:text-white">{g.title}</h3></div>
                <p className="text-sm text-gray-500">{g.description || 'No description'}</p>
              </div>
            ))}
            {groups.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No contact groups yet</div>}
          </div>
        </div>
      )}

      {activeTab === 'labels' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowLabelModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"><Plus size={16} /> Create Label</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {labels.map(l => (
              <div key={l.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700 flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: l.text_color || '#10B981' }} />
                <span className="font-medium dark:text-white">{l.title}</span>
              </div>
            ))}
            {labels.length === 0 && <div className="col-span-4 text-center py-12 text-gray-400">No labels yet</div>}
          </div>
        </div>
      )}

      {/* Create Contact Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Add Contact</h3><button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label><input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label><input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Number *</label><input value={formData.waId} onChange={e => setFormData({...formData, waId: e.target.value})} required placeholder="919876543210" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label><input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Create Contact</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Edit Contact</h3><button onClick={() => setEditContact(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label><input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label><input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label><input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Update Contact</button>
                <button type="button" onClick={() => setEditContact(null)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Contact Modal */}
      {viewContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Contact Details</h3><button onClick={() => setViewContact(null)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-2xl font-bold">{(viewContact.first_name?.[0] || '?').toUpperCase()}</div>
                <div><h4 className="text-xl font-bold dark:text-white">{viewContact.first_name} {viewContact.last_name}</h4><p className="text-sm text-gray-500">{viewContact.wa_id}</p></div>
              </div>
              {[['Email', viewContact.email], ['Phone', viewContact.phone], ['Country', viewContact.country], ['Status', viewContact.status === 1 ? 'Active' : 'Blocked'], ['Created', new Date(viewContact.created_at).toLocaleString()]].map(([label, val]) => (
                <div key={label as string} className="flex justify-between py-2 border-b dark:border-slate-700"><span className="text-sm text-gray-500">{label}</span><span className="text-sm font-medium dark:text-white">{(val as string) || '-'}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Import Contacts</h3><button onClick={() => setShowImport(false)}><X size={20} className="text-gray-400" /></button></div>
            <p className="text-sm text-gray-500 mb-4">Upload a CSV file with columns: firstName, lastName, waId, email</p>
            <input type="file" accept=".csv,.xlsx" onChange={handleImport} className="w-full text-sm" />
          </div>
        </div>
      )}

      {/* Label Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Create Label</h3><button onClick={() => setShowLabelModal(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreateLabel} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Label Name</label><input value={labelForm.title} onChange={e => setLabelForm({...labelForm, title: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Color</label><input type="color" value={labelForm.color} onChange={e => setLabelForm({...labelForm, color: e.target.value})} className="w-full h-10 rounded-lg" /></div>
              <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Create Label</button>
            </form>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Create Group</h3><button onClick={() => setShowGroupModal(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Group Name</label><input value={groupForm.title} onChange={e => setGroupForm({...groupForm, title: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Description</label><textarea value={groupForm.description} onChange={e => setGroupForm({...groupForm, description: e.target.value})} rows={3} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Create Group</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
