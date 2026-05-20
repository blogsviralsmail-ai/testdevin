"use client";

import { motion } from "framer-motion";
import { profileCards } from "@/data/profiles";
import { Heart, Video, Shield, MapPin, Clock, Star, Coins, Sparkles } from "lucide-react";
import Image from "next/image";

interface FinalProfileProps {
  profileId: string;
}

export default function FinalProfile({ profileId }: FinalProfileProps) {
  const profile = profileCards.find((p) => p.id === profileId) || profileCards[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pt-16 pb-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Profile Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl mb-6"
        >
          <div className="relative aspect-[3/4]">
            <Image
              src={profile.image}
              alt={profile.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Top badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                {profile.matchPercent}% Match
              </div>
              {profile.online && (
                <div className="flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Online Now
                </div>
              )}
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white text-3xl font-extrabold">
                  {profile.name}, {profile.age}
                </h2>
                {profile.verified && (
                  <Shield className="w-6 h-6 text-blue-400 fill-blue-400" />
                )}
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{profile.location}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-pink-50 mb-4"
        >
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            About {profile.name}
          </h3>
          <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
        </motion.div>

        {/* Interests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-pink-50 mb-4"
        >
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 px-4 py-1.5 rounded-full text-sm font-medium border border-pink-100"
              >
                {interest}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Rating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-pink-50 mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Rating
              </h3>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className={`w-5 h-5 ${j < 4 ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                  />
                ))}
                <span className="text-sm text-gray-500 ml-2">4.8 (126 reviews)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                Avg. 45 min calls
              </div>
            </div>
          </div>
        </motion.div>

        {/* Credit System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 shadow-lg border border-amber-100 mb-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Coins className="w-6 h-6 text-amber-500" />
            <div>
              <h3 className="font-bold text-gray-800">Credit System</h3>
              <p className="text-sm text-gray-500">First 2 minutes FREE!</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { coins: 50, price: "$4.99", popular: false },
              { coins: 150, price: "$9.99", popular: true },
              { coins: 500, price: "$24.99", popular: false },
            ].map((pkg) => (
              <button
                key={pkg.coins}
                className={`relative p-3 rounded-xl text-center transition-all ${
                  pkg.popular
                    ? "bg-gradient-to-b from-pink-500 to-purple-600 text-white shadow-lg scale-105"
                    : "bg-white border border-gray-200 text-gray-800 hover:border-pink-300"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-xs font-bold px-2 py-0.5 rounded-full text-white">
                    BEST
                  </span>
                )}
                <div className="text-2xl mb-1">🪙</div>
                <div className="font-bold text-sm">{pkg.coins} Coins</div>
                <div className={`text-xs ${pkg.popular ? "text-white/80" : "text-gray-400"}`}>
                  {pkg.price}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            {profile.pricePerMinute} coins per minute with {profile.name}
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="sticky bottom-4"
        >
          <button className="w-full py-5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-bold text-lg shadow-2xl shadow-pink-500/40 flex items-center justify-center gap-3 hover:shadow-pink-500/60 transition-shadow">
            <Video className="w-6 h-6" />
            Start Private Video Chat Now
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            Free 2-minute trial included
          </p>
        </motion.div>
      </div>
    </div>
  );
}
