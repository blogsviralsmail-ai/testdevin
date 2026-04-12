import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { MessageSquare, Trash2, RefreshCw, Mail } from 'lucide-react';

interface ContactItem {
  id: string; name: string; email: string; message: string; createdAt: string; status?: string;
}

export default function AdminContacts() {
  const { settings } = useAuth();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const primary = settings?.primaryColor || '#6366f1';

  const loadContacts = async () => {
    setLoading(true);
    try { const res = await adminAPI.getContacts(); setContacts(res.data.contacts || res.data); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadContacts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try { await adminAPI.deleteContact(id); loadContacts(); } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contact Messages ({contacts.length})</h1>
        <button onClick={loadContacts} className="px-3 py-2 rounded-lg border hover:bg-gray-50"><RefreshCw size={18} /></button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map(contact => (
            <div key={contact.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: primary }}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{contact.name}</h3>
                    <a href={`mailto:${contact.email}`} className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail size={12} /> {contact.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{new Date(contact.createdAt).toLocaleDateString()}</span>
                  <button onClick={() => handleDelete(contact.id)} className="p-1.5 rounded hover:bg-red-50">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{contact.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
