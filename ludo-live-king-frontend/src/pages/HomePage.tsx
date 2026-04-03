import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import { api } from "../utils/api";

export default function HomePage() {
  const { user, logout, refreshUser } = useAuth();
  const { createRoom, joinRoom, playVsComputer, joinMatchmaking, gameState } = useGame();
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [gameMode, setGameMode] = useState("classic");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [onlineCount, setOnlineCount] = useState({ online_players: 0, active_games: 0 });
  const [claimingReward, setClaimingReward] = useState(false);

  useEffect(() => {
    if (gameState && gameState.status === "playing") {
      navigate("/game");
    }
  }, [gameState, navigate]);

  useEffect(() => {
    api.get<{ online_players: number; active_games: number }>("/api/games/online-count")
      .then(setOnlineCount)
      .catch(() => {});
    const interval = setInterval(() => {
      api.get<{ online_players: number; active_games: number }>("/api/games/online-count")
        .then(setOnlineCount)
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = () => {
    createRoom(gameMode, maxPlayers, user?.display_name || "Player");
    setShowCreateModal(false);
    navigate("/game");
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase(), user?.display_name || "Player");
    setShowJoinModal(false);
    navigate("/game");
  };

  const handlePlayVsComputer = () => {
    playVsComputer(user?.display_name || "Player", 3, "classic");
    navigate("/game");
  };

  const handlePlayOnline = () => {
    joinMatchmaking("classic", user?.display_name || "Player", 4);
    navigate("/game");
  };

  const handleClaimDaily = async () => {
    setClaimingReward(true);
    try {
      await api.post("/api/users/me/daily-reward");
      await refreshUser();
    } catch {
      // Already claimed
    } finally {
      setClaimingReward(false);
    }
  };

  return (
    <div className="min-h-screen ludo-bg">
      <div className="relative max-w-md mx-auto px-4 py-3 pb-24">
        {/* Top Bar - User info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg border-2 border-yellow-400 bg-blue-800 flex items-center justify-center overflow-hidden">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                {user?.display_name}
              </p>
              <p className="text-blue-200/60 text-xs">Level {user?.level || 1}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-blue-900/60 rounded-full px-3 py-1 border border-yellow-500/30">
              <span className="text-yellow-400">🪙</span>
              <span className="text-white font-bold text-sm">{(user?.coins || 0).toLocaleString()}</span>
            </div>
            {user?.is_admin && (
              <button
                onClick={() => navigate("/admin")}
                className="w-8 h-8 rounded-lg bg-red-600/80 border border-red-400 flex items-center justify-center text-sm"
              >
                ⚙️
              </button>
            )}
            <button
              onClick={logout}
              className="w-8 h-8 rounded-lg bg-blue-800 border border-blue-400/30 flex items-center justify-center text-sm hover:bg-red-700 transition-colors"
            >
              🚪
            </button>
          </div>
        </div>

        {/* MORE COINS button */}
        <div className="flex justify-end mb-3">
          <button
            onClick={handleClaimDaily}
            disabled={claimingReward}
            className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-green-600 rounded-lg border-2 border-green-400 text-white font-bold text-xs uppercase"
            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)', boxShadow: '0 3px 8px rgba(0,0,0,0.3)'}}
          >
            + FREE COINS
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-0">👑</div>
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-bold text-red-500" style={{textShadow: '2px 2px 0 #000'}}>L</span>
            <span className="text-3xl font-bold text-white bg-red-500 rounded-full w-9 h-9 flex items-center justify-center">U</span>
            <span className="text-3xl font-bold text-green-500" style={{textShadow: '2px 2px 0 #000'}}>D</span>
            <span className="text-3xl font-bold text-yellow-400" style={{textShadow: '2px 2px 0 #000'}}>O</span>
          </div>
          <div className="flex items-center justify-center gap-2 -mt-1">
            <span className="text-sm font-bold text-white tracking-widest" style={{textShadow: '1px 1px 0 #000'}}>LIVE</span>
            <span className="text-sm font-bold crown-text tracking-widest">KING</span>
          </div>
        </div>

        {/* Mini Ludo Board Preview */}
        <div className="flex justify-center mb-5">
          <div className="w-40 h-40 relative">
            <svg viewBox="0 0 150 150" className="w-full h-full drop-shadow-2xl">
              {/* Board background */}
              <rect x="0" y="0" width="150" height="150" rx="4" fill="#f5f0e1" stroke="#8B4513" strokeWidth="2"/>
              {/* Home yards */}
              <rect x="5" y="5" width="55" height="55" rx="3" fill="#e53e3e"/>
              <rect x="90" y="5" width="55" height="55" rx="3" fill="#38a169"/>
              <rect x="5" y="90" width="55" height="55" rx="3" fill="#3182ce"/>
              <rect x="90" y="90" width="55" height="55" rx="3" fill="#d69e2e"/>
              {/* Inner home white boxes */}
              <rect x="12" y="12" width="41" height="41" rx="2" fill="white"/>
              <rect x="97" y="12" width="41" height="41" rx="2" fill="white"/>
              <rect x="12" y="97" width="41" height="41" rx="2" fill="white"/>
              <rect x="97" y="97" width="41" height="41" rx="2" fill="white"/>
              {/* Center home */}
              <polygon points="75,60 90,75 75,90 60,75" fill="#e53e3e" stroke="white" strokeWidth="0.5"/>
              <polygon points="75,60 90,75 75,75" fill="#38a169"/>
              <polygon points="90,75 75,90 75,75" fill="#d69e2e"/>
              <polygon points="75,90 60,75 75,75" fill="#3182ce"/>
              {/* Pieces in home yards */}
              <circle cx="22" cy="22" r="5" fill="#ff6b6b" stroke="white" strokeWidth="1"/>
              <circle cx="37" cy="22" r="5" fill="#ff6b6b" stroke="white" strokeWidth="1"/>
              <circle cx="22" cy="37" r="5" fill="#ff6b6b" stroke="white" strokeWidth="1"/>
              <circle cx="37" cy="37" r="5" fill="#ff6b6b" stroke="white" strokeWidth="1"/>
              <circle cx="107" cy="22" r="5" fill="#48bb78" stroke="white" strokeWidth="1"/>
              <circle cx="122" cy="22" r="5" fill="#48bb78" stroke="white" strokeWidth="1"/>
              <circle cx="107" cy="37" r="5" fill="#48bb78" stroke="white" strokeWidth="1"/>
              <circle cx="122" cy="37" r="5" fill="#48bb78" stroke="white" strokeWidth="1"/>
              <circle cx="22" cy="107" r="5" fill="#4299e1" stroke="white" strokeWidth="1"/>
              <circle cx="37" cy="107" r="5" fill="#4299e1" stroke="white" strokeWidth="1"/>
              <circle cx="22" cy="122" r="5" fill="#4299e1" stroke="white" strokeWidth="1"/>
              <circle cx="37" cy="122" r="5" fill="#4299e1" stroke="white" strokeWidth="1"/>
              <circle cx="107" cy="107" r="5" fill="#ecc94b" stroke="white" strokeWidth="1"/>
              <circle cx="122" cy="107" r="5" fill="#ecc94b" stroke="white" strokeWidth="1"/>
              <circle cx="107" cy="122" r="5" fill="#ecc94b" stroke="white" strokeWidth="1"/>
              <circle cx="122" cy="122" r="5" fill="#ecc94b" stroke="white" strokeWidth="1"/>
            </svg>
          </div>
        </div>

        {/* Online counter */}
        <div className="flex items-center justify-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5 bg-blue-900/40 rounded-full px-3 py-1 border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 font-bold">{onlineCount.online_players} Online</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-900/40 rounded-full px-3 py-1 border border-blue-400/30">
            <span className="text-blue-300">🎮</span>
            <span className="text-blue-300 font-bold">{onlineCount.active_games} Games</span>
          </div>
        </div>

        {/* Game Mode Buttons - Ludo King style golden cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handlePlayOnline}
            className="game-card p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform active:scale-95"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl border-2 border-blue-300 shadow-lg">
              🌐
            </div>
            <span className="text-white font-bold text-sm uppercase" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
              Play Online
            </span>
          </button>

          <button
            onClick={handlePlayVsComputer}
            className="game-card p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform active:scale-95"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-2xl border-2 border-green-300 shadow-lg">
              🤖
            </div>
            <span className="text-white font-bold text-sm uppercase" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
              Computer
            </span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="game-card p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform active:scale-95"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl border-2 border-purple-300 shadow-lg">
              🏠
            </div>
            <span className="text-white font-bold text-sm uppercase" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
              Create Room
            </span>
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            className="game-card p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform active:scale-95"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-2xl border-2 border-orange-300 shadow-lg">
              🤝
            </div>
            <span className="text-white font-bold text-sm uppercase" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
              Join Room
            </span>
          </button>
        </div>

        {/* Bottom Nav - Ludo King style */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-blue-950 to-blue-900 border-t-2 border-yellow-500/30 px-4 py-2">
          <div className="max-w-md mx-auto flex justify-around">
            <button
              onClick={() => navigate("/leaderboard")}
              className="flex flex-col items-center gap-0.5 text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <span className="text-xl">🏆</span>
              <span className="text-xs font-bold">Rankings</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex flex-col items-center gap-0.5 text-blue-300 hover:text-blue-200 transition-colors"
            >
              <span className="text-xl">📊</span>
              <span className="text-xs font-bold">My Stats</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex flex-col items-center gap-0.5 text-blue-300 hover:text-blue-200 transition-colors"
            >
              <span className="text-xl">👤</span>
              <span className="text-xs font-bold">Profile</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex flex-col items-center gap-0.5 text-blue-300 hover:text-blue-200 transition-colors"
            >
              <span className="text-xl">⚙️</span>
              <span className="text-xs font-bold">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="game-card p-6 max-w-sm w-full relative">
            <button
              onClick={() => setShowJoinModal(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-yellow-500 border-2 border-yellow-300 flex items-center justify-center text-blue-900 font-bold text-lg hover:bg-yellow-400"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white text-center mb-4" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
              JOIN ROOM
            </h2>
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full bg-blue-950/50 border-2 border-blue-400/30 rounded-xl py-3 px-4 text-white text-center text-2xl tracking-widest placeholder-blue-300/40 focus:outline-none focus:border-yellow-400/70 mb-4"
              maxLength={6}
            />
            <button
              onClick={handleJoinRoom}
              className="w-full py-3 btn-golden text-lg"
            >
              JOIN GAME
            </button>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="game-card p-6 max-w-sm w-full relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-yellow-500 border-2 border-yellow-300 flex items-center justify-center text-blue-900 font-bold text-lg hover:bg-yellow-400"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white text-center mb-4" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
              CREATE ROOM
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-bold">GAME MODE</label>
                <div className="grid grid-cols-2 gap-2">
                  {["classic", "quick", "master", "rush"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setGameMode(mode)}
                      className={`py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                        gameMode === mode
                          ? "btn-golden"
                          : "bg-blue-900/50 text-blue-200 border-2 border-blue-400/30 hover:bg-blue-800/50"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-blue-200 text-sm mb-2 block font-bold">PLAYERS</label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxPlayers(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        maxPlayers === n
                          ? "btn-golden"
                          : "bg-blue-900/50 text-blue-200 border-2 border-blue-400/30 hover:bg-blue-800/50"
                      }`}
                    >
                      {n}P
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full py-3 btn-golden text-lg mt-5"
            >
              CREATE GAME
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
