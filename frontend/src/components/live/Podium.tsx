"use client";

import { motion } from "framer-motion";
import { Crown, Trophy, Medal } from "lucide-react";

interface PodiumParticipant {
  id: string;
  name: string;
  score: number;
  correctAnswers?: number;
}

interface PodiumProps {
  participants: PodiumParticipant[];
  onClose: () => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Visual order on screen: 2nd (left), 1st (center), 3rd (right).
const SLOTS = [
  {
    rank: 2,
    height: "h-40",
    gradient: "from-slate-300 to-slate-500",
    ring: "ring-slate-300",
    icon: Medal,
    delay: 0.3,
  },
  {
    rank: 1,
    height: "h-56",
    gradient: "from-yellow-300 to-amber-500",
    ring: "ring-yellow-300",
    icon: Crown,
    delay: 0,
  },
  {
    rank: 3,
    height: "h-32",
    gradient: "from-amber-500 to-amber-700",
    ring: "ring-amber-600",
    icon: Trophy,
    delay: 0.5,
  },
];

export default function Podium({ participants, onClose }: PodiumProps) {
  const top3 = [...participants].sort((a, b) => b.score - a.score).slice(0, 3);
  const byRank = (rank: number) => top3[rank - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-b from-[#0b0b14] via-[#120a24] to-[#0b0b14] px-6"
    >
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
          Final Results
        </h1>
        <p className="text-white/50 mt-2">Congratulations to our top performers!</p>
      </motion.div>

      <div className="relative flex items-end justify-center gap-4 md:gap-8">
        {SLOTS.map((slot) => {
          const p = byRank(slot.rank);
          const Icon = slot.icon;
          return (
            <motion.div
              key={slot.rank}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: slot.delay + 0.2, type: "spring", stiffness: 120, damping: 14 }}
              className="flex flex-col items-center w-24 md:w-36"
            >
              {/* Name + avatar on top of the trophy */}
              {p ? (
                <>
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: slot.delay + 0.5, type: "spring", stiffness: 200 }}
                    className={`mb-2 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-gradient-to-br ${slot.gradient} text-black font-black text-lg ring-4 ${slot.ring} shadow-[0_0_30px_rgba(250,204,21,0.4)]`}
                  >
                    {initials(p.name)}
                  </motion.div>
                  <p className="text-white font-bold text-sm md:text-base text-center truncate max-w-full px-1">
                    {p.name}
                  </p>
                  <p className="text-white/50 text-xs mb-2 font-mono">{p.score} pts</p>
                </>
              ) : (
                <p className="text-white/30 text-xs mb-2">—</p>
              )}

              {/* Pillar */}
              <div
                className={`relative w-full ${slot.height} rounded-t-2xl bg-gradient-to-b ${slot.gradient} flex flex-col items-center pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.3)]`}
              >
                <Icon size={28} className="text-black/70" />
                <span className="mt-2 text-4xl md:text-5xl font-black text-black/80">
                  {slot.rank}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        onClick={onClose}
        className="relative mt-12 px-8 py-3 rounded-xl font-bold bg-white text-zinc-900 hover:bg-white/90 transition-colors shadow-lg"
      >
        View Full Results
      </motion.button>
    </motion.div>
  );
}
