import { useState, useEffect } from 'react';
import { supportAPI } from '../services/api';
import { Ticket, Plus, X, Send, MessageSquare, ArrowLeft } from 'lucide-react';

export default function Support() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'general', priority: 'medium' });

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await supportAPI.listTickets();
      setTickets(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadTicket = async (id: number) => {
    try {
      const data = await supportAPI.getTicket(id);
      setSelectedTicket(data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supportAPI.createTicket(form);
      setShowCreate(false);
      setForm({ subject: '', description: '', category: 'general', priority: 'medium' });
      loadTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await supportAPI.replyTicket(selectedTicket.id, replyText);
      setReplyText('');
      loadTicket(selectedTicket.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally { setSending(false); }
  };

  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 mb-4 font-medium">
            <ArrowLeft size={18} /> Back to Tickets
          </button>
          <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">#{selectedTicket.id} {selectedTicket.subject}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedTicket.user_name} ({selectedTicket.user_role}) | {selectedTicket.category} |{' '}
                  <span className={`font-medium ${
                    selectedTicket.priority === 'urgent' ? 'text-red-600' :
                    selectedTicket.priority === 'high' ? 'text-orange-600' : 'text-gray-600'
                  }`}>{selectedTicket.priority} priority</span>
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedTicket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                selectedTicket.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>{selectedTicket.status}</span>
            </div>
            <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">{selectedTicket.description}</p>
            <p className="text-xs text-gray-400 mt-2">{new Date(selectedTicket.created_at).toLocaleString()}</p>
          </div>

          {/* Replies */}
          <div className="space-y-3 mb-4">
            {selectedTicket.replies?.map((r: any) => (
              <div key={r.id} className={`p-4 rounded-xl ${r.user_role === 'admin' ? 'bg-indigo-50 ml-8' : 'bg-white shadow-sm mr-8'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-700">{r.user_name}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${r.user_role === 'admin' ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                      {r.user_role}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-600 text-sm">{r.message}</p>
              </div>
            ))}
          </div>

          {/* Reply box */}
          {selectedTicket.status !== 'closed' && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                rows={3}
                placeholder="Type your reply..."
              />
              <div className="flex justify-end mt-2">
                <button onClick={handleReply} disabled={sending || !replyText.trim()}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50">
                  <Send size={16} /> {sending ? 'Sending...' : 'Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Ticket size={24} /> Support Tickets</h1>
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition flex items-center gap-2">
            <Plus size={18} /> New Ticket
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-600">No tickets yet</h3>
            <p className="text-gray-400 mt-1">Create a ticket if you need help</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <button key={t.id} onClick={() => loadTicket(t.id)}
                className="w-full text-left bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800">#{t.id} {t.subject}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{t.priority}</span>
                    </div>
                    <p className="text-sm text-gray-500">{t.category} | {t.reply_count} replies | {new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium self-start ${
                    t.status === 'open' ? 'bg-blue-100 text-blue-700' :
                    t.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                    t.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{t.status}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Create Support Ticket</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Brief description of the issue" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white">
                      <option value="general">General</option>
                      <option value="payment">Payment</option>
                      <option value="class">Class</option>
                      <option value="technical">Technical</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" rows={4} placeholder="Describe your issue in detail..." />
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">
                  Submit Ticket
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
