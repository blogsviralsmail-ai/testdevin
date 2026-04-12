import { useState, useEffect } from 'react';
import { affiliatesAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ReferralsPage() {
  const [referral, setReferral] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [refRes, earnRes, refsRes] = await Promise.all([
        affiliatesAPI.getMyReferral(),
        affiliatesAPI.getMyEarnings(),
        affiliatesAPI.getMyReferrals(),
      ]);
      setReferral(refRes.data);
      setEarnings(earnRes.data?.earnings || []);
      setReferrals(refsRes.data?.referrals || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const copyCode = () => {
    if (referral?.referralCode) {
      navigator.clipboard.writeText(referral.referralCode);
      toast.success('Referral code copied!');
    }
  };

  const copyLink = () => {
    if (referral?.referralCode) {
      const link = `${window.location.origin}/register?ref=${referral.referralCode}`;
      navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">Your Referral Code</h2>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-3xl font-bold tracking-wider">{referral?.referralCode || 'N/A'}</span>
          <button onClick={copyCode} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm">Copy Code</button>
          <button onClick={copyLink} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm">Copy Link</button>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-sm opacity-75">Total Referrals</p>
            <p className="text-2xl font-bold">{referral?.totalReferrals || 0}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-sm opacity-75">Total Earned</p>
            <p className="text-2xl font-bold">₹{referral?.totalEarned || 0}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-sm opacity-75">Commission Rate</p>
            <p className="text-2xl font-bold">{referral?.commissionRate || 10}%</p>
          </div>
        </div>
      </div>

      {/* Referred Users */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b"><h2 className="text-lg font-semibold">Your Referrals</h2></div>
        {referrals.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No referrals yet. Share your code to earn!</div>
        ) : (
          <div className="divide-y">
            {referrals.map((ref: any, i: number) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{ref.name || ref.email}</p>
                  <p className="text-xs text-gray-500">Joined: {new Date(ref.joinedAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${ref.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {ref.status || 'active'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earnings */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b"><h2 className="text-lg font-semibold">Earnings History</h2></div>
        {earnings.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No earnings yet</div>
        ) : (
          <div className="divide-y">
            {earnings.map((earn: any, i: number) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">₹{earn.amount} commission</p>
                  <p className="text-xs text-gray-500">From: {earn.referredUserName || 'User'} | Order: ₹{earn.orderAmount}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${earn.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {earn.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
