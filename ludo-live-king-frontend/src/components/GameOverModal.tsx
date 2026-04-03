interface PlayerResult {
  color: string;
  display_name: string;
  rank: number | null;
  kills: number;
  pieces_finished: number;
  has_won: boolean;
}

interface GameOverModalProps {
  players: PlayerResult[];
  onPlayAgain: () => void;
  onGoHome: () => void;
}

const COLOR_HEX: Record<string, string> = {
  red: "#E53E3E",
  green: "#38A169",
  yellow: "#D69E2E",
  blue: "#3182CE",
};

export default function GameOverModal({ players, onPlayAgain, onGoHome }: GameOverModalProps) {
  const sorted = [...players].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const winner = sorted[0];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="game-card max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${COLOR_HEX[winner?.color || "red"]}cc, ${COLOR_HEX[winner?.color || "red"]}99)` }}>
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-2xl font-bold text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>GAME OVER!</h2>
          <p className="text-white/90 mt-1 font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
            {winner?.display_name} wins! 🎉
          </p>
        </div>

        {/* Results */}
        <div className="p-4 space-y-2">
          {sorted.map((player, index) => (
            <div
              key={player.color}
              className={`flex items-center gap-3 p-2.5 rounded-xl ${
                index === 0
                  ? "bg-yellow-500/10 border-2 border-yellow-400/40"
                  : "bg-blue-900/30 border border-blue-400/10"
              }`}
            >
              <span className="text-xl font-bold w-8 text-center">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white/30"
                style={{ backgroundColor: COLOR_HEX[player.color] }}
              >
                <span className="text-white text-xs font-bold">{player.color[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-bold" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>{player.display_name}</p>
                <p className="text-blue-200/50 text-xs font-bold">
                  🏠 {player.pieces_finished}/4 · ⚔️ {player.kills}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3">
          <button
            onClick={onGoHome}
            className="flex-1 py-3 rounded-xl bg-blue-800 border-2 border-blue-400/50 text-white font-bold hover:bg-blue-700 transition-colors"
            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}
          >
            🏠 HOME
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 btn-golden"
          >
            🔄 PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}
