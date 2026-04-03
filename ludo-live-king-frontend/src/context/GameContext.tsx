import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getSocket, onSocketChange } from "../utils/socket";
import { playDiceRollSound, playPieceMoveSound, playCaptureSound, playWinSound, playSixRolledSound, playPieceOutSound, playFinishSound } from "../utils/sounds";

interface Piece {
  color: string;
  index: number;
  position: number;
  steps_taken: number;
  is_safe: boolean;
}

interface Player {
  user_id: number;
  color: string;
  position_index: number;
  display_name: string;
  is_bot: boolean;
  pieces: Piece[];
  pieces_finished: number;
  kills: number;
  has_won: boolean;
  rank: number | null;
  consecutive_sixes: number;
}

interface GameState {
  room_code: string;
  game_mode: string;
  max_players: number;
  status: string;
  players: Player[];
  current_turn_index: number;
  current_turn_color: string | null;
  current_turn_user_id: number | null;
  dice_value: number | null;
  turn_count: number;
  last_action: Record<string, unknown> | null;
  timer_seconds: number;
}

interface DiceResult {
  type: string;
  player: string;
  user_id: number;
  value: number;
  three_sixes: boolean;
  movable_pieces: number[];
}

interface MoveResult {
  type: string;
  player: string;
  user_id: number;
  piece_index: number;
  dice_value: number;
  from_position: number;
  to_position: number | null;
  captured: { player: string; piece_index: number } | null;
  finished: boolean;
  won: boolean;
  extra_turn: boolean;
  game_over?: boolean;
}

interface ChatMessage {
  user_id: number;
  display_name: string;
  message: string;
  timestamp?: number;
}

interface GameContextType {
  gameState: GameState | null;
  roomCode: string | null;
  diceResult: DiceResult | null;
  moveResult: MoveResult | null;
  chatMessages: ChatMessage[];
  isInGame: boolean;
  isMyTurn: boolean;
  myColor: string | null;
  createRoom: (gameMode: string, maxPlayers: number, displayName: string) => void;
  joinRoom: (roomCode: string, displayName: string) => void;
  startGame: () => void;
  rollDice: () => void;
  movePiece: (pieceIndex: number) => void;
  addBot: () => void;
  sendChat: (message: string, displayName: string) => void;
  sendEmoji: (emoji: string) => void;
  playVsComputer: (displayName: string, numBots: number, gameMode: string) => void;
  requestBotTurn: () => void;
  joinMatchmaking: (gameMode: string, displayName: string, maxPlayers: number) => void;
  leaveMatchmaking: () => void;
  leaveGame: () => void;
  winner: Player | null;
  gameOver: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
  const [moveResult, setMoveResult] = useState<MoveResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [gameOver, setGameOver] = useState(false);

  // Subscribe to socket events, and re-subscribe when socket is reconnected (e.g. after login)
  useEffect(() => {
    function setupListeners() {
      const socket = getSocket();

      socket.on("room_created", (data: { room_code: string; game_state: GameState }) => {
        setRoomCode(data.room_code);
        setGameState(data.game_state);
      });

      socket.on("player_joined", (data: { game_state: GameState }) => {
        setGameState(data.game_state);
      });

      socket.on("player_left", (data: { game_state: GameState }) => {
        setGameState(data.game_state);
      });

      socket.on("game_started", (data: { room_code?: string; game_state: GameState }) => {
        if (data.room_code) setRoomCode(data.room_code);
        setGameState(data.game_state);
        setGameOver(false);
        setWinner(null);
      });

      socket.on("dice_rolled", (data: { result: DiceResult; game_state: GameState }) => {
        setDiceResult(data.result);
        setGameState(data.game_state);
        // Sound effects
        try {
          playDiceRollSound();
          if (data.result.value === 6) {
            setTimeout(() => playSixRolledSound(), 400);
          }
        } catch (e) { /* ignore audio errors */ }
      });

      socket.on("piece_moved", (data: { result: MoveResult; game_state: GameState }) => {
        setMoveResult(data.result);
        setGameState(data.game_state);
        // Sound effects
        try {
          if (data.result.captured) {
            playCaptureSound();
          } else if (data.result.finished) {
            playFinishSound();
          } else if (data.result.from_position === -1) {
            playPieceOutSound();
          } else {
            playPieceMoveSound();
          }
        } catch (e) { /* ignore audio errors */ }
      });

      socket.on("game_over", (data: { winner: Player; game_state: GameState }) => {
        setWinner(data.winner);
        setGameOver(true);
        setGameState(data.game_state);
        // Victory sound
        try { playWinSound(); } catch (e) { /* ignore */ }
      });

      socket.on("match_found", (data: { room_code: string; game_state: GameState }) => {
        setRoomCode(data.room_code);
        setGameState(data.game_state);
      });

      socket.on("chat_message", (data: ChatMessage) => {
        setChatMessages((prev) => [...prev.slice(-50), { ...data, timestamp: Date.now() }]);
      });

      socket.on("error", (data: { message: string }) => {
        console.error("Socket error:", data.message);
      });
    }

    setupListeners();

    // Re-subscribe when socket is reconnected (after login/guest login)
    const unsubscribe = onSocketChange(() => {
      setupListeners();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const userId = parseInt(localStorage.getItem("userId") || "0");

  const isInGame = !!gameState && gameState.status === "playing";
  const myColor = gameState?.players.find((p) => p.user_id === userId)?.color || null;
  const isMyTurn = gameState?.current_turn_user_id === userId;

  const createRoom = useCallback((gameMode: string, maxPlayers: number, displayName: string) => {
    getSocket().emit("create_room", { game_mode: gameMode, max_players: maxPlayers, display_name: displayName });
  }, []);

  const joinRoom = useCallback((code: string, displayName: string) => {
    getSocket().emit("join_room", { room_code: code, display_name: displayName });
  }, []);

  const startGame = useCallback(() => {
    getSocket().emit("start_game", {});
  }, []);

  const rollDice = useCallback(() => {
    getSocket().emit("roll_dice", {});
  }, []);

  const movePiece = useCallback((pieceIndex: number) => {
    getSocket().emit("move_piece", { piece_index: pieceIndex });
  }, []);

  const addBot = useCallback(() => {
    getSocket().emit("add_bot", {});
  }, []);

  const sendChat = useCallback((message: string, displayName: string) => {
    getSocket().emit("chat_message", { message, display_name: displayName });
  }, []);

  const sendEmoji = useCallback((emoji: string) => {
    getSocket().emit("emoji_reaction", { emoji });
  }, []);

  const playVsComputer = useCallback((displayName: string, numBots: number, gameMode: string) => {
    getSocket().emit("play_vs_computer", { display_name: displayName, num_bots: numBots, game_mode: gameMode });
  }, []);

  const requestBotTurn = useCallback(() => {
    getSocket().emit("bot_turn", {});
  }, []);

  const joinMatchmaking = useCallback((gameMode: string, displayName: string, maxPlayers: number) => {
    getSocket().emit("join_matchmaking", { game_mode: gameMode, display_name: displayName, max_players: maxPlayers });
  }, []);

  const leaveMatchmaking = useCallback(() => {
    getSocket().emit("leave_matchmaking", {});
  }, []);

  const leaveGame = useCallback(() => {
    setGameState(null);
    setRoomCode(null);
    setDiceResult(null);
    setMoveResult(null);
    setChatMessages([]);
    setWinner(null);
    setGameOver(false);
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        roomCode,
        diceResult,
        moveResult,
        chatMessages,
        isInGame,
        isMyTurn,
        myColor,
        createRoom,
        joinRoom,
        startGame,
        rollDice,
        movePiece,
        addBot,
        sendChat,
        sendEmoji,
        playVsComputer,
        requestBotTurn,
        joinMatchmaking,
        leaveMatchmaking,
        leaveGame,
        winner,
        gameOver,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}
