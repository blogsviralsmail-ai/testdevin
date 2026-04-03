// Classic 2D SVG Ludo Board - Ludo King style

// Home column position offsets per color (must match backend HOME_COLUMN_OFFSET)
const HOME_COLUMN_OFFSET: Record<string, number> = {
  red: 100,
  green: 200,
  yellow: 300,
  blue: 400,
};

const PIECE_FINISHED = 999;

const COLORS: Record<string, string> = {
  red: "#E53E3E",
  green: "#38A169",
  yellow: "#D69E2E",
  blue: "#3182CE",
};

const BRIGHT_COLORS: Record<string, string> = {
  red: "#ff4444",
  green: "#44bb44",
  yellow: "#ffcc00",
  blue: "#4488ff",
};

const LIGHT_COLORS: Record<string, string> = {
  red: "#ffcccc",
  green: "#ccffcc",
  yellow: "#ffffcc",
  blue: "#ccddff",
};

// Lookup table for track positions
const CELL_POSITIONS: Record<number, [number, number]> = {};
// Bottom arm (Red start area) - column 6, going up
(() => {
  // Pos 0-4: col=6, row=14..10 (but row 9-14 visible)
  // Standard ludo: 52 positions around the outer track
  // Using standard layout:
  // Red starts bottom-left, goes up
  const positions: [number, number][] = [];
  // Bottom vertical strip (col 6, going up from row 14 to row 9)
  for (let i = 0; i < 6; i++) positions.push([6, 14 - i]); // 0-5: (6,14)..(6,9)
  // Left horizontal strip (row 8, going left from col 6 to col 0) 
  for (let i = 0; i < 6; i++) positions.push([5 - i, 8]); // 6-11: (5,8)..(0,8)
  // Top-left turn
  positions.push([0, 7]); // 12
  // Top vertical strip going up (col 0..5, row 6)  
  // Actually let me think about this more carefully
  // Standard Ludo 15x15 grid:
  //   Columns 0-5: left arm
  //   Column 6: left center
  //   Column 7: center
  //   Column 8: right center
  //   Columns 9-14: right arm
  //   Rows 0-5: top arm
  //   Row 6: top center
  //   Row 7: center
  //   Row 8: bottom center
  //   Rows 9-14: bottom arm

  // Track goes: Start at (6,13) [Red start], go UP to (6,9), 
  // turn LEFT (5,8)..(0,8), turn UP (0,7), go DOWN on top (0,6)..(5,6),
  // turn RIGHT (6,5)..(6,0), turn DOWN (7,0), go RIGHT (8,0)..(8,5),
  // turn DOWN (9,6)..(14,6), turn DOWN (14,7), go LEFT (14,8)..(9,8),
  // turn UP (8,9)..(8,14)

  // Let me just hardcode the standard 52 positions
  positions.length = 0;
  
  // Segment 1: Bottom-left arm going UP (col 6)
  positions.push([6, 13]); // 0 - not start square, just first track pos
  positions.push([6, 12]); // 1 - RED START
  positions.push([6, 11]); // 2
  positions.push([6, 10]); // 3
  positions.push([6, 9]);  // 4
  // Segment 2: Turn left at row 8
  positions.push([5, 8]);  // 5
  positions.push([4, 8]);  // 6
  positions.push([3, 8]);  // 7
  positions.push([2, 8]);  // 8
  positions.push([1, 8]);  // 9 - SAFE
  positions.push([0, 8]);  // 10
  // Segment 3: Turn up at col 0
  positions.push([0, 7]);  // 11
  positions.push([0, 6]);  // 12
  // Segment 4: Top-left arm going RIGHT (row 6)
  positions.push([1, 6]);  // 13
  positions.push([2, 6]);  // 14 - GREEN START
  positions.push([3, 6]);  // 15
  positions.push([4, 6]);  // 16
  positions.push([5, 6]);  // 17
  // Segment 5: Turn up at col 6
  positions.push([6, 5]);  // 18
  positions.push([6, 4]);  // 19
  positions.push([6, 3]);  // 20
  positions.push([6, 2]);  // 21
  positions.push([6, 1]);  // 22 - SAFE
  positions.push([6, 0]);  // 23
  // Segment 6: Turn right at row 0
  positions.push([7, 0]);  // 24
  positions.push([8, 0]);  // 25
  // Segment 7: Top-right arm going DOWN (col 8)
  positions.push([8, 1]);  // 26
  positions.push([8, 2]);  // 27 - YELLOW START
  positions.push([8, 3]);  // 28
  positions.push([8, 4]);  // 29
  positions.push([8, 5]);  // 30
  // Segment 8: Turn right at row 6
  positions.push([9, 6]);  // 31
  positions.push([10, 6]); // 32
  positions.push([11, 6]); // 33
  positions.push([12, 6]); // 34
  positions.push([13, 6]); // 35 - SAFE
  positions.push([14, 6]); // 36
  // Segment 9: Turn down at col 14
  positions.push([14, 7]); // 37
  positions.push([14, 8]); // 38
  // Segment 10: Bottom-right arm going LEFT (row 8)
  positions.push([13, 8]); // 39
  positions.push([12, 8]); // 40 - BLUE START
  positions.push([11, 8]); // 41
  positions.push([10, 8]); // 42
  positions.push([9, 8]);  // 43
  // Segment 11: Turn down at col 8
  positions.push([8, 9]);  // 44
  positions.push([8, 10]); // 45
  positions.push([8, 11]); // 46
  positions.push([8, 12]); // 47
  positions.push([8, 13]); // 48 - SAFE
  positions.push([8, 14]); // 49
  // Segment 12: Turn left at row 14
  positions.push([7, 14]); // 50
  positions.push([6, 14]); // 51

  for (let i = 0; i < positions.length; i++) {
    CELL_POSITIONS[i + 1] = positions[i]; // positions are 1-indexed in game
  }
})();

// Home column positions for each color (6 cells leading to center)
const HOME_COLUMNS: Record<string, [number, number][]> = {
  red: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

// Home yard piece positions (4 pieces in each corner)
const HOME_YARD_PIECES: Record<string, [number, number][]> = {
  red: [[1.8, 10.8], [4.2, 10.8], [1.8, 13.2], [4.2, 13.2]],
  green: [[1.8, 1.8], [4.2, 1.8], [1.8, 4.2], [4.2, 4.2]],
  yellow: [[10.8, 1.8], [13.2, 1.8], [10.8, 4.2], [13.2, 4.2]],
  blue: [[10.8, 10.8], [13.2, 10.8], [10.8, 13.2], [13.2, 13.2]],
};

// Safe positions (star squares)
const SAFE_POSITIONS = new Set([1, 9, 14, 22, 27, 35, 40, 48]);

// Color start positions
const COLOR_START: Record<string, number> = { red: 1, green: 14, yellow: 27, blue: 40 };

interface LudoBoardProps {
  players: Array<{
    color: string;
    pieces: Array<{ position: number; is_safe: boolean }>;
  }>;
  movablePieces: number[];
  currentTurnColor: string | null;
  onMovePiece: (pieceIndex: number) => void;
  myColor: string | null;
}

export default function LudoBoard({ players, movablePieces, currentTurnColor, onMovePiece, myColor }: LudoBoardProps) {
  const S = 400; // SVG size
  const C = S / 15; // Cell size
  
  const toSvg = (col: number, row: number): [number, number] => [col * C, row * C];

  // Get pixel position for a game position
  const getPiecePos = (position: number, color: string, pieceIdx: number): [number, number] => {
    if (position === -1) {
      // Home yard
      const yard = HOME_YARD_PIECES[color];
      if (yard && yard[pieceIdx]) {
        return toSvg(yard[pieceIdx][0], yard[pieceIdx][1]);
      }
      return toSvg(7, 7);
    }
    if (position === PIECE_FINISHED) {
      return toSvg(7.5, 7.5);
    }
    const colorOffset = HOME_COLUMN_OFFSET[color] || 100;
    if (position >= colorOffset && position < colorOffset + 6) {
      const homeIdx = position - colorOffset;
      const homeCol = HOME_COLUMNS[color];
      if (homeCol && homeCol[homeIdx]) {
        return toSvg(homeCol[homeIdx][0] + 0.5, homeCol[homeIdx][1] + 0.5);
      }
      return toSvg(7.5, 7.5);
    }
    if (position >= 1 && position <= 52) {
      const cellPos = CELL_POSITIONS[position];
      if (cellPos) {
        return toSvg(cellPos[0] + 0.5, cellPos[1] + 0.5);
      }
    }
    return toSvg(7.5, 7.5);
  };

  return (
    <div className="w-full aspect-square max-w-lg mx-auto">
      <svg viewBox={`0 0 ${S} ${S}`} className="w-full h-full drop-shadow-2xl rounded-lg">
        {/* Board background */}
        <rect x="0" y="0" width={S} height={S} rx="8" fill="#f5f0e1" stroke="#8B4513" strokeWidth="4"/>
        
        {/* Home yards (colored corners) */}
        <rect x={C * 0} y={C * 0} width={C * 6} height={C * 6} rx="6" fill={COLORS.red}/>
        <rect x={C * 9} y={C * 0} width={C * 6} height={C * 6} rx="6" fill={COLORS.green}/>
        <rect x={C * 0} y={C * 9} width={C * 6} height={C * 6} rx="6" fill={COLORS.blue}/>
        <rect x={C * 9} y={C * 9} width={C * 6} height={C * 6} rx="6" fill={COLORS.yellow}/>
        
        {/* Inner white boxes in home yards */}
        <rect x={C * 0.7} y={C * 0.7} width={C * 4.6} height={C * 4.6} rx="4" fill="white"/>
        <rect x={C * 9.7} y={C * 0.7} width={C * 4.6} height={C * 4.6} rx="4" fill="white"/>
        <rect x={C * 0.7} y={C * 9.7} width={C * 4.6} height={C * 4.6} rx="4" fill="white"/>
        <rect x={C * 9.7} y={C * 9.7} width={C * 4.6} height={C * 4.6} rx="4" fill="white"/>

        {/* Track cells - draw grid lines for the cross-shaped path */}
        {/* Vertical strips */}
        {[6, 7, 8].map(col => 
          Array.from({ length: 15 }, (_, row) => {
            if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null; // center
            if (col === 6 && row < 6) return null; // top-left yard area
            if (col === 8 && row < 6) return null;
            if (col === 6 && row > 8) return null;
            if (col === 8 && row > 8) return null;
            return (
              <rect
                key={`v-${col}-${row}`}
                x={col * C}
                y={row * C}
                width={C}
                height={C}
                fill="white"
                stroke="#ddd"
                strokeWidth="0.5"
              />
            );
          })
        )}
        {/* Horizontal strips */}
        {[6, 7, 8].map(row =>
          Array.from({ length: 15 }, (_, col) => {
            if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null; // center
            if (col < 6 && row === 6) return null;
            if (col < 6 && row === 8) return null;
            if (col > 8 && row === 6) return null;
            if (col > 8 && row === 8) return null;
            return (
              <rect
                key={`h-${col}-${row}`}
                x={col * C}
                y={row * C}
                width={C}
                height={C}
                fill="white"
                stroke="#ddd"
                strokeWidth="0.5"
              />
            );
          })
        )}

        {/* Home columns (colored paths to center) */}
        {(["red", "green", "yellow", "blue"] as const).map(color =>
          HOME_COLUMNS[color].map((pos, i) => (
            <rect
              key={`hc-${color}-${i}`}
              x={pos[0] * C}
              y={pos[1] * C}
              width={C}
              height={C}
              fill={LIGHT_COLORS[color]}
              stroke={COLORS[color]}
              strokeWidth="0.5"
            />
          ))
        )}

        {/* Color start squares */}
        {Object.entries(COLOR_START).map(([color, pos]) => {
          const cellPos = CELL_POSITIONS[pos];
          if (!cellPos) return null;
          return (
            <rect
              key={`start-${color}`}
              x={cellPos[0] * C}
              y={cellPos[1] * C}
              width={C}
              height={C}
              fill={LIGHT_COLORS[color]}
              stroke={COLORS[color]}
              strokeWidth="1"
            />
          );
        })}

        {/* Safe position stars */}
        {Array.from(SAFE_POSITIONS).map(pos => {
          const cellPos = CELL_POSITIONS[pos];
          if (!cellPos) return null;
          const cx = cellPos[0] * C + C / 2;
          const cy = cellPos[1] * C + C / 2;
          return (
            <text
              key={`safe-${pos}`}
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={C * 0.6}
              opacity="0.4"
            >
              ★
            </text>
          );
        })}

        {/* Center home (4 colored triangles) */}
        <polygon points={`${7*C},${6*C} ${8*C},${6*C} ${7.5*C},${7.5*C}`} fill={COLORS.green} stroke="white" strokeWidth="1"/>
        <polygon points={`${8*C},${7*C} ${8*C},${8*C} ${7.5*C},${7.5*C}`} fill={COLORS.yellow} stroke="white" strokeWidth="1"/>
        <polygon points={`${7*C},${9*C} ${8*C},${9*C} ${7.5*C},${7.5*C}`} fill={COLORS.blue} stroke="white" strokeWidth="1"/>
        <polygon points={`${7*C},${7*C} ${7*C},${8*C} ${7.5*C},${7.5*C}`} fill={COLORS.red} stroke="white" strokeWidth="1"/>
        {/* Fix triangles to fill center */}
        <polygon points={`${6*C},${6*C} ${9*C},${6*C} ${7.5*C},${7.5*C}`} fill={COLORS.green} stroke="white" strokeWidth="1"/>
        <polygon points={`${9*C},${6*C} ${9*C},${9*C} ${7.5*C},${7.5*C}`} fill={COLORS.yellow} stroke="white" strokeWidth="1"/>
        <polygon points={`${6*C},${9*C} ${9*C},${9*C} ${7.5*C},${7.5*C}`} fill={COLORS.blue} stroke="white" strokeWidth="1"/>
        <polygon points={`${6*C},${6*C} ${6*C},${9*C} ${7.5*C},${7.5*C}`} fill={COLORS.red} stroke="white" strokeWidth="1"/>

        {/* Home yard piece circles (background) */}
        {(["red", "green", "yellow", "blue"] as const).map(color =>
          HOME_YARD_PIECES[color].map((pos, i) => (
            <circle
              key={`yard-bg-${color}-${i}`}
              cx={pos[0] * C}
              cy={pos[1] * C}
              r={C * 0.45}
              fill="white"
              stroke={COLORS[color]}
              strokeWidth="2"
              opacity="0.3"
            />
          ))
        )}

        {/* Game pieces */}
        {players.map((player) =>
          player.pieces.map((piece, pieceIdx) => {
            const [px, py] = getPiecePos(piece.position, player.color, pieceIdx);
            const isMovable =
              player.color === myColor &&
              player.color === currentTurnColor &&
              movablePieces.includes(pieceIdx);

            return (
              <g
                key={`piece-${player.color}-${pieceIdx}`}
                onClick={() => isMovable && onMovePiece(pieceIdx)}
                style={{ cursor: isMovable ? "pointer" : "default" }}
              >
                {/* Glow ring for movable */}
                {isMovable && (
                  <circle
                    cx={px}
                    cy={py}
                    r={C * 0.55}
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="3"
                    opacity="0.8"
                  >
                    <animate attributeName="r" values={`${C*0.45};${C*0.6};${C*0.45}`} dur="1s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite"/>
                  </circle>
                )}
                {/* Piece shadow */}
                <circle
                  cx={px + 1}
                  cy={py + 2}
                  r={C * 0.38}
                  fill="rgba(0,0,0,0.2)"
                />
                {/* Piece body */}
                <circle
                  cx={px}
                  cy={py}
                  r={C * 0.38}
                  fill={BRIGHT_COLORS[player.color] || COLORS[player.color]}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Piece highlight */}
                <circle
                  cx={px - 2}
                  cy={py - 3}
                  r={C * 0.15}
                  fill="rgba(255,255,255,0.4)"
                />
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
