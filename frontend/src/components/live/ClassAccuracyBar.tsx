"use client";

import { motion } from "framer-motion";

interface ClassAccuracyBarProps {
  totalParticipants: number;
  correctCount: number;
  wrongCount: number;
}

export default function ClassAccuracyBar({
  totalParticipants,
  correctCount,
  wrongCount,
}: ClassAccuracyBarProps) {
  const answeredCount = correctCount + wrongCount;
  const accuracy = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100);
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-white/80 font-medium">Class Accuracy</h3>
        <span className="font-bold text-2xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          {accuracy}%
        </span>
      </div>
      
      <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden flex relative">
        <motion.div 
          className="h-full bg-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${answeredCount === 0 ? 0 : (correctCount / answeredCount) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
        <motion.div 
          className="h-full bg-red-500"
          initial={{ width: 0 }}
          animate={{ width: `${answeredCount === 0 ? 0 : (wrongCount / answeredCount) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex justify-between text-xs text-white/50 px-1">
        <span>{correctCount} Correct</span>
        <span>{answeredCount} / {totalParticipants} Answered</span>
        <span>{wrongCount} Wrong</span>
      </div>
    </div>
  );
}
