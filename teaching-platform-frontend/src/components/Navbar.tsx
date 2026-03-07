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
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
                <BookOpen size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 leading-tight tracking-tight">GuruConnect</span>
                <span className="text-[10px] text-gray-400 leading-none -mt-0.5 hidden sm:block">Teaching Marketplace</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link to="/search" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/search') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Find Teachers</Link>
              {user && (
                <>
                  <Link to={getDashboardLink()} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(getDashboardLink()) ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Dashboard</Link>
                  <Link to="/support" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/support') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Support</Link>
                </>
              )}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/notifications" className="relative p-2.5 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <div ref={profileRef} className="relative">
                    <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left hidden lg:block">
                        <div className="text-sm font-medium text-gray-900 leading-tight max-w-[120px] truncate">{user.full_name}</div>
                        <div className="text-[11px] text-gray-400 capitalize">{user.role}</div>
                      </div>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                        <Link to={getDashboardLink()} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                          <LayoutDashboard size={16} className="text-gray-400" /> Dashboard
                        </Link>
                        <Link to="/support" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                          <LifeBuoy size={16} className="text-gray-400" /> Support
                        </Link>
                        <Link to="/notifications" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                          <Bell size={16} className="text-gray-400" /> Notifications
                          {unreadCount > 0 && <span className="ml-auto bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={() => { setProfileOpen(false); handleLogout(); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full">
                            <LogOut size={16} /> Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition">Sign In</Link>
                  <Link to="/register" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40">Join Free</Link>
                </div>
              )}
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition">
              {menuOpen ? <X size={22} className="text-gray-700" /> : <Menu size={22} className="text-gray-700" />}
            </button>
          </div>
        </div>
        <div className="hidden md:block border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 h-10 overflow-x-auto text-[13px]">
              {['Mathematics', 'Science', 'English', 'Hindi', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Sanskrit'].map(cat => (
                <Link key={cat} to={`/search?subject=${encodeURIComponent(cat)}`} className="text-gray-500 hover:text-emerald-600 whitespace-nowrap transition-colors font-medium">{cat}</Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100">
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg float-right"><X size={20} /></button>
              {user && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold">{user.full_name.charAt(0)}</div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{user.full_name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-2 space-y-0.5">
              <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium">Home</Link>
              <Link to="/search" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium">Find Teachers</Link>
              {user ? (
                <>
                  <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium"><LayoutDashboard size={16} /> Dashboard</Link>
                  <Link to="/support" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium"><LifeBuoy size={16} /> Support</Link>
                  <Link to="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium">
                    <Bell size={16} /> Notifications {unreadCount > 0 && <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
                  </Link>
                  <div className="border-t border-gray-100 my-2"></div>
                  <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition text-sm font-medium w-full"><LogOut size={16} /> Sign Out</button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-100 my-2"></div>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium">Sign In</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 mx-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition"><User size={16} /> Join Free</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
