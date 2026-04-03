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

const COLOR_HEX: Record<string, string> = {
  red: "#E53E3E",
  green: "#38A169",
  yellow: "#D69E2E",
  blue: "#3182CE",
};

export default function PlayerPanel({ players, currentTurnColor }: PlayerPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {players.map((player) => (
        <div
          key={player.color}
          className={`
            flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-300
            ${player.color === currentTurnColor
              ? "bg-blue-800/60 border-2 border-yellow-400/70"
              : "bg-blue-900/40 border border-blue-400/20"
            }
            ${player.has_won ? "opacity-60" : ""}
          `}
        >
          {/* Avatar */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 ${
              player.color === currentTurnColor ? 'border-yellow-400' : 'border-white/30'
            }`}
            style={{ backgroundColor: COLOR_HEX[player.color] || '#888' }}
          >
            {player.is_bot ? "🤖" : player.display_name[0]?.toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white text-sm font-bold truncate" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>
                {player.display_name}
              </span>
              {player.color === currentTurnColor && !player.has_won && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                  PLAYING
                </span>
              )}
              {player.has_won && (
                <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full font-bold">
                  #{player.rank} 🏆
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-blue-200/50 font-bold">
              <span>🏠 {player.pieces_finished}/4</span>
              <span>⚔️ {player.kills}</span>
            </div>
          </div>

          {/* Turn dot */}
          {player.color === currentTurnColor && !player.has_won && (
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: COLOR_HEX[player.color], boxShadow: `0 0 8px ${COLOR_HEX[player.color]}` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
