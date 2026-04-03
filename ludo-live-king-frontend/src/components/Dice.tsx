import { useState, useEffect } from "react";

interface DiceProps {
  value: number | null;
  isMyTurn: boolean;
  onRoll: () => void;
  rolling?: boolean;
}

// Classic dice dots layout
function DiceDots({ val }: { val: number }) {
  const dotSize = 6;
  const positions: Record<number, [number, number][]> = {
    1: [[25, 25]],
    2: [[12, 12], [38, 38]],
    3: [[12, 12], [25, 25], [38, 38]],
    4: [[12, 12], [38, 12], [12, 38], [38, 38]],
    5: [[12, 12], [38, 12], [25, 25], [12, 38], [38, 38]],
    6: [[12, 12], [38, 12], [12, 25], [38, 25], [12, 38], [38, 38]],
  };
  const dots = positions[val] || positions[1];
  return (
    <svg viewBox="0 0 50 50" className="w-full h-full">
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={dotSize} fill="#333" />
      ))}
    </svg>
  );
}

export default function Dice({ value, isMyTurn, onRoll, rolling: externalRolling }: DiceProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number>(1);

  useEffect(() => {
    if (externalRolling) {
      setIsRolling(true);
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 80);
      setTimeout(() => {
        clearInterval(interval);
        setIsRolling(false);
        if (value) setDisplayValue(value);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [externalRolling, value]);

  useEffect(() => {
    if (value && !isRolling) {
      setDisplayValue(value);
    }
  }, [value, isRolling]);

  const handleRoll = () => {
    if (!isMyTurn || isRolling) return;
    setIsRolling(true);
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 80);
    setTimeout(() => {
      clearInterval(interval);
      setIsRolling(false);
      onRoll();
    }, 500);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleRoll}
        disabled={!isMyTurn || isRolling}
        className={`
          w-16 h-16 rounded-xl flex items-center justify-center p-2
          transition-all duration-200 transform
          ${isRolling ? "animate-bounce scale-110" : ""}
          ${isMyTurn && !isRolling
            ? "bg-white shadow-lg shadow-yellow-500/50 hover:scale-110 cursor-pointer active:scale-95 border-3 border-yellow-400 glow-pulse"
            : "bg-gray-300 cursor-not-allowed opacity-60 border-2 border-gray-400"
          }
        `}
        style={{ borderWidth: '3px' }}
      >
        <div className={isRolling ? "animate-spin" : ""}>
          <DiceDots val={displayValue} />
        </div>
      </button>
      {isMyTurn && !isRolling && !value && (
        <p className="text-yellow-300 text-xs font-bold animate-pulse uppercase" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
          Tap to Roll!
        </p>
      )}
      {value && !isRolling && (
        <p className="text-white text-xs font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
          Rolled: <span className="text-yellow-300 text-lg">{value}</span>
        </p>
      )}
    </div>
  );
}
