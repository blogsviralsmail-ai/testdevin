"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Shield, Star, Eye } from "lucide-react";
import { profileCards as defaultProfiles } from "@/data/profiles";
import { ProfileCard } from "@/types";
import Image from "next/image";

export default function AdminProfiles() {
  const [profiles, setProfiles] = useState<ProfileCard[]>(defaultProfiles);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const deleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const addProfile = () => {
    if (!newName.trim()) return;
    const newP: ProfileCard = {
      id: `p${Date.now()}`,
      name: newName,
      age: parseInt(newAge) || 22,
      location: newLocation || "Unknown",
      bio: newBio || "New profile",
      image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
      matchPercent: Math.floor(Math.random() * 15) + 85,
      online: true,
      verified: false,
      interests: ["New"],
      pricePerMinute: parseInt(newPrice) || 5,
    };
    setProfiles((prev) => [...prev, newP]);
    setNewName("");
    setNewAge("");
    setNewLocation("");
    setNewBio("");
    setNewPrice("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Profiles / Models</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage model profiles, photos, and pricing
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-shadow text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Profile
        </button>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="font-bold text-gray-800 mb-4">New Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
            <input
              type="number"
              placeholder="Age"
              value={newAge}
              onChange={(e) => setNewAge(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
            <input
              type="text"
              placeholder="Location"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
            <input
              type="number"
              placeholder="Price per min (coins)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
            />
            <textarea
              placeholder="Bio..."
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
              rows={2}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addProfile}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600"
            >
              Save Profile
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {profiles.map((profile, i) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={profile.image}
                alt={profile.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm">
                    {profile.name}, {profile.age}
                  </span>
                  {profile.verified && (
                    <Shield className="w-4 h-4 text-blue-400 fill-blue-400" />
                  )}
                </div>
                <span className="text-xs text-white/70">{profile.location}</span>
              </div>
              {profile.online && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  Online
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className={`w-3 h-3 ${j < 4 ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  {profile.pricePerMinute} coins/min
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{profile.bio}</p>
              <div className="flex gap-1.5">
                <button className="flex-1 flex items-center justify-center gap-1 bg-pink-50 text-pink-600 py-2 rounded-lg text-xs font-medium hover:bg-pink-100 transition-colors">
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => deleteProfile(profile.id)}
                  className="flex items-center justify-center bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
