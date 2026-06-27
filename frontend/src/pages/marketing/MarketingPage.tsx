import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Megaphone, Plus, Edit, Trash2, X, Clock, Gift, MessageCircle, BarChart3 } from 'lucide-react';

interface DripCampaign { id: number; name: string; steps: string; status: number; created_at: string; }
interface AutoFollowup { id: number; name: string; trigger_after_hours: number; message: string; status: number; }
interface BirthdayWish { id: number; name: string; message: string; status: number; }
interface FeedbackSurvey { id: number; name: string; questions: string; status: number; }

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'drip' | 'followup' | 'birthday' | 'survey'>('drip');
  const [drips, setDrips] = useState<DripCampaign[]>([]);
  const [followups, setFollowups] = useState<AutoFollowup[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayWish[]>([]);
  const [surveys, setSurveys] = useState<FeedbackSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | number>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = ['/marketing/drip-campaigns', '/marketing/auto-followups', '/marketing/birthday-wishes', '/marketing/feedback-surveys'];
      const results = await Promise.allSettled(endpoints.map(ep => api.get(ep)));
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const d = r.value.data.data || r.value.data;
          const items = d.items || d.data || d || [];
          if (i === 0) setDrips(items);
          if (i === 1) setFollowups(items);
          if (i === 2) setBirthdays(items);
          if (i === 3) setSurveys(items);
        }
      });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const epMap: Record<string, string> = { drip: '/marketing/drip-campaigns', followup: '/marketing/auto-followups', birthday: '/marketing/birthday-wishes', survey: '/marketing/feedback-surveys' };
      await api.post(epMap[activeTab], formData);
      toast.success('Created'); setShowCreate(false); fetchAll();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('Delete?')) return;
    try {
      const epMap: Record<string, string> = { drip: '/marketing/drip-campaigns', followup: '/marketing/auto-followups', birthday: '/marketing/birthday-wishes', survey: '/marketing/feedback-surveys' };
      await api.delete(`${epMap[type]}/${id}`);
      toast.success('Deleted'); fetchAll();
    } catch { toast.error('Failed'); }
  };

  const tabs = [
    { key: 'drip' as const, label: 'Drip Campaigns', icon: Clock, count: drips.length },
    { key: 'followup' as const, label: 'Auto Follow-up', icon: MessageCircle, count: followups.length },
    { key: 'birthday' as const, label: 'Birthday Wishes', icon: Gift, count: birthdays.length },
    { key: 'survey' as const, label: 'Feedback/Survey', icon: BarChart3, count: surveys.length },
  ];

  const openCreate = () => {
    setShowCreate(true);
    if (activeTab === 'drip') setFormData({ name: '', steps: '[]' });
    if (activeTab === 'followup') setFormData({ name: '', triggerAfterHours: 24, message: '' });
    if (activeTab === 'birthday') setFormData({ name: '', message: '' });
    if (activeTab === 'survey') setFormData({ name: '', questions: '[]' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Marketing Tools</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Drip campaigns, auto follow-ups, birthday wishes & surveys</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Create</button>
      </div>

      <div className="flex gap-4 border-b dark:border-slate-700">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === tab.key ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><tab.icon size={16} />{tab.label} ({tab.count})</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'drip' && (drips.length === 0 ? <EmptyState label="drip campaigns" /> : drips.map(d => (
            <Card key={d.id} title={d.name} status={d.status} subtitle={`${(() => { try { return JSON.parse(d.steps || '[]').length; } catch { return 0; } })()} steps`} date={d.created_at} onDelete={() => handleDelete('drip', d.id)} />
          )))}
          {activeTab === 'followup' && (followups.length === 0 ? <EmptyState label="auto follow-ups" /> : followups.map(f => (
            <Card key={f.id} title={f.name} status={f.status} subtitle={`After ${f.trigger_after_hours}h: ${f.message?.substring(0, 80)}`} onDelete={() => handleDelete('followup', f.id)} />
          )))}
          {activeTab === 'birthday' && (birthdays.length === 0 ? <EmptyState label="birthday wishes" /> : birthdays.map(b => (
            <Card key={b.id} title={b.name} status={b.status} subtitle={b.message?.substring(0, 100)} onDelete={() => handleDelete('birthday', b.id)} />
          )))}
          {activeTab === 'survey' && (surveys.length === 0 ? <EmptyState label="surveys" /> : surveys.map(s => (
            <Card key={s.id} title={s.name} status={s.status} subtitle={`${(() => { try { return JSON.parse(s.questions || '[]').length; } catch { return 0; } })()} questions`} onDelete={() => handleDelete('survey', s.id)} />
          )))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Create {activeTab === 'drip' ? 'Drip Campaign' : activeTab === 'followup' ? 'Auto Follow-up' : activeTab === 'birthday' ? 'Birthday Wish' : 'Survey'}</h3><button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Name *</label><input value={(formData.name as string) || ''} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              {activeTab === 'followup' && <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Trigger After (hours)</label><input type="number" value={formData.triggerAfterHours as number} onChange={e => setFormData({...formData, triggerAfterHours: parseInt(e.target.value)})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>}
              {(activeTab === 'followup' || activeTab === 'birthday') && <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Message *</label><textarea value={(formData.message as string) || ''} onChange={e => setFormData({...formData, message: e.target.value})} required rows={4} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>}
              {activeTab === 'drip' && <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Steps (JSON)</label><textarea value={(formData.steps as string) || '[]'} onChange={e => setFormData({...formData, steps: e.target.value})} rows={4} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white font-mono" placeholder='[{"delay_hours":24,"message":"Follow up"}]' /></div>}
              {activeTab === 'survey' && <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Questions (JSON)</label><textarea value={(formData.questions as string) || '[]'} onChange={e => setFormData({...formData, questions: e.target.value})} rows={4} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white font-mono" placeholder='[{"question":"Rate us 1-5"}]' /></div>}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><Megaphone size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No {label} yet</p></div>;
}

function Card({ title, status, subtitle, date, onDelete }: { title: string; status: number; subtitle?: string; date?: string; onDelete: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border dark:border-slate-700 flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2"><h3 className="font-semibold dark:text-white">{title}</h3><span className={`px-2 py-0.5 rounded-full text-xs ${status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{status === 1 ? 'Active' : 'Inactive'}</span></div>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        {date && <p className="text-xs text-gray-400 mt-1">{new Date(date).toLocaleDateString()}</p>}
      </div>
      <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
    </div>
  );
}
