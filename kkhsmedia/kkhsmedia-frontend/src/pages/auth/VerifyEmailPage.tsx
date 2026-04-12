import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

export default function VerifyEmailPage() {
  const { settings } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const emailParam = params.get('email') || '';
  const devOtp = params.get('dev_otp') || '';
  const [otp, setOtp] = useState(devOtp);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const primary = settings?.primaryColor || '#6366f1';
  const brandName = settings?.brandName || 'KKHS Media';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.verifyEmail({ email: emailParam, otp });
      navigate('/login?verified=true');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Verification failed');
    }
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
          <h1 className="text-2xl font-bold mb-2 text-center">Verify Your Email</h1>
          <p className="text-gray-600 mb-6 text-center text-sm">Enter the OTP sent to <strong>{emailParam}</strong></p>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl tracking-widest focus:outline-none focus:ring-2" maxLength={6} />
            <button type="submit" disabled={loading || otp.length < 4} className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50" style={{ backgroundColor: primary }}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
