import { Trophy, Home, RotateCcw } from "lucide-react";

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

const COLOR_BG: Record<string, string> = {
  red: "from-red-600 to-red-800",
  green: "from-green-600 to-green-800",
  yellow: "from-yellow-500 to-yellow-700",
  blue: "from-blue-600 to-blue-800",
};

export default function GameOverModal({ players, onPlayAgain, onGoHome }: GameOverModalProps) {
  const sorted = [...players].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const winner = sorted[0];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${COLOR_BG[winner?.color || "red"]} p-6 text-center`}>
          <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 drop-shadow-lg" />
          <h2 className="text-2xl font-bold text-white">Game Over!</h2>
          <p className="text-white/80 mt-1">
            {winner?.display_name} wins! 🎉
          </p>
        </div>

        {/* Results */}
        <div className="p-4 space-y-2">
          {sorted.map((player, index) => (
            <div
              key={player.color}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                index === 0
                  ? "bg-amber-500/10 border border-amber-500/30"
                  : "bg-gray-800/50"
              }`}
            >
              <span className="text-2xl font-bold text-gray-400 w-8 text-center">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
              </span>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${COLOR_BG[player.color]} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{player.color[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">{player.display_name}</p>
                <p className="text-gray-400 text-xs">
                  {player.pieces_finished}/4 home · {player.kills} kills
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3">
          <button
            onClick={onGoHome}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
          >
            <Home size={18} />
            Home
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold transition-colors"
          >
            <RotateCcw size={18} />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
