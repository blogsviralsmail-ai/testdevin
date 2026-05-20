"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import HeartParticles, { createParticles } from "@/components/shared/HeartParticles";
import GreatChoice from "@/components/shared/GreatChoice";

interface ConnectionTypeProps {
  onSelect: (type: string) => void;
}

const connectionOptions = [
  {
    id: "casual",
    label: "Casual Chat",
    emoji: "💬",
    description: "Light-hearted conversations with no pressure",
    color: "from-green-400 to-teal-500",
  },
  {
    id: "deep",
    label: "Deep Talks",
    emoji: "🧠",
    description: "Meaningful connections and real conversations",
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: "romantic",
    label: "Romantic Video Dates",
    emoji: "💕",
    description: "Find that special someone for video dates",
    color: "from-pink-400 to-rose-500",
  },
  {
    id: "longterm",
    label: "Long-term Connection",
    emoji: "💍",
    description: "Looking for something serious and lasting",
    color: "from-purple-400 to-violet-500",
  },
];

export default function ConnectionType({ onSelect }: ConnectionTypeProps) {
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-16">
      <HeartParticles particles={particles} />
      <GreatChoice show={showGreat} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
          <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            What are you looking for?
          </span>
        </h2>
        <p className="text-gray-500 text-lg">Choose your connection style</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl w-full">
        {connectionOptions.map((opt, i) => (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(opt.id)}
            className={`relative p-6 rounded-2xl bg-white border-2 transition-all text-left group overflow-hidden
              ${selected === opt.id ? "border-pink-400 ring-4 ring-pink-200" : "border-gray-100 hover:border-pink-200"}
              shadow-lg hover:shadow-xl`}
          >
            <div className="text-4xl mb-3">{opt.emoji}</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{opt.label}</h3>
            <p className="text-sm text-gray-400">{opt.description}</p>
            <div
              className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${opt.color} opacity-10 rounded-bl-full`}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
