import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { CreditCard, Package, Check } from 'lucide-react';

interface Plan { id: number; name: string; price: number; billing_type: string; message_limit: number; contact_limit: number; status: number; features: string; }

export default function SubscriptionPage() {
  const user = useAuthStore((s) => s.user);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, currentRes] = await Promise.all([
          api.get('/subscriptions/plans'),
          api.get('/subscriptions/current').catch(() => null),
        ]);
        const pd = plansRes.data?.data || plansRes.data;
        setPlans(pd.items || pd || []);
        if (currentRes) setCurrentPlan(currentRes.data?.data || currentRes.data);
      } catch (err) {
        console.error('Failed to load subscription', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-48" /><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-64 bg-gray-200 dark:bg-slate-700 rounded-xl" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Subscription Plans</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose a plan that fits your business</p>
      </div>

      {currentPlan && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CreditCard className="text-emerald-600" size={20} />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">Current Plan: {(currentPlan.plan_name as string) || 'Free'}</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-300">Expires: {currentPlan.expires_at ? new Date(currentPlan.expires_at as string).toLocaleDateString() : 'Never'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          let featureList: string[] = [];
          try { featureList = JSON.parse(plan.features || '[]'); } catch { featureList = []; }
          return (
            <div key={plan.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <Package className="text-emerald-500" size={24} />
                <h3 className="text-lg font-semibold dark:text-white">{plan.name}</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold dark:text-white">${plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400">/{plan.billing_type || 'month'}</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Check size={16} className="text-emerald-500" /> {plan.message_limit?.toLocaleString() || 'Unlimited'} messages
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Check size={16} className="text-emerald-500" /> {plan.contact_limit?.toLocaleString() || 'Unlimited'} contacts
                </li>
                {featureList.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Check size={16} className="text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition">
                Subscribe
              </button>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>No subscription plans configured yet.</p>
        </div>
      )}
    </div>
  );
}
