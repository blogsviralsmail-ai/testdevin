import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to send reset email';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center surface-base px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
          <span className="text-sm font-semibold text-primary">GoLivePro</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgb(var(--accent) / 0.1)' }}>
              <Mail size={22} className="text-indigo-400" />
            </div>
            <h1 className="text-xl font-semibold text-primary mb-2">Check your email</h1>
            <p className="text-sm text-tertiary mb-6">We sent a reset link to <span className="font-medium text-secondary">{email}</span></p>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-medium text-tertiary hover:text-primary transition-colors">
              <ArrowLeft size={13} /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-xl font-semibold text-primary mb-1.5">Reset password</h1>
              <p className="text-sm text-tertiary">Enter your email to receive a reset link</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
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
              <button type="submit" disabled={loading || !email}
                className="w-full btn-premium btn-premium-primary py-2.5 text-sm disabled:opacity-50">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <p className="mt-6 text-center text-xs text-tertiary">
              <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
