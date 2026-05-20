"use client";

import { motion, AnimatePresence } from "framer-motion";

interface HeartParticlesProps {
  particles: Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    rotation: number;
  }>;
}

export function createParticles(): HeartParticlesProps["particles"] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: Date.now() + i,
    x: Math.random() * 200 - 100,
    y: -(Math.random() * 150 + 50),
    size: Math.random() * 16 + 10,
    delay: Math.random() * 0.2,
    rotation: Math.random() * 360,
  }));
}

export default function HeartParticles({ particles }: HeartParticlesProps) {
  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="fixed pointer-events-none z-50 select-none"
          style={{
            left: "50%",
            top: "50%",
            fontSize: `${p.size}px`,
          }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: 0,
            x: p.x,
            y: p.y,
            scale: 1.5,
            rotate: p.rotation,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, delay: p.delay, ease: "easeOut" }}
        >
          💗
        </motion.span>
      ))}
    </AnimatePresence>
  );
}
