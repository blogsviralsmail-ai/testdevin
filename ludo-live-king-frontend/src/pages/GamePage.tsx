import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import LudoBoard from "../components/LudoBoard";
import Dice from "../components/Dice";
import PlayerPanel from "../components/PlayerPanel";
import ChatBox from "../components/ChatBox";
import GameOverModal from "../components/GameOverModal";
import { ArrowLeft, Copy, Check, Users, Bot, Clock } from "lucide-react";

export default function GamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    gameState, roomCode, diceResult, isMyTurn, myColor,
    rollDice, movePiece, addBot, startGame, sendChat, sendEmoji,
    chatMessages, leaveGame, requestBotTurn, gameOver,
    playVsComputer,
  } = useGame();

  const [copied, setCopied] = useState(false);
  const [movablePieces, setMovablePieces] = useState<number[]>([]);
  const [waitingForMatch, setWaitingForMatch] = useState(false);

  // Update movable pieces when dice is rolled
  useEffect(() => {
    if (diceResult && diceResult.user_id === user?.id) {
      setMovablePieces(diceResult.movable_pieces);
    } else {
      setMovablePieces([]);
    }
  }, [diceResult, user?.id]);

  // Clear movable pieces after moving
  useEffect(() => {
    setMovablePieces([]);
  }, [gameState?.turn_count]);

  // Auto-trigger bot turns
  useEffect(() => {
    if (gameState?.status === "playing") {
      const currentPlayer = gameState.players[gameState.current_turn_index];
      if (currentPlayer?.is_bot && !gameOver) {
        const timer = setTimeout(() => {
          requestBotTurn();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState?.current_turn_index, gameState?.status, gameState?.turn_count, gameOver]);

  // Detect if waiting for matchmaking
  useEffect(() => {
    if (!gameState) {
      setWaitingForMatch(true);
    } else {
      setWaitingForMatch(false);
    }
  }, [gameState]);

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoHome = () => {
    leaveGame();
    navigate("/");
  };

  const handlePlayAgain = () => {
    leaveGame();
    playVsComputer(user?.display_name || "Player", 3, "classic");
  };

  const handleMovePiece = (pieceIndex: number) => {
    if (movablePieces.includes(pieceIndex)) {
      movePiece(pieceIndex);
      setMovablePieces([]);
    }
  };

  // Waiting for matchmaking
  if (waitingForMatch && !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Finding Players...</h2>
          <p className="text-gray-400 text-sm mb-6">Looking for opponents to match you with</p>
          <button
            onClick={handleGoHome}
            className="px-6 py-2 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Waiting room (game not started)
  if (gameState && gameState.status === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={handleGoHome} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">Waiting Room</h1>
          </div>

          {/* Room Code */}
          {roomCode && (
            <div className="bg-gray-900/60 rounded-2xl border border-gray-700/50 p-6 mb-6 text-center">
              <p className="text-gray-400 text-sm mb-2">Room Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-bold text-amber-400 tracking-widest">{roomCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">Share this code with friends to join</p>
            </div>
          )}

          {/* Players */}
          <div className="bg-gray-900/60 rounded-2xl border border-gray-700/50 p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-gray-400" />
              <h2 className="text-white font-semibold">
                Players ({gameState.players.length}/{gameState.max_players})
              </h2>
            </div>
            <PlayerPanel players={gameState.players} currentTurnColor={null} />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {gameState.players.length < gameState.max_players && (
              <button
                onClick={addBot}
                className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 text-white font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Bot size={18} />
                Add Bot
              </button>
            )}
            {gameState.players.length >= 2 && (
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-lg shadow-orange-500/30 hover:from-amber-400 hover:to-orange-400 transition-all"
              >
                Start Game 🎮
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game playing
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900">
      {/* Game Over Modal */}
      {gameOver && gameState && (
        <GameOverModal
          players={gameState.players}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
        />
      )}

      <div className="max-w-7xl mx-auto p-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={handleGoHome} className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock size={14} />
            Turn {gameState?.turn_count || 0}
            {roomCode && (
              <span className="ml-2 bg-gray-800 px-2 py-0.5 rounded text-xs">
                {roomCode}
              </span>
            )}
          </div>
        </div>

        {/* Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Panel - Players */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-700/50 p-4 mb-4">
              <h3 className="text-white font-semibold mb-3">Players</h3>
              {gameState && (
                <PlayerPanel
                  players={gameState.players}
                  currentTurnColor={gameState.current_turn_color}
                />
              )}
            </div>

            {/* Dice */}
            <div className="bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-700/50 p-4 flex justify-center">
              <Dice
                value={diceResult?.value || null}
                isMyTurn={isMyTurn}
                onRoll={rollDice}
                rolling={false}
              />
            </div>
          </div>

          {/* Center - Board */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="aspect-square max-h-[70vh]">
              {gameState && (
                <LudoBoard
                  players={gameState.players}
                  movablePieces={movablePieces}
                  currentTurnColor={gameState.current_turn_color}
                  onMovePiece={handleMovePiece}
                  myColor={myColor}
                />
              )}
            </div>

            {/* Turn indicator */}
            {gameState && (
              <div className="text-center mt-3">
                {isMyTurn ? (
                  <p className="text-amber-400 font-bold animate-pulse">
                    Your Turn! {movablePieces.length > 0 ? "Select a piece to move" : "Roll the dice!"}
                  </p>
                ) : (
                  <p className="text-gray-400">
                    {gameState.players[gameState.current_turn_index]?.display_name}'s turn
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Chat */}
          <div className="lg:col-span-1 order-3">
            <ChatBox
              messages={chatMessages}
              onSend={(msg) => sendChat(msg, user?.display_name || "Player")}
              onEmoji={sendEmoji}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
