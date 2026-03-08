import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, BookOpen, GraduationCap, User } from 'lucide-react';

const RAJASTHAN_CITIES = [
  'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner',
  'Bhilwara', 'Alwar', 'Sikar', 'Pali', 'Bharatpur', 'Sri Ganganagar',
  'Tonk', 'Kishangarh', 'Beawar', 'Hanumangarh', 'Dhaulpur',
  'Gangapur City', 'Sawai Madhopur', 'Churu', 'Jhunjhunu',
  'Banswara', 'Chittorgarh', 'Baran', 'Rajsamand', 'Mount Abu',
  'Nagaur', 'Barmer', 'Dungarpur', 'Bundi', 'Jaisalmer', 'Pushkar'
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    role: 'student', city: '', state: 'Rajasthan'
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      if (redirectPath) {
        navigate(redirectPath);
      } else if (form.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-morphBg"></div>
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px'}}></div>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-slideUp">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="font-black text-xl text-white">GuruConnect</span>
          </Link>
          <h1 className="text-3xl font-black text-white">Create your account</h1>
          <p className="text-slate-400 mt-2">Join as a Student or Teacher</p>
        </div>

        <div className="glass rounded-2xl p-8 animate-glow">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button type="button" onClick={() => setForm({ ...form, role: 'student' })}
              className={`card-3d flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                form.role === 'student' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5'
              }`}>
              <User size={28} />
              <span className="font-bold text-sm">I want to Learn</span>
            </button>
            <button type="button" onClick={() => setForm({ ...form, role: 'teacher' })}
              className={`card-3d flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                form.role === 'teacher' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5'
              }`}>
              <GraduationCap size={28} />
              <span className="font-bold text-sm">I want to Teach</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white placeholder-slate-500" placeholder="Enter your full name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white placeholder-slate-500" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none pr-12 text-sm text-white placeholder-slate-500" placeholder="Create password" required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-slate-500 hover:text-emerald-400 transition">
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white placeholder-slate-500" placeholder="9XXXXXXXXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">City</label>
                <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white">
                  <option value="">Select City</option>
                  {RAJASTHAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">State</label>
                <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white placeholder-slate-500" placeholder="Rajasthan" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transform">
              <UserPlus size={18} /> {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to={`/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`} className="text-emerald-400 font-bold hover:text-emerald-300 transition">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
