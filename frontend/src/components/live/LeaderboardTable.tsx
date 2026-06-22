"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, Medal, Trophy, UserMinus, Users, CheckCircle2 } from "lucide-react";

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

  return (
    <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/[0.06] to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
            <Trophy size={18} />
          </span>
          <div>
            <h3 className="text-white font-semibold leading-tight">Live Leaderboard</h3>
            <span className="flex items-center gap-1 text-xs text-white/45">
              <Users size={12} /> {connected} participant{connected === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-white/35 border-b border-white/5">
        <span>Rank</span>
        <span>Player</span>
        <span>Score</span>
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
                const pct =
                  totalQuestions > 0
                    ? Math.min(100, Math.round((correct / totalQuestions) * 100))
                    : 0;
                return (
                  <motion.div
                    layout
                    key={p.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className={`group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border p-3 transition-colors ${
                      p.rank <= 3
                        ? "border-white/15 bg-white/[0.06]"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <RankBadge rank={p.rank} />

                    <div className="min-w-0 flex items-center gap-3">
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
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white text-sm">{p.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                          </div>
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-300/80 whitespace-nowrap">
                            <CheckCircle2 size={11} /> {correct}
                            {totalQuestions > 0 ? `/${totalQuestions}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-purple-200 tabular-nums">
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
                    </div>
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
