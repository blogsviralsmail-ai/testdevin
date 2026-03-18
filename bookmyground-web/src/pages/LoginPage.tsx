import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { Phone, ArrowRight, Shield, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string })?.from || null;
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'otp'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [signupRole, setSignupRole] = useState<'user' | 'owner'>('user');

  const handleLogin = async () => {
    if (!identifier || !password) { setError('Enter phone/email and password'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.loginWithPassword(identifier, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      const savedRedirect = redirectTo || localStorage.getItem('redirectAfterLogin');
      localStorage.removeItem('redirectAfterLogin');
      if (savedRedirect) navigate(savedRedirect);
      else if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'owner') navigate('/owner');
      else navigate('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
      // Fallback to OTP login
      try {
        const ph = identifier.replace(/\D/g, '');
        if (ph.length === 10) {
          await api.sendOTP(ph);
          setPhone(ph); setMode('otp'); setError(''); setSuccess('OTP sent to +91 ' + ph);
        }
      } catch { /* ignore */ }
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!name || !phone || !password) { setError('Name, phone and password are required'); return; }
    if (password !== confirmPass) { setError('Passwords do not match'); return; }
    if (phone.length !== 10) { setError('Enter valid 10-digit phone number'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.signup({ name, phone, email: email || undefined, password, referral_code: referralCode || undefined, role: signupRole });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (redirectTo) navigate(redirectTo);
      else if (res.user.role === 'owner') navigate('/owner');
      else navigate('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Signup failed');
      // Fallback: try OTP signup
      try {
        await api.sendOTP(phone);
        setMode('otp'); setError(''); setSuccess('OTP sent for verification');
      } catch { /* ignore */ }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!identifier) { setError('Enter phone number or email'); return; }
    setLoading(true); setError('');
    try {
      await api.forgotPassword(identifier);
      setSuccess('OTP sent! Check your phone/email');
      setMode('otp');
    } catch {
      // Fallback: try sending OTP directly
      try {
        const ph = identifier.replace(/\D/g, '');
        if (ph.length === 10) { await api.sendOTP(ph); setPhone(ph); setMode('otp'); setSuccess('OTP sent to +91 ' + ph); }
        else { setError('Enter valid phone number or email'); }
      } catch { setError('Failed to send OTP'); }
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setLoading(true); setError('');
    try {
      if (newPass) {
        await api.resetPassword(phone || identifier, otp, newPass);
        setSuccess('Password reset! Please login');
        setMode('login'); setLoading(false); return;
      }
      const res = await api.verifyOTP(phone || identifier.replace(/\D/g, ''), otp, name || undefined);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'owner') navigate('/owner');
      else navigate('/');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Invalid OTP'); }
    setLoading(false);
  };

  const quickLogin = (ph: string) => {
    setIdentifier(ph); setPassword('password123'); setPhone(ph);
  };

  return (
    <div className="min-h-screen green-gradient flex items-center justify-center p-6" style={{perspective:'1200px'}}>
      <div className="w-full max-w-md">
        <div className="text-white text-center mb-8">
          <div className="text-6xl mb-3 float-3d" style={{animationDuration:'5s'}}>&#127951;</div>
          <h1 className="text-4xl font-bold">BookAGround</h1>
          <p className="text-green-100 mt-2 text-lg">Cricket Ground Booking Platform</p>
        </div>
        <div className="card-3d bg-white rounded-2xl shadow-2xl p-8">
          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}
          {success && <p className="text-green-600 text-sm mb-3 bg-green-50 p-2 rounded-lg">{success}</p>}

          {mode === 'login' && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back</h2>
              <p className="text-gray-500 mb-6">Login with phone/email & password</p>
              <div className="flex items-center border-2 rounded-xl px-4 py-3 mb-3 focus-within:border-green-500 transition">
                <Mail size={18} className="text-gray-400 mr-2" />
                <input type="text" placeholder="Phone number or Email" className="flex-1 outline-none text-base"
                  value={identifier} onChange={e => setIdentifier(e.target.value)} />
              </div>
              <div className="flex items-center border-2 rounded-xl px-4 py-3 mb-2 focus-within:border-green-500 transition">
                <Lock size={18} className="text-gray-400 mr-2" />
                <input type={showPass ? 'text' : 'password'} placeholder="Password" className="flex-1 outline-none text-base"
                  value={password} onChange={e => setPassword(e.target.value)} />
                <button onClick={() => setShowPass(!showPass)} className="text-gray-400">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
              <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} className="text-sm text-green-600 mb-4 hover:underline block text-right w-full">Forgot Password?</button>
              <button onClick={handleLogin} disabled={loading}
                className="btn-3d w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 transition">
                {loading ? 'Logging in...' : 'Login'} <ArrowRight size={18} />
              </button>
              <p className="text-center text-gray-500 mt-4 text-sm">
                Don't have an account? <button onClick={() => { setMode('signup'); setError(''); setSuccess(''); }} className="text-green-600 font-medium hover:underline">Sign Up</button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Create Account</h2>
              <p className="text-gray-500 mb-4">Join BookAGround today</p>
              {/* Role Selection */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setSignupRole('user')} className={`flex-1 py-2.5 rounded-xl font-medium text-sm border-2 transition ${signupRole === 'user' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}>
                  👤 Customer
                </button>
                <button onClick={() => setSignupRole('owner')} className={`flex-1 py-2.5 rounded-xl font-medium text-sm border-2 transition ${signupRole === 'owner' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
                  🏏 Ground Owner
                </button>
              </div>
              {signupRole === 'owner' && <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mb-3">After signup, go to Owner Dashboard to add your ground. Admin will approve it within 24 hours.</p>}
              <div className="space-y-3">
                <div className="flex items-center border-2 rounded-xl px-4 py-3 focus-within:border-green-500 transition">
                  <User size={18} className="text-gray-400 mr-2" />
                  <input type="text" placeholder="Full Name *" className="flex-1 outline-none" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="flex items-center border-2 rounded-xl px-4 py-3 focus-within:border-green-500 transition">
                  <Phone size={18} className="text-gray-400 mr-2" />
                  <span className="text-gray-500 mr-1">+91</span>
                  <input type="tel" placeholder="Phone Number *" className="flex-1 outline-none" maxLength={10}
                    value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="flex items-center border-2 rounded-xl px-4 py-3 focus-within:border-green-500 transition">
                  <Mail size={18} className="text-gray-400 mr-2" />
                  <input type="email" placeholder="Email (optional)" className="flex-1 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="flex items-center border-2 rounded-xl px-4 py-3 focus-within:border-green-500 transition">
                  <Lock size={18} className="text-gray-400 mr-2" />
                  <input type={showPass ? 'text' : 'password'} placeholder="Password *" className="flex-1 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                  <button onClick={() => setShowPass(!showPass)} className="text-gray-400">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>
                <div className="flex items-center border-2 rounded-xl px-4 py-3 focus-within:border-green-500 transition">
                  <Lock size={18} className="text-gray-400 mr-2" />
                  <input type="password" placeholder="Confirm Password *" className="flex-1 outline-none" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                </div>
                <div className="flex items-center border-2 rounded-xl px-4 py-3 focus-within:border-green-500 transition">
                  <Shield size={18} className="text-gray-400 mr-2" />
                  <input type="text" placeholder="Referral Code (optional)" className="flex-1 outline-none" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} />
                </div>
              </div>
              <button onClick={handleSignup} disabled={loading}
                className={`btn-3d w-full py-3.5 rounded-xl font-semibold text-lg mt-5 disabled:opacity-50 transition text-white ${signupRole === 'owner' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {loading ? 'Creating...' : signupRole === 'owner' ? 'Register as Ground Owner' : 'Create Account'}
              </button>
              <p className="text-center text-gray-500 mt-4 text-sm">
                Already have an account? <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-green-600 font-medium hover:underline">Login</button>
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Forgot Password</h2>
              <p className="text-gray-500 mb-6">Enter your phone number or email</p>
              <div className="flex items-center border-2 rounded-xl px-4 py-3 mb-5 focus-within:border-green-500 transition">
                <Mail size={18} className="text-gray-400 mr-2" />
                <input type="text" placeholder="Phone or Email" className="flex-1 outline-none text-base"
                  value={identifier} onChange={e => setIdentifier(e.target.value)} />
              </div>
              <button onClick={handleForgotPassword} disabled={loading}
                className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-green-700 disabled:opacity-50 transition">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="w-full text-gray-500 mt-3 text-sm hover:text-gray-700">Back to Login</button>
            </>
          )}

          {mode === 'otp' && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Verify OTP</h2>
              <p className="text-gray-500 mb-5">Enter OTP sent to {phone || identifier}</p>
              <div className="flex items-center border-2 rounded-xl px-4 py-3 mb-3 focus-within:border-green-500 transition">
                <Shield size={18} className="text-gray-400 mr-2" />
                <input type="text" placeholder="Enter OTP" className="flex-1 outline-none text-lg tracking-widest text-center" maxLength={4}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="flex items-center border-2 rounded-xl px-4 py-3 mb-3 focus-within:border-green-500 transition">
                <Lock size={18} className="text-gray-400 mr-2" />
                <input type="password" placeholder="New Password (for reset)" className="flex-1 outline-none"
                  value={newPass} onChange={e => setNewPass(e.target.value)} />
              </div>
              <p className="text-sm text-gray-400 mb-5 text-center">Demo: Use OTP <b className="text-green-600">1234</b></p>
              <button onClick={handleVerifyOTP} disabled={loading}
                className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-green-700 disabled:opacity-50 transition">
                {loading ? 'Verifying...' : newPass ? 'Reset Password' : 'Verify & Login'}
              </button>
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="w-full text-gray-500 mt-3 text-sm hover:text-gray-700">Back to Login</button>
            </>
          )}

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-400 mb-3">Quick Demo Login:</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => quickLogin('9898989898')} className="btn-3d text-sm bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-100 transition">User</button>
              <button onClick={() => quickLogin('9876543210')} className="btn-3d text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition">Owner</button>
              <button onClick={() => quickLogin('9782005500')} className="btn-3d text-sm bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition">Admin</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Demo OTP: 1234 | Demo Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
