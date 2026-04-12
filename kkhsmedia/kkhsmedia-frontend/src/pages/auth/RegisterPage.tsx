import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Eye, EyeOff, Radio } from 'lucide-react';

export default function RegisterPage() {
  const { settings } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const primary = settings?.primaryColor || '#6366f1';
  const brandName = settings?.brandName || 'KKHS Media';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      // Navigate to verify email page
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}&dev_otp=${res.data.otp_dev || ''}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%)` }}>
        <div className="text-white text-center max-w-md">
          <Radio size={64} className="mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Join {brandName} Today!</h2>
          <p className="text-lg opacity-80">Start your 24/7 live streaming journey. Connect to multiple platforms instantly!</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primary }}>{brandName.charAt(0)}</div>
            <span className="font-bold text-xl">{brandName}</span>
          </Link>

          <h1 className="text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-600 mb-8">Fill in your details to get started.</p>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
                  placeholder="John" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
                  placeholder="Doe" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="john@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="Min 8 characters" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 pr-12" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />
              <span className="text-sm text-gray-600">I agree to the <Link to="/privacy-policy" className="underline" style={{ color: primary }}>Privacy Policy</Link> & <Link to="/terms-of-service" className="underline" style={{ color: primary }}>Terms of Service</Link></span>
            </label>
            <button type="submit" disabled={loading || !agreed || !form.email || !form.password}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50" style={{ backgroundColor: primary }}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="font-medium" style={{ color: primary }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
