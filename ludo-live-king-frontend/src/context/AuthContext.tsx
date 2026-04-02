import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../utils/api";
import { reconnectSocket } from "../utils/socket";

interface User {
  id: number;
  username: string;
  display_name: string;
  email?: string;
  avatar_id: number;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  total_games: number;
  games_won: number;
  games_lost: number;
  win_streak: number;
  best_win_streak: number;
  total_kills: number;
  rating: number;
  is_online: boolean;
  is_admin: boolean;
  is_vip: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function refreshUser() {
    try {
      const data = await api.get<{ user: User }>("/api/users/me");
      setUser(data.user);
      localStorage.setItem("userId", String(data.user.id));
    } catch {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  }

  async function login(username: string, password: string) {
    const data = await api.post<{ token: string; user: User }>("/api/auth/login", {
      username,
      password,
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", String(data.user.id));
    setToken(data.token);
    setUser(data.user);
    reconnectSocket();
  }

  async function register(username: string, email: string, password: string, displayName: string) {
    const data = await api.post<{ token: string; user: User }>("/api/auth/register", {
      username,
      email,
      password,
      display_name: displayName,
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", String(data.user.id));
    setToken(data.token);
    setUser(data.user);
    reconnectSocket();
  }

  async function guestLogin() {
    const data = await api.post<{ token: string; user: User }>("/api/auth/guest", {
      device_id: `web_${Date.now()}`,
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", String(data.user.id));
    setToken(data.token);
    setUser(data.user);
    reconnectSocket();
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, guestLogin, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
