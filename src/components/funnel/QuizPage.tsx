"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { QuizQuestion } from "@/types";
import HeartParticles, { createParticles } from "@/components/shared/HeartParticles";
import GreatChoice from "@/components/shared/GreatChoice";

interface QuizPageProps {
  question: QuizQuestion;
  onSelect: (questionId: string, answerId: string) => void;
  questionNumber: number;
}

export default function QuizPage({ question, onSelect, questionNumber }: QuizPageProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showGreat, setShowGreat] = useState(false);
  const [particles, setParticles] = useState<ReturnType<typeof createParticles>>([]);

  const handleSelect = (optionId: string) => {
    setSelected(optionId);
    setShowGreat(true);
    setParticles(createParticles());
    setTimeout(() => {
      setShowGreat(false);
      setParticles([]);
      onSelect(question.id, optionId);
    }, 400);
  };

  const bgGradients = [
    "from-rose-50 via-white to-pink-50",
    "from-purple-50 via-white to-rose-50",
    "from-amber-50 via-white to-pink-50",
    "from-pink-50 via-white to-violet-50",
    "from-indigo-50 via-white to-pink-50",
  ];

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br ${bgGradients[questionNumber % bgGradients.length]} pt-16`}
    >
      <HeartParticles particles={particles} />
      <GreatChoice show={showGreat} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm border border-pink-100 mb-4">
          <span className="text-pink-500 font-semibold text-sm">Question {questionNumber}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
          <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {question.title}
          </span>
        </h2>
        {question.subtitle && (
          <p className="text-gray-500 text-lg">{question.subtitle}</p>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
        {question.options.map((opt, i) => (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(opt.id)}
            className={`relative p-5 rounded-2xl bg-white border-2 transition-all text-left group overflow-hidden
              ${selected === opt.id ? "border-pink-400 ring-4 ring-pink-200 bg-pink-50" : "border-gray-100 hover:border-pink-200"}
              shadow-md hover:shadow-lg`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">{opt.emoji}</span>
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-0.5">{opt.label}</h3>
                {opt.description && (
                  <p className="text-sm text-gray-400 leading-snug">{opt.description}</p>
                )}
              </div>
            </div>
            {selected === opt.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center"
              >
                <span className="text-white text-xs">✓</span>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
