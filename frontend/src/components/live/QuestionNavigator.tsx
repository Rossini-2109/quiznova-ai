"use client";

import { motion } from "framer-motion";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  onJumpToQuestion: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function QuestionNavigator({
  totalQuestions,
  currentIndex,
  onJumpToQuestion,
  onNext,
  onPrevious,
}: QuestionNavigatorProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white/80 font-medium">Question Navigator</h3>
        <span className="text-purple-400 font-bold">
          {currentIndex + 1} / {totalQuestions}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {Array.from({ length: totalQuestions }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onJumpToQuestion(idx)}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
              idx === currentIndex
                ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0f0f13]"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
          className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
}
