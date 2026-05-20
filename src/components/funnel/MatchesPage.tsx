"use client";

import { motion } from "framer-motion";
import { profileCards } from "@/data/profiles";
import { Heart, Video, Shield, Star } from "lucide-react";
import Image from "next/image";

interface MatchesPageProps {
  onSelect: (profileId: string) => void;
  onUnlockAll: () => void;
}

export default function MatchesPage({ onSelect, onUnlockAll }: MatchesPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pt-16 pb-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 max-w-lg mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full px-5 py-2 shadow-lg mb-4"
        >
          <Heart className="w-4 h-4 fill-white" />
          <span className="font-bold text-sm">Your Top Matches Are Ready!</span>
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-2">
          <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            We Found Your Matches
          </span>
        </h2>
        <p className="text-gray-500">Based on your preferences, these people are perfect for you</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {profileCards.map((profile, i) => (
          <motion.button
            key={profile.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -5 }}
            onClick={() => onSelect(profile.id)}
            className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow text-left group border border-gray-100"
          >
            {/* Image */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={profile.image}
                alt={profile.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Match badge */}
              <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                {profile.matchPercent}% Match
              </div>

              {/* Online indicator */}
              {profile.online && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Online
                </div>
              )}

              {/* Verified */}
              {profile.verified && (
                <div className="absolute bottom-12 right-2">
                  <Shield className="w-5 h-5 text-blue-400 fill-blue-400 drop-shadow-md" />
                </div>
              )}

              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-bold text-base">
                  {profile.name}, {profile.age}
                </h3>
                <p className="text-white/80 text-xs">{profile.location}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className={`w-3 h-3 ${j < 4 ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                  />
                ))}
              </div>
              <Video className="w-4 h-4 text-pink-400" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Unlock All */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-pink-100 p-4 z-40"
      >
        <div className="max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUnlockAll}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-bold text-lg shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5 fill-white" />
            Unlock All Matches
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
