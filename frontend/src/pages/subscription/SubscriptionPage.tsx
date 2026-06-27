import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Check, Star, Zap, Crown, Plus, X, Edit, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Plan { id: number; name: string; price: number; billing_cycle: string; features: string; max_contacts: number; max_messages: number; status: number; }
interface CurrentSub { id: number; plan_name: string; price: number; status: string; expiry_at: string; }

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 1;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<CurrentSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', billingCycle: 'monthly', features: '', maxContacts: '', maxMessages: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/subscriptions/plans');
        const d = data.data || data;
        setPlans(d.items || d.data || d || []);
        if (!isAdmin) {
          try { const { data: sub } = await api.get('/subscriptions/current'); setCurrentSub(sub.data || sub); } catch { /* no sub */ }
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, price: parseFloat(formData.price), maxContacts: parseInt(formData.maxContacts || '0'), maxMessages: parseInt(formData.maxMessages || '0') };
      if (editPlan) { await api.put(`/subscriptions/plans/${editPlan.id}`, payload); toast.success('Updated'); }
      else { await api.post('/subscriptions/plans', payload); toast.success('Created'); }
      setShowCreate(false); setEditPlan(null); setFormData({ name: '', price: '', billingCycle: 'monthly', features: '', maxContacts: '', maxMessages: '' });
      const { data } = await api.get('/subscriptions/plans'); const d = data.data || data; setPlans(d.items || d.data || d || []);
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete plan?')) return;
    try { await api.delete(`/subscriptions/plans/${id}`); toast.success('Deleted'); const { data } = await api.get('/subscriptions/plans'); const d = data.data || data; setPlans(d.items || d.data || d || []); }
    catch { toast.error('Failed'); }
  };

  const handleSubscribe = async (planId: number) => {
    try { await api.post('/subscriptions/subscribe', { planId }); toast.success('Subscribed!'); const { data: sub } = await api.get('/subscriptions/current'); setCurrentSub(sub.data || sub); }
    catch { toast.error('Failed to subscribe'); }
  };

  const planIcons = [Star, Zap, Crown, CreditCard];
  const planColors = ['from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600', 'from-purple-500 to-purple-600', 'from-orange-500 to-orange-600'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Subscription</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{isAdmin ? 'Manage subscription plans' : 'Choose your plan'}</p></div>
        {isAdmin && <button onClick={() => { setShowCreate(true); setEditPlan(null); setFormData({ name: '', price: '', billingCycle: 'monthly', features: '', maxContacts: '', maxMessages: '' }); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> New Plan</button>}
      </div>

      {/* Current Subscription (Vendor) */}
      {!isAdmin && currentSub && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80">Current Plan</p>
          <h2 className="text-2xl font-bold mt-1">{currentSub.plan_name}</h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-lg font-semibold">INR {currentSub.price}/mo</span>
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{currentSub.status}</span>
            {currentSub.expiry_at && <span className="text-sm opacity-80">Expires: {new Date(currentSub.expiry_at).toLocaleDateString()}</span>}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-72 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan, idx) => {
            const Icon = planIcons[idx % planIcons.length];
            const color = planColors[idx % planColors.length];
            const features = (() => { try { return JSON.parse(plan.features || '[]'); } catch { return plan.features ? plan.features.split(',') : []; } })();
            return (
              <div key={plan.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
                <div className={`bg-gradient-to-r ${color} p-6 text-white`}>
                  <Icon size={32} className="mb-2" />
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-3xl font-bold mt-2">INR {plan.price}<span className="text-sm font-normal opacity-80">/{plan.billing_cycle || 'month'}</span></p>
                </div>
                <div className="p-6">
                  <ul className="space-y-2 mb-6">
                    {plan.max_contacts > 0 && <li className="flex items-center gap-2 text-sm dark:text-gray-300"><Check size={16} className="text-emerald-500" /> Up to {plan.max_contacts} contacts</li>}
                    {plan.max_messages > 0 && <li className="flex items-center gap-2 text-sm dark:text-gray-300"><Check size={16} className="text-emerald-500" /> {plan.max_messages} messages/month</li>}
                    {(Array.isArray(features) ? features : []).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm dark:text-gray-300"><Check size={16} className="text-emerald-500" /> {f}</li>
                    ))}
                  </ul>
                  {isAdmin ? (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditPlan(plan); setShowCreate(true); setFormData({ name: plan.name, price: String(plan.price), billingCycle: plan.billing_cycle || 'monthly', features: plan.features || '', maxContacts: String(plan.max_contacts || ''), maxMessages: String(plan.max_messages || '') }); }} className="flex-1 py-2 border dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"><Edit size={14} className="inline mr-1" /> Edit</button>
                      <button onClick={() => handleDelete(plan.id)} className="py-2 px-3 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => handleSubscribe(plan.id)} className={`w-full py-2 bg-gradient-to-r ${color} text-white rounded-lg text-sm font-medium hover:opacity-90`}>{currentSub?.plan_name === plan.name ? 'Current Plan' : 'Subscribe'}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">{editPlan ? 'Edit' : 'Create'} Plan</h3><button onClick={() => { setShowCreate(false); setEditPlan(null); }}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Plan Name *</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Price *</label><input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Billing Cycle</label>
                  <select value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Max Contacts</label><input type="number" value={formData.maxContacts} onChange={e => setFormData({...formData, maxContacts: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Max Messages</label><input type="number" value={formData.maxMessages} onChange={e => setFormData({...formData, maxMessages: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Features (one per line)</label><textarea value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} rows={4} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" placeholder="Unlimited messages&#10;Priority support&#10;API access" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">{editPlan ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowCreate(false); setEditPlan(null); }} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
