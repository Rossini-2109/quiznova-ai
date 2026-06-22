"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, Medal, Trophy, UserMinus, Users, Flame } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  employeeId: string;
  score: number;
  rank: number;
  correctAnswers?: number;
  isConnected: boolean;
}

interface LeaderboardTableProps {
  participants: Participant[];
  totalQuestions?: number;
  onKick?: (studentName: string) => void;
}

const AVATAR_GRADIENTS = [
  "from-purple-500 to-indigo-500",
  "from-pink-500 to-rose-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-purple-500",
];

// Bar colour per leaderboard position (matches the neon Wayground look).
function barColor(rank: number): string {
  if (rank === 1) return "from-cyan-400 to-sky-500";
  if (rank === 2) return "from-amber-300 to-yellow-500";
  if (rank === 3) return "from-pink-400 to-rose-500";
  return "from-indigo-400 to-violet-500";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_18px_rgba(245,158,11,0.5)]">
        <Crown size={18} className="text-yellow-900" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center shadow-[0_0_14px_rgba(203,213,225,0.4)]">
        <Medal size={18} className="text-slate-700" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-[0_0_14px_rgba(180,83,9,0.4)]">
        <Trophy size={16} className="text-amber-100" />
      </div>
    );
  return (
    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-white/60">
      {rank}
    </div>
  );
}

export default function LeaderboardTable({
  participants,
  totalQuestions = 0,
  onKick,
}: LeaderboardTableProps) {
  const connected = participants.filter((p) => p.isConnected).length;
  const maxScore = Math.max(1, ...participants.map((p) => p.score));

  return (
    <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/[0.06] to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
            <Users size={18} />
          </span>
          <div>
            <h3 className="text-white font-semibold leading-tight">
              {connected} participant{connected === 1 ? "" : "s"}
            </h3>
            <span className="text-xs text-white/45">Ranked by score, live</span>
          </div>
        </div>
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-[2.5rem_1fr_4rem] items-center gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-white/35 border-b border-white/5">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">Score</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12">
            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
              <Users size={26} />
            </div>
            <p className="text-white/50 font-medium">Waiting for participants...</p>
            <p className="text-white/30 text-xs">Players appear here the moment they join.</p>
          </div>
        ) : (
          <motion.div layout className="flex flex-col gap-2">
            <AnimatePresence>
              {participants.map((p) => {
                const correct = p.correctAnswers ?? 0;
                const barPct = Math.max(8, Math.round((p.score / maxScore) * 100));
                return (
                  <motion.div
                    layout
                    key={p.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className={`group grid grid-cols-[2.5rem_1fr_4rem_auto] items-center gap-3 rounded-xl border p-3 transition-colors ${
                      p.rank <= 3
                        ? "border-white/15 bg-white/[0.06]"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <RankBadge rank={p.rank} />

                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div
                          className={`relative h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br ${avatarGradient(
                            p.name
                          )} flex items-center justify-center text-xs font-bold text-white`}
                        >
                          {initials(p.name)}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#15151c] ${
                              p.isConnected ? "bg-emerald-500" : "bg-red-500"
                            }`}
                            title={p.isConnected ? "Connected" : "Disconnected"}
                          />
                        </div>
                        <p className="truncate font-semibold text-white text-sm">
                          {p.name}
                        </p>
                      </div>
                      {/* Score-proportional bar with correct-answer count */}
                      <div className="mt-2 h-5 w-full rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${barColor(
                            p.rank
                          )} flex items-center justify-end pr-2`}
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-black/70 whitespace-nowrap">
                            <Flame size={10} /> {correct}
                            {totalQuestions > 0 ? `/${totalQuestions}` : ""}
                          </span>
                        </motion.div>
                      </div>
                    </div>

                    <span className="text-right font-mono text-base font-bold text-white tabular-nums">
                      {p.score}
                    </span>

                    {onKick && (
                      <button
                        onClick={() => onKick(p.name)}
                        title="Remove participant"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 border border-red-500/20"
                      >
                        <UserMinus size={13} />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
