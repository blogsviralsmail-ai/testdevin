import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Menu, Bell, Moon, Sun, LogOut, User, Search } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export default function Navbar({ onMenuClick, sidebarCollapsed }: NavbarProps) {
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
    localStorage.setItem('theme', darkMode ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700">
          <Menu size={24} />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm w-64 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.[0] || 'U'}
            </div>
            <span className="hidden md:block text-sm font-medium dark:text-white">
              {user?.firstName} {user?.lastName}
            </span>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 py-1 z-50">
              <button
                onClick={() => { navigate('/settings'); setShowProfile(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <User size={16} /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
