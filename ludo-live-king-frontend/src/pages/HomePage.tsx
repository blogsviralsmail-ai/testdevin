import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import { api } from "../utils/api";
import {
  Gamepad2, Users, Bot, Globe, Trophy, User, LogOut,
  Coins, Gem, Star, Shield, Zap, Gift,
  Settings, BarChart3
} from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Ludo Live King</h1>
              <p className="text-gray-400 text-xs">by KKHS Media</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.is_admin && (
              <button
                onClick={() => navigate("/admin")}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Shield size={18} />
              </button>
            )}
            <button
              onClick={() => navigate("/profile")}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <User size={18} />
            </button>
            <button
              onClick={() => navigate("/leaderboard")}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <Trophy size={18} />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* User Stats Bar */}
        <div className="bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-700/50 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
                {["🦁", "🐯", "🦊", "🐻", "🐼"][((user?.avatar_id || 1) - 1) % 5]}
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">{user?.display_name}</h2>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Star size={12} className="text-amber-400" />
                  Level {user?.level || 1} · Rating {Math.round(user?.rating || 1000)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Coins size={18} className="text-amber-400" />
                <span className="text-white font-bold">{(user?.coins || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gem size={16} className="text-purple-400" />
                <span className="text-white font-bold">{user?.gems || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <p className="text-gray-400 text-xs">Games</p>
              <p className="text-white font-bold">{user?.total_games || 0}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <p className="text-gray-400 text-xs">Wins</p>
              <p className="text-green-400 font-bold">{user?.games_won || 0}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <p className="text-gray-400 text-xs">Streak</p>
              <p className="text-amber-400 font-bold">{user?.win_streak || 0}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <p className="text-gray-400 text-xs">Kills</p>
              <p className="text-red-400 font-bold">{user?.total_kills || 0}</p>
            </div>
          </div>
        </div>

        {/* Online stats */}
        <div className="flex items-center justify-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {onlineCount.online_players} Players Online
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <Gamepad2 size={14} />
            {onlineCount.active_games} Active Games
          </div>
        </div>

        {/* Game Mode Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handlePlayOnline}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-left transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20"
          >
            <Globe className="w-10 h-10 text-blue-200 mb-3" />
            <h3 className="text-white font-bold text-lg">Play Online</h3>
            <p className="text-blue-200/70 text-xs mt-1">Match with random players worldwide</p>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          </button>

          <button
            onClick={handlePlayVsComputer}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-green-800 p-5 text-left transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20"
          >
            <Bot className="w-10 h-10 text-green-200 mb-3" />
            <h3 className="text-white font-bold text-lg">vs Computer</h3>
            <p className="text-green-200/70 text-xs mt-1">Practice against AI bots</p>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-5 text-left transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20"
          >
            <Users className="w-10 h-10 text-purple-200 mb-3" />
            <h3 className="text-white font-bold text-lg">Create Room</h3>
            <p className="text-purple-200/70 text-xs mt-1">Create private game & invite friends</p>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 p-5 text-left transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/20"
          >
            <Zap className="w-10 h-10 text-amber-200 mb-3" />
            <h3 className="text-white font-bold text-lg">Join Room</h3>
            <p className="text-amber-200/70 text-xs mt-1">Join a friend's game with code</p>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          </button>
        </div>

        {/* Daily Reward */}
        <button
          onClick={handleClaimDaily}
          disabled={claimingReward}
          className="w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 hover:from-amber-500/20 hover:to-orange-500/20 transition-all mb-6"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-white font-bold">Daily Reward</h3>
            <p className="text-gray-400 text-xs">Claim 100 free coins every day!</p>
          </div>
          <div className="text-amber-400 font-bold text-lg">+100 🪙</div>
        </button>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate("/leaderboard")}
            className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <Trophy size={24} className="text-amber-400" />
            <span className="text-white text-xs font-semibold">Leaderboard</span>
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <BarChart3 size={24} className="text-blue-400" />
            <span className="text-white text-xs font-semibold">My Stats</span>
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <Settings size={24} className="text-gray-400" />
            <span className="text-white text-xs font-semibold">Settings</span>
          </button>
        </div>
      </div>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-white mb-4">Join Room</h2>
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-4"
              maxLength={6}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRoom}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-400 hover:to-orange-400"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-white mb-4">Create Room</h2>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Game Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {["classic", "quick", "master", "rush"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setGameMode(mode)}
                      className={`py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                        gameMode === mode
                          ? "bg-amber-500 text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Players</label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxPlayers(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        maxPlayers === n
                          ? "bg-amber-500 text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {n} Players
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-400 hover:to-orange-400"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
