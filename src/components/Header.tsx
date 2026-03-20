import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, User, LogOut, Shield, Heart, Trophy, MessageSquare, ChevronDown, Cloud, GitCompare, Clock, Split, Bell, Info, Phone, Wallet, BookOpen, RotateCcw } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isActive = (path: string) => location.pathname === path;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const isAdmin = location.pathname.startsWith('/admin');
  const isOwner = location.pathname.startsWith('/owner');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (location.pathname === '/login') return null;
  if (isAdmin || isOwner) return null;

  // Logged-in dropdown categories
  const dropdownCategories = [
    { id: 'bookings', label: 'Bookings & Activities', items: [
      { to: '/my-bookings', icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50', label: 'My Bookings', desc: 'View your bookings' },
      { to: '/favourites', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', label: 'Favourites', desc: 'Your saved grounds' },
      { to: '/compare', icon: GitCompare, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Compare', desc: 'Compare grounds' },
    ]},
    { id: 'tournaments', label: 'Tournaments & More', items: [
      { to: '/tournaments', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Tournaments', desc: 'Join competitions' },
      { to: '/waitlist', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Waitlist', desc: 'Get notified' },
    ]},
    { id: 'tools', label: 'Tools & Utilities', items: [
      { to: '/chat', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Messages', desc: 'Chat with owners' },
      { to: '/weather', icon: Cloud, color: 'text-cyan-500', bg: 'bg-cyan-50', label: 'Weather', desc: 'Check before playing' },
      { to: '/split-payment', icon: Split, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Split Payment', desc: 'Split with friends' },
      { to: '/notifications', icon: Bell, color: 'text-violet-600', bg: 'bg-violet-50', label: 'Notifications', desc: 'Manage alerts' },
    ]},
  ];

  return (
    <header className="sticky top-0 z-50 header-3d border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl float-3d" style={{animationDuration:'4s'}}>&#127951;</span>
            <span className="text-xl font-bold text-green-700 glow-3d" style={{padding:'4px 8px',borderRadius:'8px'}}>BookAGround</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className={`nav-3d flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Home size={16} /> Home
            </Link>

            {!user ? (
              /* Before Login: Show About Us, Contact Us, Privacy Policy, Refund Policy, Terms */
              <>
                <Link to="/about" className={`nav-3d flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/about') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Info size={16} /> About Us
                </Link>
                <Link to="/contact" className={`nav-3d flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/contact') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Phone size={16} /> Contact Us
                </Link>
                <Link to="/privacy-policy" className={`nav-3d flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/privacy-policy') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Shield size={16} /> Privacy Policy
                </Link>
                <Link to="/refund-policy" className={`nav-3d flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/refund-policy') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <RotateCcw size={16} /> Refund Policy
                </Link>
                <Link to="/terms" className={`nav-3d flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/terms') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <BookOpen size={16} /> Terms & Conditions
                </Link>
              </>
            ) : (
              /* After Login: Show dropdown categories */
              <>
                {dropdownCategories.map(cat => (
                  <div key={cat.id} className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === cat.id ? null : cat.id)}
                      className={`nav-3d flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${openDropdown === cat.id ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {cat.label} <ChevronDown size={14} className={`transition-transform ${openDropdown === cat.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === cat.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white border rounded-2xl shadow-xl py-3 w-64 z-50" onMouseLeave={() => setOpenDropdown(null)}>
                        <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{cat.label}</p>
                        {cat.items.map(item => (
                          <Link key={item.to} to={item.to}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition rounded-lg mx-1"
                            onClick={() => setOpenDropdown(null)}>
                            <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <item.icon size={16} className={item.color} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800">{item.label}</p>
                              <p className="text-[11px] text-gray-400 leading-tight">{item.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {/* Management links for owner/admin */}
                {(user?.role === 'owner' || user?.role === 'admin') && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'mgmt' ? null : 'mgmt')}
                      className={`nav-3d flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${openDropdown === 'mgmt' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Shield size={14} /> Management <ChevronDown size={14} className={`transition-transform ${openDropdown === 'mgmt' ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === 'mgmt' && (
                      <div className="absolute top-full right-0 mt-1 bg-white border rounded-2xl shadow-xl py-3 w-64 z-50" onMouseLeave={() => setOpenDropdown(null)}>
                        <Link to="/owner" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition rounded-lg mx-1" onClick={() => setOpenDropdown(null)}>
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Shield size={16} className="text-blue-600" /></div>
                          <div><p className="text-sm font-medium text-gray-800">Owner Panel</p><p className="text-[11px] text-gray-400">Manage your grounds</p></div>
                        </Link>
                        {user?.role === 'admin' && (
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition rounded-lg mx-1" onClick={() => setOpenDropdown(null)}>
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center"><Shield size={16} className="text-purple-600" /></div>
                            <div><p className="text-sm font-medium text-gray-800">Admin Panel</p><p className="text-[11px] text-gray-400">Platform management</p></div>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </nav>

          {/* Right side - Wallet/Login/Profile */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/wallet" className="btn-3d flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition" title="My Wallet">
                  <Wallet size={16} />
                  <span className="text-sm font-semibold">Rs.{(user.wallet_balance || 0).toLocaleString()}</span>
                </Link>
                <Link to="/profile" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive('/profile') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                    {user.name?.[0] || 'U'}
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="nav-3d text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition" title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="login-btn-3d bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">Login</Link>
            )}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden flex items-center justify-around py-2 border-t -mx-4 px-4">
          <Link to="/" className={`flex flex-col items-center text-xs ${isActive('/') ? 'text-green-600' : 'text-gray-400'}`}>
            <Home size={18} /><span>Home</span>
          </Link>
          {!user ? (
            <>
              <Link to="/about" className={`flex flex-col items-center text-xs ${isActive('/about') ? 'text-green-600' : 'text-gray-400'}`}>
                <Info size={18} /><span>About</span>
              </Link>
              <Link to="/contact" className={`flex flex-col items-center text-xs ${isActive('/contact') ? 'text-green-600' : 'text-gray-400'}`}>
                <Phone size={18} /><span>Contact</span>
              </Link>
              <Link to="/privacy-policy" className={`flex flex-col items-center text-xs ${isActive('/privacy-policy') ? 'text-green-600' : 'text-gray-400'}`}>
                <Shield size={18} /><span>Privacy</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/my-bookings" className={`flex flex-col items-center text-xs ${isActive('/my-bookings') ? 'text-green-600' : 'text-gray-400'}`}>
                <CalendarDays size={18} /><span>Bookings</span>
              </Link>
              <Link to="/tournaments" className={`flex flex-col items-center text-xs ${isActive('/tournaments') ? 'text-green-600' : 'text-gray-400'}`}>
                <Trophy size={18} /><span>Tournaments</span>
              </Link>
            </>
          )}
          <Link to={user ? "/profile" : "/login"} className={`flex flex-col items-center text-xs ${isActive('/profile') || isActive('/login') ? 'text-green-600' : 'text-gray-400'}`}>
            <User size={18} /><span>{user ? 'Profile' : 'Login'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
