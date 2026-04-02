import { useState, useEffect } from "react";

interface DiceProps {
  value: number | null;
  isMyTurn: boolean;
  onRoll: () => void;
  rolling?: boolean;
}

const diceFaces: Record<number, string> = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

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
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleRoll}
        disabled={!isMyTurn || isRolling}
        className={`
          w-20 h-20 rounded-xl flex items-center justify-center text-5xl
          transition-all duration-200 transform
          ${isRolling ? "animate-bounce scale-110" : ""}
          ${isMyTurn && !isRolling
            ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/50 hover:scale-110 cursor-pointer active:scale-95"
            : "bg-gray-700 cursor-not-allowed opacity-60"
          }
        `}
      >
        <span className={`${isRolling ? "animate-spin" : ""} drop-shadow-lg`}>
          {diceFaces[displayValue] || "⚀"}
        </span>
      </button>
      {isMyTurn && !isRolling && !value && (
        <p className="text-amber-400 text-sm font-semibold animate-pulse">
          Tap to Roll!
        </p>
      )}
      {value && !isRolling && (
        <p className="text-white text-sm font-medium">
          Rolled: <span className="text-amber-400 font-bold text-lg">{value}</span>
        </p>
      )}
    </div>
  );
}
