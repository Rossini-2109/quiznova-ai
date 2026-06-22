"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface LiveHostHeaderProps {
  sessionCode: string;
  isPaused: boolean;
  onPauseToggle: () => void;
  onEndQuiz: () => void;
}

export default function LiveHostHeader({
  sessionCode,
  isPaused,
  onPauseToggle,
  onEndQuiz,
}: LiveHostHeaderProps) {
  // Determine the base URL for students to join. Fallback to window.location.origin if env var missing.
  const baseUrl = typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    : "";
  const joinUrl = `${baseUrl}/student/quiz/join/${sessionCode}`;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          QuizNova AI
        </h1>
        <span className="text-white/60 text-sm hidden md:inline">
          Live Host Dashboard
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/50 uppercase tracking-wider">
            Join at
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black tracking-widest text-white" title={joinUrl}>
              {joinUrl}
            </span>
            <button
              onClick={copyToClipboard}
              className="px-2 py-1 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
              title="Copy join URL"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onPauseToggle}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            isPaused
              ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50"
              : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/50"
          }`}
        >
          {isPaused ? "Resume Session" : "Pause Session"}
        </button>
        <button
          onClick={onEndQuiz}
          className="px-6 py-2 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
        >
          End Quiz
        </button>
      </div>
    </header>
  );
}
