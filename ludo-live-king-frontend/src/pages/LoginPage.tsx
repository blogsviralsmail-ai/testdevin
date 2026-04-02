import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Gamepad2, User, Mail, Lock, LogIn, UserPlus, Zap } from "lucide-react";

export default function LoginPage() {
  const { login, register, guestLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, email, password, displayName || username);
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError("");
    setLoading(true);
    try {
      await guestLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-orange-500/30 mb-4">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Ludo Live King
          </h1>
          <p className="text-gray-400 mt-1">by KKHS Media</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
          <div className="flex mb-6 bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                !isRegister ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isRegister ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                required
              />
            </div>

            {isRegister && (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-lg shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isRegister ? (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-500 text-xs">OR</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <button
            onClick={handleGuest}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Zap size={18} className="text-amber-400" />
            Play as Guest
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          &copy; 2024 KKHS Media. All rights reserved.
        </p>
      </div>
    </div>
  );
}
