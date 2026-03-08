import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, Menu, X, ChevronDown, User, LayoutDashboard, LifeBuoy, BookOpen } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      notificationAPI.list().then(data => setUnreadCount(data.unread_count)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'teacher': return '/teacher';
      case 'student': return '/student';
      default: return '/';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all animate-pulse3d">
                <BookOpen size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg text-white leading-tight tracking-tight">GuruConnect</span>
                <span className="text-[10px] text-emerald-400/60 leading-none -mt-0.5 hidden sm:block">Future of Teaching</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link to="/search" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/search') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Find Teachers</Link>
              {user && (
                <>
                  <Link to={getDashboardLink()} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(getDashboardLink()) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Dashboard</Link>
                  <Link to="/support" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/support') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Support</Link>
                </>
              )}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/notifications" className="relative p-2.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-slate-950 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <div ref={profileRef} className="relative">
                    <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/20">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left hidden lg:block">
                        <div className="text-sm font-medium text-white leading-tight max-w-[120px] truncate">{user.full_name}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{user.role}</div>
                      </div>
                      <ChevronDown size={14} className={`text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 glass-dark rounded-xl shadow-2xl py-2 z-50 border border-white/10">
                        <div className="px-4 py-3 border-b border-white/5">
                          <div className="text-sm font-semibold text-white">{user.full_name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                        <Link to={getDashboardLink()} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition">
                          <LayoutDashboard size={16} className="text-slate-500" /> Dashboard
                        </Link>
                        <Link to="/support" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition">
                          <LifeBuoy size={16} className="text-slate-500" /> Support
                        </Link>
                        <Link to="/notifications" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition">
                          <Bell size={16} className="text-slate-500" /> Notifications
                          {unreadCount > 0 && <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                        </Link>
                        <div className="border-t border-white/5 mt-1 pt-1">
                          <button onClick={() => { setProfileOpen(false); handleLogout(); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition w-full">
                            <LogOut size={16} /> Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition">Sign In</Link>
                  <Link to="/register" className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transform">Join Free</Link>
                </div>
              )}
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/5 transition">
              {menuOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
            </button>
          </div>
        </div>
        <div className="hidden md:block border-t border-white/5 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 h-10 overflow-x-auto text-[13px]">
              {['Mathematics', 'Science', 'English', 'Hindi', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Sanskrit'].map(cat => (
                <Link key={cat} to={`/search?subject=${encodeURIComponent(cat)}`} className="text-slate-500 hover:text-emerald-400 whitespace-nowrap transition-colors font-medium">{cat}</Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-slate-950 border-l border-white/5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/5">
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-lg float-right text-white"><X size={20} /></button>
              {user && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold">{user.full_name.charAt(0)}</div>
                  <div>
                    <div className="font-semibold text-white text-sm">{user.full_name}</div>
                    <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-2 space-y-0.5">
              <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition text-sm font-medium">Home</Link>
              <Link to="/search" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition text-sm font-medium">Find Teachers</Link>
              {user ? (
                <>
                  <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition text-sm font-medium"><LayoutDashboard size={16} /> Dashboard</Link>
                  <Link to="/support" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition text-sm font-medium"><LifeBuoy size={16} /> Support</Link>
                  <Link to="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition text-sm font-medium">
                    <Bell size={16} /> Notifications {unreadCount > 0 && <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
                  </Link>
                  <div className="border-t border-white/5 my-2"></div>
                  <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition text-sm font-medium w-full"><LogOut size={16} /> Sign Out</button>
                </>
              ) : (
                <>
                  <div className="border-t border-white/5 my-2"></div>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 transition text-sm font-medium">Sign In</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 mx-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:from-emerald-400 hover:to-teal-500 transition shadow-lg shadow-emerald-500/25"><User size={16} /> Join Free</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
