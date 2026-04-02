interface PlayerInfo {
  color: string;
  display_name: string;
  pieces_finished: number;
  kills: number;
  has_won: boolean;
  is_bot: boolean;
  rank: number | null;
}

interface PlayerPanelProps {
  players: PlayerInfo[];
  currentTurnColor: string | null;
}

const COLORS: Record<string, string> = {
  red: "bg-red-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  blue: "bg-blue-500",
};

const BORDER_COLORS: Record<string, string> = {
  red: "border-red-500",
  green: "border-green-500",
  yellow: "border-yellow-500",
  blue: "border-blue-500",
};

const AVATARS = ["🦁", "🐯", "🦊", "🐻", "🐼", "🐨", "🐸", "🐵", "🐰", "🐶"];

export default function PlayerPanel({ players, currentTurnColor }: PlayerPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {players.map((player) => (
        <div
          key={player.color}
          className={`
            flex items-center gap-3 p-3 rounded-xl transition-all duration-300
            ${player.color === currentTurnColor
              ? `bg-gray-800/80 border-2 ${BORDER_COLORS[player.color]} shadow-lg`
              : "bg-gray-800/40 border border-gray-700/50"
            }
            ${player.has_won ? "opacity-70" : ""}
          `}
        >
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full ${COLORS[player.color]} flex items-center justify-center text-xl shadow-md`}>
            {player.is_bot ? "🤖" : AVATARS[player.display_name.length % AVATARS.length]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold truncate">
                {player.display_name}
              </span>
              {player.color === currentTurnColor && !player.has_won && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full animate-pulse">
                  Playing
                </span>
              )}
              {player.has_won && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  #{player.rank} 🏆
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>🏠 {player.pieces_finished}/4</span>
              <span>⚔️ {player.kills}</span>
            </div>
          </div>

          {/* Turn indicator */}
          {player.color === currentTurnColor && !player.has_won && (
            <div className={`w-3 h-3 rounded-full ${COLORS[player.color]} animate-pulse shadow-lg`} />
          )}
        </div>
      ))}
    </div>
  );
}
