"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const fomoMessages = [
  "Sarah from NYC just started a video call!",
  "12 new matches found near you!",
  "Emma is waiting to connect...",
  "3 people viewed your area just now!",
  "New matches are online right now!",
  "Olivia sent a wink your way!",
  "Popular time - 247 people chatting now!",
];

export default function OnlineCounter() {
  const [count, setCount] = useState(1247);
  const [fomo, setFomo] = useState("");
  const [showFomo, setShowFomo] = useState(false);

  useEffect(() => {
    const countInterval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 5) - 2);
    }, 3000);

    const fomoInterval = setInterval(() => {
      const msg = fomoMessages[Math.floor(Math.random() * fomoMessages.length)];
      setFomo(msg);
      setShowFomo(true);
      setTimeout(() => setShowFomo(false), 3000);
    }, 8000);

    return () => {
      clearInterval(countInterval);
      clearInterval(fomoInterval);
    };
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span>
          <strong className="text-green-600">{count.toLocaleString()}</strong> people online now
        </span>
      </div>

      <AnimatePresence>
        {showFomo && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40 bg-white rounded-2xl shadow-2xl border border-pink-100 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm">
                💕
              </div>
              <p className="text-sm text-gray-700 font-medium">{fomo}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
