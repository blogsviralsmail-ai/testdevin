"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import HeartParticles, { createParticles } from "@/components/shared/HeartParticles";
import GreatChoice from "@/components/shared/GreatChoice";

interface GenderSelectProps {
  onSelect: (gender: string) => void;
}

const genderOptions = [
  {
    id: "man",
    label: "I'm a Man",
    emoji: "👨",
    gradient: "from-blue-400 to-indigo-500",
    description: "Looking to meet amazing women",
  },
  {
    id: "woman",
    label: "I'm a Woman",
    emoji: "👩",
    gradient: "from-pink-400 to-rose-500",
    description: "Looking to meet interesting men",
  },
  {
    id: "friends",
    label: "Just Friends",
    emoji: "🤝",
    gradient: "from-amber-400 to-orange-500",
    description: "Looking for meaningful friendships",
  },
];

export default function GenderSelect({ onSelect }: GenderSelectProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showGreat, setShowGreat] = useState(false);
  const [particles, setParticles] = useState<ReturnType<typeof createParticles>>([]);

  const handleSelect = (id: string) => {
    setSelected(id);
    setShowGreat(true);
    setParticles(createParticles());
    setTimeout(() => {
      setShowGreat(false);
      setParticles([]);
      onSelect(id);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50 pt-16">
      <HeartParticles particles={particles} />
      <GreatChoice show={showGreat} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
          <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Who are you?
          </span>
        </h2>
        <p className="text-gray-500 text-lg">Tell us about yourself</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl w-full">
        {genderOptions.map((opt, i) => (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(opt.id)}
            className={`relative p-8 rounded-3xl bg-white border-2 transition-all duration-300 text-center group
              ${selected === opt.id ? "border-pink-400 ring-4 ring-pink-200" : "border-gray-100 hover:border-pink-200"}
              shadow-lg hover:shadow-xl`}
          >
            <div className="text-5xl mb-4">{opt.emoji}</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{opt.label}</h3>
            <p className="text-sm text-gray-400">{opt.description}</p>
            <div
              className={`absolute inset-0 bg-gradient-to-br ${opt.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity`}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
