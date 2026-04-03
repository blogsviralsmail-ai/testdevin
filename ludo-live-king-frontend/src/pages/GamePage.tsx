import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import LudoBoard from "../components/LudoBoard";
import Dice from "../components/Dice";
import PlayerPanel from "../components/PlayerPanel";
import ChatBox from "../components/ChatBox";
import GameOverModal from "../components/GameOverModal";
import { playTurnSound } from "../utils/sounds";

export default function GamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    gameState, roomCode, diceResult, moveResult, isMyTurn, myColor,
    rollDice, movePiece, addBot, startGame, sendChat, sendEmoji,
    chatMessages, leaveGame, requestBotTurn, gameOver,
    playVsComputer,
  } = useGame();

  const [copied, setCopied] = useState(false);
  const [movablePieces, setMovablePieces] = useState<number[]>([]);
  const [waitingForMatch, setWaitingForMatch] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [opponentDice, setOpponentDice] = useState<{ name: string; value: number; color: string } | null>(null);

  useEffect(() => {
    if (diceResult && diceResult.user_id === user?.id) {
      setMovablePieces(diceResult.movable_pieces);
    } else {
      setMovablePieces([]);
    }
    // Show opponent dice roll prominently
    if (diceResult && diceResult.user_id !== user?.id && gameState) {
      const opponent = gameState.players.find(p => p.user_id === diceResult.user_id);
      if (opponent) {
        setOpponentDice({
          name: opponent.display_name,
          value: diceResult.value,
          color: opponent.color,
        });
        setTimeout(() => setOpponentDice(null), 2500);
      }
    }
  }, [diceResult, user?.id, gameState]);

  useEffect(() => {
    setMovablePieces([]);
  }, [gameState?.current_turn_index]);

  // Play sound when it becomes my turn
  useEffect(() => {
    if (isMyTurn && gameState?.status === "playing") {
      try { playTurnSound(); } catch (_e) { /* ignore */ }
    }
  }, [isMyTurn, gameState?.current_turn_index]);

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
      <div className="min-h-screen ludo-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>Finding Players...</h2>
          <p className="text-blue-200/70 text-sm mb-6">Looking for opponents</p>
          <button
            onClick={handleGoHome}
            className="px-6 py-2.5 btn-golden"
          >
            CANCEL
          </button>
        </div>
      </div>
    );
  }

  // Waiting room
  if (gameState && gameState.status === "waiting") {
    return (
      <div className="min-h-screen ludo-bg p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={handleGoHome} className="w-8 h-8 rounded-lg bg-blue-800 border border-blue-400/30 flex items-center justify-center text-white hover:bg-blue-700">
              ←
            </button>
            <h1 className="text-lg font-bold text-white" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>WAITING ROOM</h1>
          </div>

          {/* Room Code */}
          {roomCode && (
            <div className="game-card p-5 mb-4 text-center">
              <p className="text-blue-200/70 text-sm mb-1 font-bold">ROOM CODE</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-bold text-yellow-400 tracking-widest" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>{roomCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="w-8 h-8 rounded-lg bg-yellow-500 border-2 border-yellow-300 flex items-center justify-center text-blue-900 font-bold hover:bg-yellow-400"
                >
                  {copied ? "✓" : "📋"}
                </button>
              </div>
              <p className="text-blue-200/40 text-xs mt-1">Share with friends to join</p>
            </div>
          )}

          {/* Players */}
          <div className="game-card p-4 mb-4">
            <p className="text-white font-bold mb-3" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
              👥 PLAYERS ({gameState.players.length}/{gameState.max_players})
            </p>
            <PlayerPanel players={gameState.players} currentTurnColor={null} />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {gameState.players.length < gameState.max_players && (
              <button
                onClick={addBot}
                className="w-full py-3 rounded-xl bg-blue-800 border-2 border-blue-400/50 text-white font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}
              >
                🤖 ADD BOT
              </button>
            )}
            {gameState.players.length >= 2 && (
              <button
                onClick={startGame}
                className="w-full py-3.5 btn-golden text-lg"
              >
                🎮 START GAME
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game playing - mobile-first portrait layout like Ludo King
  return (
    <div className="min-h-screen ludo-bg">
      {/* Game Over Modal */}
      {gameOver && gameState && (
        <GameOverModal
          players={gameState.players}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
        />
      )}

      <div className="max-w-md mx-auto px-2 py-2 relative">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={handleGoHome} className="w-8 h-8 rounded-lg bg-blue-800/80 border border-blue-400/30 flex items-center justify-center text-white text-sm hover:bg-blue-700">
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-blue-200/60 text-xs font-bold">Turn {gameState?.turn_count || 0}</span>
            {roomCode && (
              <span className="bg-blue-900/60 px-2 py-0.5 rounded text-xs text-yellow-400 font-bold border border-yellow-500/30">
                {roomCode}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-8 h-8 rounded-lg bg-blue-800/80 border border-blue-400/30 flex items-center justify-center text-sm"
          >
            💬
          </button>
        </div>

        {/* Player avatars - top row (Green & Yellow) */}
        {gameState && (
          <div className="flex justify-between mb-1 px-1">
            {gameState.players.filter(p => p.color === "green" || p.color === "red").map(player => (
              <div key={player.color} className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 ${
                  player.color === gameState.current_turn_color ? 'border-yellow-400 glow-pulse' : 'border-white/30'
                }`} style={{ backgroundColor: player.color === "red" ? "#E53E3E" : "#38A169" }}>
                  {player.is_bot ? "🤖" : player.display_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-xs font-bold truncate max-w-[60px]" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>{player.display_name}</p>
                  <p className="text-blue-200/50 text-[10px]">🏠{player.pieces_finished}/4</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Board */}
        <div className="relative">
          {gameState && (
            <LudoBoard
              players={gameState.players}
              movablePieces={movablePieces}
              currentTurnColor={gameState.current_turn_color}
              onMovePiece={handleMovePiece}
              myColor={myColor}
              lastMoveResult={moveResult ? {
                player: moveResult.player,
                piece_index: moveResult.piece_index,
                from_position: moveResult.from_position,
                to_position: moveResult.to_position,
              } : null}
            />
          )}
        </div>

        {/* Player avatars - bottom row (Blue & Yellow) */}
        {gameState && (
          <div className="flex justify-between mt-1 px-1">
            {gameState.players.filter(p => p.color === "blue" || p.color === "yellow").map(player => (
              <div key={player.color} className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 ${
                  player.color === gameState.current_turn_color ? 'border-yellow-400 glow-pulse' : 'border-white/30'
                }`} style={{ backgroundColor: player.color === "blue" ? "#3182CE" : "#D69E2E" }}>
                  {player.is_bot ? "🤖" : player.display_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-xs font-bold truncate max-w-[60px]" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>{player.display_name}</p>
                  <p className="text-blue-200/50 text-[10px]">🏠{player.pieces_finished}/4</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Opponent dice roll display */}
        {opponentDice && (
          <div className="flex justify-center mb-2 animate-bounce">
            <div className="px-4 py-2 rounded-xl border-2 flex items-center gap-3 shadow-lg" style={{
              backgroundColor: opponentDice.color === 'red' ? '#E53E3E' : opponentDice.color === 'green' ? '#38A169' : opponentDice.color === 'yellow' ? '#D69E2E' : '#3182CE',
              borderColor: '#FFD700',
            }}>
              <span className="text-white font-bold text-sm" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                {opponentDice.name}
              </span>
              <span className="text-yellow-300 font-bold text-xl" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
                rolled {opponentDice.value}
              </span>
              <span className="text-3xl">
                {opponentDice.value === 6 ? '🎯' : '🎲'}
              </span>
            </div>
          </div>
        )}

        {/* Dice + Turn indicator */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <Dice
            value={diceResult?.value || null}
            isMyTurn={isMyTurn}
            onRoll={rollDice}
            rolling={false}
          />
          {gameState && (
            <div className="text-center">
              {isMyTurn ? (
                <p className="text-yellow-300 font-bold text-sm animate-pulse" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                  {movablePieces.length > 0 ? "SELECT A PIECE!" : "YOUR TURN!"}
                </p>
              ) : (
                <p className="text-blue-200/60 text-sm font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                  {gameState.players[gameState.current_turn_index]?.display_name}'s turn
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat overlay */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="w-full max-w-md">
            <button
              onClick={() => setShowChat(false)}
              className="w-full py-2 text-center text-white bg-blue-900/80 rounded-t-xl font-bold text-sm"
            >
              ✕ Close Chat
            </button>
            <ChatBox
              messages={chatMessages}
              onSend={(msg) => sendChat(msg, user?.display_name || "Player")}
              onEmoji={sendEmoji}
            />
          </div>
        </div>
      )}
    </div>
  );
}
