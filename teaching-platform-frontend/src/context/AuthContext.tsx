import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  city?: string;
  state?: string;
  is_verified?: boolean;
  avatar?: string;
  teacher_profile?: {
    id: number;
    bio?: string;
    experience_years: number;
    hourly_rate: number;
    languages: string[];
    qualification?: string;
    is_approved: boolean;
    rating: number;
    total_reviews: number;
    total_classes: number;
    total_earnings: number;
    subjects: { id: number; subject_id: number; subject_name: string; class_levels: string[] }[];
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; phone?: string; role: string; city?: string; state?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then(data => setUser(data))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (regData: { email: string; password: string; full_name: string; phone?: string; role: string; city?: string; state?: string }) => {
    const data = await authAPI.register(regData);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await authAPI.getMe();
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
