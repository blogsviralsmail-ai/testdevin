import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.data?.requiresOtp) {
        setShowOtp(true);
        setOtpUserId(data.data.userId);
        toast.success('OTP sent to your email');
      } else {
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
        toast.success('Login successful');
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { userId: otpUserId, otpCode });
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch {
      toast.error('Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-600">WabaPanel</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">WhatsApp Business API Platform</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 dark:text-white">
            {showOtp ? 'Verify OTP' : 'Sign In'}
          </h2>

          {!showOtp ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input type="checkbox" className="rounded border-gray-300" /> Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-emerald-600 hover:underline">Forgot password?</Link>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Enter the 6-digit code sent to your email</p>
              <input
                type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required maxLength={6}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
