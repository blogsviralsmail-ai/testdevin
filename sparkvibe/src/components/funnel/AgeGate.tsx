"use client";

import { motion } from "framer-motion";
import { Heart, Shield, Video } from "lucide-react";

interface AgeGateProps {
  onSelect: () => void;
}

export default function AgeGate({ onSelect }: AgeGateProps) {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1920&q=80')] bg-cover bg-center opacity-10" />

      {/* Floating hearts */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-pink-300 text-2xl pointer-events-none"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.3, 0.7, 0.3],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          💗
        </motion.div>
      ))}

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg border border-pink-100">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              SparkVibe
            </span>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight"
        >
          <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">
            Find Your Spark
          </span>
          <br />
          <span className="text-gray-800">Through Video Chat</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-8 text-lg"
        >
          Connect with real people through live video calls. Your perfect match is just a click away.
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          {[
            { icon: Video, label: "HD Video Calls" },
            { icon: Shield, label: "100% Safe" },
            { icon: Heart, label: "Real Matches" },
          ].map((feat) => (
            <div
              key={feat.label}
              className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-600"
            >
              <feat.icon className="w-4 h-4 text-pink-500" />
              {feat.label}
            </div>
          ))}
        </motion.div>

        {/* Age Gate */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-pink-100"
        >
          <p className="text-gray-700 font-semibold mb-2 text-lg">
            Are you 18 or older?
          </p>
          <p className="text-gray-400 text-sm mb-6">
            You must be 18+ to use SparkVibe
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSelect}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-shadow"
          >
            Yes, I&apos;m 18+ — Let&apos;s Go! 🔥
          </motion.button>

          <p className="text-xs text-gray-400 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
