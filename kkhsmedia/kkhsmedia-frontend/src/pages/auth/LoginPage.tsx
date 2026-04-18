import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const savedUser = localStorage.getItem('user');
      const role = savedUser ? JSON.parse(savedUser).role : 'user';
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Invalid credentials';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center surface-base px-4">
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
          <h1 className="text-xl font-semibold text-primary mb-1.5">Welcome back</h1>
          <p className="text-sm text-tertiary">Sign in to your account</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 px-3 py-2.5 rounded-lg text-xs font-medium text-red-400"
            style={{ background: 'rgb(239 68 68 / 0.1)', border: '1px solid rgb(239 68 68 / 0.2)' }}
          >{error}</motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className="input-premium" />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" className="input-premium pr-9" />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="mt-1.5 text-right">
              <Link to="/forgot-password" className="text-xs text-tertiary hover:text-primary transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full btn-premium btn-premium-primary py-2.5 text-sm disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-tertiary">
          Don\u2019t have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
