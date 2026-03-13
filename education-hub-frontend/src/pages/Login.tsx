import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { setAuth } from "../lib/api";
import { Eye, EyeOff, GraduationCap, Shield, Users } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/settings").then(r => {
      const s = r.data || {};
      const logo = s.navbar_logo_url || s.logo_url;
      if (logo) {
        setLogoUrl(logo.startsWith("/") ? API + logo : logo);
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { username, password });
      setAuth(res.data.token, res.data.user);
      const role = res.data.user.role;
      if (role === "student") {
        navigate("/student");
      } else if (role === "center") {
        navigate("/center");
      } else {
        navigate("/admin");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full" style={{ animation: "float 4s ease-in-out infinite 1s" }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full" style={{ animation: "float 5s ease-in-out infinite 0.5s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Glass card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 animate-fade-in-up">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <img src={logoUrl} alt="Education Hub" className="h-20 w-auto drop-shadow-lg" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-2 bg-blue-600/20 rounded-full blur-sm" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Education Hub
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Welcome back! Sign in to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm animate-fade-in-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username / Mobile / Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-gray-50/50"
                placeholder="Enter mobile number or email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12 transition-all text-sm bg-gray-50/50"
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-3d btn-3d-blue w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 transition-all hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">Forgot Password?</Link>
          </div>
          <div className="mt-4 text-center">
            <Link to="/register" className="btn-3d btn-3d-green inline-block px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-green-700 hover:to-emerald-700 transition-all">
              New Student? Register Here
            </Link>
          </div>
          <div className="mt-3 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">← Back to Home</Link>
          </div>
        </div>

        {/* Feature badges below card */}
        <div className="flex justify-center gap-4 mt-6">
          {[
            { icon: Shield, label: "Secure Login" },
            { icon: GraduationCap, label: "46+ Courses" },
            { icon: Users, label: "15+ Universities" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-white/70 text-xs">
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
