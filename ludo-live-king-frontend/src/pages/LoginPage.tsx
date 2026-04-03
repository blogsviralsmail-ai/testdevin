import { useState } from "react";
import { useAuth } from "../context/AuthContext";

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
    <div className="min-h-screen ludo-bg flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm mx-auto flex flex-col items-center">
        {/* Logo Area */}
        <div className="text-center mb-6">
          {/* Crown */}
          <div className="text-5xl mb-1">👑</div>
          {/* LUDO letters */}
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-4xl font-bold text-red-500 drop-shadow-lg" style={{textShadow: '2px 2px 0 #000'}}>L</span>
            <span className="text-4xl font-bold text-white bg-red-500 rounded-full w-10 h-10 flex items-center justify-center drop-shadow-lg">U</span>
            <span className="text-4xl font-bold text-green-500 drop-shadow-lg" style={{textShadow: '2px 2px 0 #000'}}>D</span>
            <span className="text-4xl font-bold text-yellow-400 drop-shadow-lg" style={{textShadow: '2px 2px 0 #000'}}>O</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-bold text-white tracking-widest" style={{textShadow: '1px 1px 0 #000'}}>LIVE</span>
            <span className="text-lg font-bold crown-text tracking-widest">KING</span>
          </div>
          <p className="text-blue-200/60 text-xs mt-1">by KKHS Media</p>
        </div>

        {/* Login Card */}
        <div className="game-card p-5 w-full">
          {/* Tabs */}
          <div className="flex mb-5 gap-2">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                !isRegister
                  ? "btn-golden"
                  : "bg-blue-900/50 text-blue-200 border-2 border-blue-400/30 hover:bg-blue-800/50"
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                isRegister
                  ? "btn-golden"
                  : "bg-blue-900/50 text-blue-200 border-2 border-blue-400/30 hover:bg-blue-800/50"
              }`}
            >
              REGISTER
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border-2 border-red-500/50 rounded-xl text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-blue-950/50 border-2 border-blue-400/30 rounded-xl py-3 px-4 text-white placeholder-blue-300/40 focus:outline-none focus:border-yellow-400/70 text-center"
              required
            />

            {isRegister && (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-blue-950/50 border-2 border-blue-400/30 rounded-xl py-3 px-4 text-white placeholder-blue-300/40 focus:outline-none focus:border-yellow-400/70 text-center"
                  required
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-blue-950/50 border-2 border-blue-400/30 rounded-xl py-3 px-4 text-white placeholder-blue-300/40 focus:outline-none focus:border-yellow-400/70 text-center"
                />
              </>
            )}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-blue-950/50 border-2 border-blue-400/30 rounded-xl py-3 px-4 text-white placeholder-blue-300/40 focus:outline-none focus:border-yellow-400/70 text-center"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 btn-golden text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isRegister ? (
                "CREATE ACCOUNT"
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-blue-400/20" />
            <span className="text-blue-300/50 text-xs font-bold">OR</span>
            <div className="flex-1 h-px bg-blue-400/20" />
          </div>

          <button
            onClick={handleGuest}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 border-2 border-green-400 text-white font-bold text-base transition-all flex items-center justify-center gap-2"
            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'}}
          >
            ⚡ PLAY AS GUEST
          </button>
        </div>

        <p className="text-center text-blue-300/30 text-xs mt-6">
          &copy; 2024 KKHS Media. All rights reserved.
        </p>
      </div>
    </div>
  );
}
