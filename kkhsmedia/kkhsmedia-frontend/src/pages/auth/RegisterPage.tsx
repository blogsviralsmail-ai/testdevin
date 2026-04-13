import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return setError('Please agree to the terms.');
    setError('');
    setLoading(true);
    try {
      await authAPI.register(form);
      navigate('/verify-email?email=' + encodeURIComponent(form.email));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center surface-base px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
          <span className="text-sm font-semibold text-primary">GoLivePro</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-primary mb-1.5">Create an account</h1>
          <p className="text-sm text-tertiary">Get started with GoLivePro</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 px-3 py-2.5 rounded-lg text-xs font-medium text-red-400"
            style={{ background: 'rgb(239 68 68 / 0.1)', border: '1px solid rgb(239 68 68 / 0.2)' }}
          >{error}</motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">First name</label>
              <input type="text" required value={form.firstName} onChange={e => set('firstName', e.target.value)}
                placeholder="John" className="input-premium" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Last name</label>
              <input type="text" required value={form.lastName} onChange={e => set('lastName', e.target.value)}
                placeholder="Doe" className="input-premium" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Email</label>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="you@example.com" className="input-premium" />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Min 8 characters" className="input-premium pr-9" />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-gray-600 bg-transparent" />
            <span className="text-xs text-tertiary leading-relaxed">
              I agree to the <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>{' '}
              & <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
            </span>
          </label>
          <button type="submit" disabled={loading || !agreed}
            className="w-full btn-premium btn-premium-primary py-2.5 text-sm disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-tertiary">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
