import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Radio } from 'lucide-react';

export default function LoginPage() {
  const { login, settings } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const primary = settings?.primaryColor || '#6366f1';
  const brandName = settings?.brandName || 'KKHS Media';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login failed';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%)` }}>
        <div className="text-white text-center max-w-md">
          <Radio size={64} className="mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Stream Live 24/7</h2>
          <p className="text-lg opacity-80">Upload your video, enter stream key, and go live on YouTube, Facebook, Twitch & more.</p>
          <div className="mt-8 flex justify-center gap-4">
            {['1. Upload', '2. Configure', '3. Go Live!'].map((step, i) => (
              <div key={i} className="bg-white/20 px-4 py-2 rounded-lg text-sm font-medium">{step}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primary }}>
              {brandName.charAt(0)}
            </div>
            <span className="font-bold text-xl">{brandName}</span>
          </Link>

          <h1 className="text-2xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-gray-600 mb-8">Sign in to your account to continue streaming.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent pr-12"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm" style={{ color: primary }}>Forgot Password?</Link>
            </div>
            <button
              type="submit" disabled={loading || !email || !password}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: primary }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            New here? <Link to="/register" className="font-medium" style={{ color: primary }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
