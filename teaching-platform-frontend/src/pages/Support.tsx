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
    try { const data = await supportAPI.listTickets(); setTickets(data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadTicket = async (id: number) => {
    try { const data = await supportAPI.getTicket(id); setSelectedTicket(data); }
    catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supportAPI.createTicket(form);
      setShowCreate(false);
      setForm({ subject: '', description: '', category: 'general', priority: 'medium' });
      loadTickets();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await supportAPI.replyTicket(selectedTicket.id, replyText);
      setReplyText('');
      loadTicket(selectedTicket.id);
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
    finally { setSending(false); }
  };

  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 mb-6 text-sm font-medium transition">
            <ArrowLeft size={16} /> Back to Tickets
          </button>
          <div className="glass rounded-2xl p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">#{selectedTicket.id} {selectedTicket.subject}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedTicket.user_name} ({selectedTicket.user_role}) &middot; {selectedTicket.category} &middot;{' '}
                  <span className={`font-medium ${selectedTicket.priority === 'urgent' ? 'text-red-400' : selectedTicket.priority === 'high' ? 'text-orange-400' : 'text-slate-400'}`}>
                    {selectedTicket.priority} priority
                  </span>
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedTicket.status === 'open' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                selectedTicket.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                selectedTicket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-white/5 text-slate-400 border border-white/10'
              }`}>{selectedTicket.status}</span>
            </div>
            <p className="text-slate-300 bg-white/5 p-4 rounded-xl text-sm leading-relaxed border border-white/5">{selectedTicket.description}</p>
            <p className="text-xs text-slate-600 mt-2">{new Date(selectedTicket.created_at).toLocaleString()}</p>
          </div>

          <div className="space-y-3 mb-4">
            {selectedTicket.replies?.map((r: any) => (
              <div key={r.id} className={`p-4 rounded-xl border ${r.user_role === 'admin' ? 'bg-emerald-500/5 ml-8 border-emerald-500/20' : 'glass mr-8 border-white/10'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-white">{r.user_name}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${r.user_role === 'admin' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'}`}>{r.user_role}</span>
                  </span>
                  <span className="text-xs text-slate-600">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 text-sm">{r.message}</p>
              </div>
            ))}
          </div>

          {selectedTicket.status !== 'closed' && (
            <div className="glass rounded-xl p-4">
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none text-sm text-white placeholder-slate-500" rows={3} placeholder="Type your reply..." />
              <div className="flex justify-end mt-2">
                <button onClick={handleReply} disabled={sending || !replyText.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition flex items-center gap-2 disabled:opacity-50 text-sm shadow-lg shadow-emerald-500/20">
                  <Send size={14} /> {sending ? 'Sending...' : 'Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Ticket size={22} className="text-emerald-400" /> Support Tickets</h1>
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2 text-sm shadow-lg shadow-emerald-500/25 hover:scale-105 transform">
            <Plus size={16} /> New Ticket
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl">
            <MessageSquare size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-white">No tickets yet</h3>
            <p className="text-slate-500 mt-1 text-sm">Create a ticket if you need help</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <button key={t.id} onClick={() => loadTicket(t.id)}
                className="w-full text-left card-3d glass rounded-xl p-5 hover:bg-white/10 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">#{t.id} {t.subject}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                        t.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-white/5 text-slate-400'
                      }`}>{t.priority}</span>
                    </div>
                    <p className="text-sm text-slate-500">{t.category} &middot; {t.reply_count} replies &middot; {new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold self-start ${
                    t.status === 'open' ? 'bg-cyan-500/10 text-cyan-400' :
                    t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                    t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-white/5 text-slate-400'
                  }`}>{t.status}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-dark rounded-2xl shadow-2xl w-full max-w-lg border border-white/10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create Support Ticket</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/5 rounded-xl transition text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject</label>
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white placeholder-slate-500" placeholder="Brief description of the issue" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white">
                      <option value="general">General</option><option value="payment">Payment</option><option value="class">Class</option><option value="technical">Technical</option><option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none text-sm text-white placeholder-slate-500" rows={4} placeholder="Describe your issue in detail..." />
                </div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all text-sm shadow-lg shadow-emerald-500/25 hover:scale-105 transform">
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
