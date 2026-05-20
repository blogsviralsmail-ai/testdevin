"use client";

import { motion, AnimatePresence } from "framer-motion";

interface GreatChoiceProps {
  show: boolean;
}

export default function GreatChoice({ show }: GreatChoiceProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-2xl">
            Great choice! 💖
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
