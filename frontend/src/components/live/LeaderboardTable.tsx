"use client";

import { motion } from "framer-motion";

interface Participant {
  id: string;
  name: string;
  employeeId: string;
  score: number;
  rank: number;
  isConnected: boolean;
}

interface LeaderboardTableProps {
  participants: Participant[];
}

export default function LeaderboardTable({ participants }: LeaderboardTableProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-white/10 bg-white/5">
        <h3 className="text-white/80 font-medium">Live Leaderboard</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-white/40 text-xs uppercase tracking-wider">
              <th className="p-3 font-medium">Rank</th>
              <th className="p-3 font-medium">Student Name</th>
              <th className="p-3 font-medium text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-white/40">
                  Waiting for participants...
                </td>
              </tr>
            ) : (
              participants.map((p, idx) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={p.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="p-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      p.rank === 1 ? 'bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/50' :
                      p.rank === 2 ? 'bg-slate-300/20 text-slate-300 ring-1 ring-slate-300/50' :
                      p.rank === 3 ? 'bg-amber-700/20 text-amber-600 ring-1 ring-amber-700/50' :
                      'bg-white/5 text-white/60'
                    }`}>
                      {p.rank}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="text-white font-medium flex items-center gap-2">
                        {p.name}
                        {!p.isConnected && (
                          <span className="w-2 h-2 rounded-full bg-red-500" title="Disconnected"></span>
                        )}
                        {p.isConnected && (
                          <span className="w-2 h-2 rounded-full bg-green-500" title="Connected"></span>
                        )}
                      </span>
                      <span className="text-white/40 text-xs">{p.employeeId}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-mono text-purple-300 font-bold">{p.score}</span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
