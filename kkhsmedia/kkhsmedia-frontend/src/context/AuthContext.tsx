import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, publicAPI } from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  address?: Record<string, string>;
  emailVerified?: boolean;
}

interface SiteSettings {
  brandName: string;
  companyName: string;
  contactEmail: string;
  supportEmail: string;
  address: string;
  phone: string;
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  socialLinks: Record<string, string>;
  logoUrl: string;
  faviconUrl: string;
  metaTitle: string;
  metaDescription: string;
  maintenanceMode: boolean;
  gstRate: number;
  currency: string;
}

interface AuthContextType {
  user: User | null;
  settings: SiteSettings | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const settingsRes = await publicAPI.getSettings();
        setSettings(settingsRes.data);
      } catch { /* ignore */ }

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data);
    } catch { /* ignore */ }
  };

  const refreshSettings = async () => {
    try {
      const res = await publicAPI.getSettings();
      setSettings(res.data);
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ user, settings, loading, login, logout, refreshUser, refreshSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
