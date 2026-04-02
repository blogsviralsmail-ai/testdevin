import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Board positions mapping - converts game position to 3D coordinates
const BOARD_SIZE = 15;
const CELL_SIZE = 0.65;
const HALF = (BOARD_SIZE - 1) / 2;

// Color definitions
const COLORS: Record<string, string> = {
  red: "#E53E3E",
  green: "#38A169",
  yellow: "#D69E2E",
  blue: "#3182CE",
};

const LIGHT_COLORS: Record<string, string> = {
  red: "#FED7D7",
  green: "#C6F6D5",
  yellow: "#FEFCBF",
  blue: "#BEE3F8",
};

// Path coordinates for each position on the main track (0-51)
function getMainTrackPosition(pos: number): [number, number, number] {
  // Map positions to grid coordinates based on standard Ludo board
  const positions: [number, number][] = [];

  // Bottom arm going up (positions 0-5) - Red's path
  for (let i = 0; i < 6; i++) positions.push([6, 14 - i]);
  // Left turn (6)
  positions.push([6, 8]);
  // Left arm going left (7-12)
  for (let i = 0; i < 6; i++) positions.push([5 - i, 8]);
  // Top-left corner (13)
  positions.push([0, 7]);
  // Top arm going right (14-18) - Green's path
  for (let i = 0; i < 5; i++) positions.push([0 + i, 6]);
  positions.push([5, 6]);
  // Turn down (19)
  positions.push([6, 6]);
  // Top going up (20-25)
  for (let i = 0; i < 6; i++) positions.push([6, 5 - i]);
  // Top-right corner (26)
  positions.push([7, 0]);
  // Right arm going down (27-31) - Yellow's path
  for (let i = 0; i < 5; i++) positions.push([8, 0 + i]);
  positions.push([8, 5]);
  // Turn right (32)
  positions.push([8, 6]);
  // Right arm going right (33-38)
  for (let i = 0; i < 6; i++) positions.push([9 + i, 6]);
  // Bottom-right corner (39)
  positions.push([14, 7]);
  // Bottom arm going left (40-44) - Blue's path
  for (let i = 0; i < 5; i++) positions.push([14 - i, 8]);
  positions.push([9, 8]);
  // Turn up (45)
  positions.push([8, 8]);
  // Bottom going down (46-51)
  for (let i = 0; i < 6; i++) positions.push([8, 9 + i]);

  if (pos >= 0 && pos < positions.length) {
    const [row, col] = positions[pos];
    return [(col - HALF) * CELL_SIZE, 0.3, (row - HALF) * CELL_SIZE];
  }
  return [0, 0.3, 0];
}

// Home column positions (52-57) for each color
function getHomeColumnPosition(pos: number, color: string): [number, number, number] {
  const homeIdx = pos - 52;
  const homePositions: Record<string, [number, number][]> = {
    red: Array.from({ length: 6 }, (_, i) => [7, 13 - i] as [number, number]),
    green: Array.from({ length: 6 }, (_, i) => [1 + i, 7] as [number, number]),
    yellow: Array.from({ length: 6 }, (_, i) => [7, 1 + i] as [number, number]),
    blue: Array.from({ length: 6 }, (_, i) => [13 - i, 7] as [number, number]),
  };
  const positions = homePositions[color];
  if (positions && homeIdx >= 0 && homeIdx < positions.length) {
    const [row, col] = positions[homeIdx];
    return [(col - HALF) * CELL_SIZE, 0.3, (row - HALF) * CELL_SIZE];
  }
  return [0, 0.5, 0];
}

// Home yard positions for pieces not yet on the board
function getHomeYardPosition(color: string, pieceIndex: number): [number, number, number] {
  const offsets: [number, number][] = [
    [-0.4, -0.4],
    [0.4, -0.4],
    [-0.4, 0.4],
    [0.4, 0.4],
  ];
  const centers: Record<string, [number, number]> = {
    red: [2.5, 11.5],
    green: [2.5, 2.5],
    yellow: [11.5, 2.5],
    blue: [11.5, 11.5],
  };
  const center = centers[color] || [7, 7];
  const offset = offsets[pieceIndex] || [0, 0];
  return [
    (center[1] + offset[0] * 2 - HALF) * CELL_SIZE,
    0.4,
    (center[0] + offset[1] * 2 - HALF) * CELL_SIZE,
  ];
}

interface PieceProps {
  color: string;
  position: [number, number, number];
  isMovable: boolean;
  onClick: () => void;
  pieceIndex: number;
}

function GamePiece({ color, position, isMovable, onClick, pieceIndex }: PieceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseColor = COLORS[color] || "#888";

  useFrame((state) => {
    if (meshRef.current) {
      if (isMovable) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3 + pieceIndex) * 0.1;
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.05);
      } else {
        meshRef.current.position.y = position[1];
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          if (isMovable) onClick();
        }}
        castShadow
        receiveShadow
      >
        {/* Piece body - cone shape like classic Ludo */}
        <coneGeometry args={[0.18, 0.5, 16]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.3}
          metalness={0.6}
          emissive={isMovable ? baseColor : "#000"}
          emissiveIntensity={isMovable ? 0.3 : 0}
        />
      </mesh>
      {/* Piece top sphere */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={baseColor} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Glow ring for movable pieces */}
      {isMovable && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.28, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

function BoardSquare({ position, color, isSafe }: { position: [number, number, number]; color?: string; isSafe?: boolean }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={[CELL_SIZE * 0.9, 0.08, CELL_SIZE * 0.9]} />
      <meshStandardMaterial
        color={color || "#F7FAFC"}
        roughness={0.8}
        metalness={0.1}
      />
      {isSafe && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[CELL_SIZE * 0.25, 6]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.5} />
        </mesh>
      )}
    </mesh>
  );
}

function HomeYard({ color, center }: { color: string; center: [number, number, number] }) {
  return (
    <RoundedBox args={[CELL_SIZE * 5.5, 0.15, CELL_SIZE * 5.5]} position={center} radius={0.2} receiveShadow>
      <meshStandardMaterial color={LIGHT_COLORS[color]} roughness={0.9} metalness={0.05} />
    </RoundedBox>
  );
}

function CenterTriangle({ color, rotation }: { color: string; rotation: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const size = CELL_SIZE * 2;
    s.moveTo(0, 0);
    s.lineTo(size, 0);
    s.lineTo(size / 2, size);
    s.closePath();
    return s;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, rotation]} position={[0, 0.12, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={COLORS[color]} roughness={0.5} metalness={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

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

function BoardScene({ players, movablePieces, currentTurnColor, onMovePiece, myColor }: LudoBoardProps) {
  const safePositions = new Set([1, 9, 14, 22, 27, 35, 40, 48]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow shadow-mapSize={2048} />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />
      <pointLight position={[0, 8, 0]} intensity={0.5} color="#FFF5E6" />

      {/* Board base */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[CELL_SIZE * 16, 0.2, CELL_SIZE * 16]} />
        <meshStandardMaterial color="#F0E6D3" roughness={0.9} />
      </mesh>

      {/* Board border */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[CELL_SIZE * 16.2, 0.15, CELL_SIZE * 16.2]} />
        <meshStandardMaterial color="#8B4513" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[CELL_SIZE * 15.8, 0.16, CELL_SIZE * 15.8]} />
        <meshStandardMaterial color="#F0E6D3" roughness={0.9} />
      </mesh>

      {/* Home yards */}
      <HomeYard color="red" center={[(2.5 - HALF) * CELL_SIZE, 0.08, (11.5 - HALF) * CELL_SIZE]} />
      <HomeYard color="green" center={[(2.5 - HALF) * CELL_SIZE, 0.08, (2.5 - HALF) * CELL_SIZE]} />
      <HomeYard color="yellow" center={[(11.5 - HALF) * CELL_SIZE, 0.08, (2.5 - HALF) * CELL_SIZE]} />
      <HomeYard color="blue" center={[(11.5 - HALF) * CELL_SIZE, 0.08, (11.5 - HALF) * CELL_SIZE]} />

      {/* Center home triangle */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[CELL_SIZE * 3, 0.12, CELL_SIZE * 3]} />
        <meshStandardMaterial color="#F7FAFC" roughness={0.8} />
      </mesh>
      <CenterTriangle color="red" rotation={0} />
      <CenterTriangle color="green" rotation={Math.PI / 2} />
      <CenterTriangle color="yellow" rotation={Math.PI} />
      <CenterTriangle color="blue" rotation={-Math.PI / 2} />

      {/* Main track squares */}
      {Array.from({ length: 52 }, (_, i) => {
        const pos = getMainTrackPosition(i);
        let color: string | undefined;
        if (i === 1) color = LIGHT_COLORS.red;
        else if (i === 14) color = LIGHT_COLORS.green;
        else if (i === 27) color = LIGHT_COLORS.yellow;
        else if (i === 40) color = LIGHT_COLORS.blue;
        return (
          <BoardSquare
            key={`track-${i}`}
            position={pos}
            color={color}
            isSafe={safePositions.has(i)}
          />
        );
      })}

      {/* Home column squares */}
      {(["red", "green", "yellow", "blue"] as const).map((color) =>
        Array.from({ length: 6 }, (_, i) => {
          const pos = getHomeColumnPosition(52 + i, color);
          return (
            <BoardSquare
              key={`home-${color}-${i}`}
              position={pos}
              color={COLORS[color]}
            />
          );
        })
      )}

      {/* Game pieces */}
      {players.map((player) =>
        player.pieces.map((piece, pieceIdx) => {
          let position: [number, number, number];
          if (piece.position === -1) {
            position = getHomeYardPosition(player.color, pieceIdx);
          } else if (piece.position === 57) {
            position = [0, 0.5, 0]; // Finished - at center
          } else if (piece.position >= 52) {
            position = getHomeColumnPosition(piece.position, player.color);
          } else {
            position = getMainTrackPosition(piece.position);
          }

          const isMovable =
            player.color === myColor &&
            player.color === currentTurnColor &&
            movablePieces.includes(pieceIdx);

          return (
            <GamePiece
              key={`piece-${player.color}-${pieceIdx}`}
              color={player.color}
              position={position}
              isMovable={isMovable}
              onClick={() => onMovePiece(pieceIdx)}
              pieceIndex={pieceIdx}
            />
          );
        })
      )}

      {/* Brand text */}
      <Text
        position={[0, 0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        color="#8B4513"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        LLK
      </Text>

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function LudoBoard(props: LudoBoardProps) {
  return (
    <div className="w-full h-full min-h-96 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)" }}>
      <Canvas
        shadows
        camera={{ position: [0, 12, 8], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#1a1a2e"]} />
        <fog attach="fog" args={["#1a1a2e", 15, 30]} />
        <BoardScene {...props} />
      </Canvas>
    </div>
  );
}
