import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Bell, Menu, X, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      notificationAPI.list().then(data => setUnreadCount(data.unread_count)).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'teacher': return '/teacher';
      case 'student': return '/student';
      default: return '/';
    }
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <GraduationCap size={28} />
            <span className="hidden sm:inline">GuruConnect</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:text-indigo-200 transition">Home</Link>
            <Link to="/search" className="hover:text-indigo-200 transition">Find Teachers</Link>
            {user ? (
              <>
                <Link to={getDashboardLink()} className="hover:text-indigo-200 transition">Dashboard</Link>
                <Link to="/support" className="hover:text-indigo-200 transition">Support</Link>
                <Link to="/notifications" className="relative hover:text-indigo-200 transition">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-3 ml-2">
                  <div className="text-sm">
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-indigo-200 text-xs capitalize">{user.role}</div>
                  </div>
                  <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg transition" title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">Login</Link>
                <Link to="/register" className="px-4 py-2 bg-white text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden bg-indigo-800 border-t border-indigo-600 px-4 pb-4">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-indigo-200">Home</Link>
          <Link to="/search" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-indigo-200">Find Teachers</Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)} className="block py-2 hover:text-indigo-200">Dashboard</Link>
              <Link to="/support" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-indigo-200">Support</Link>
              <Link to="/notifications" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-indigo-200">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Link>
              <button onClick={handleLogout} className="block py-2 text-red-300 hover:text-red-200">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-indigo-200">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-indigo-200">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
