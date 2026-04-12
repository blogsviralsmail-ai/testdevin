import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

export default function ForgotPasswordPage() {
  const { settings } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const primary = settings?.primaryColor || '#6366f1';
  const brandName = settings?.brandName || 'KKHS Media';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch { setError('Failed to send reset link.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primary }}>{brandName.charAt(0)}</div>
          <span className="font-bold text-xl">{brandName}</span>
        </Link>
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold mb-2 text-center">Forgot Password</h1>
          <p className="text-gray-600 mb-6 text-center text-sm">Enter your email and we'll send you a reset link.</p>
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl" style={{ backgroundColor: primary + '15', color: primary }}>✓</div>
              <p className="text-gray-600 mb-4">Reset link sent! Check your email.</p>
              <Link to="/login" className="font-medium" style={{ color: primary }}>Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2" />
              <button type="submit" disabled={loading || !email} className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50" style={{ backgroundColor: primary }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-gray-600">
                Remember your password? <Link to="/login" className="font-medium" style={{ color: primary }}>Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
