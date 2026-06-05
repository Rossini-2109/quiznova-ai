"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { BookOpen, Award, Zap, Percent, Trophy, ChevronRight, Compass } from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get("/attempts/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Stats error", err));
  }, []);

  if (!stats) {
    return <div className="p-8 text-center text-zinc-400">Loading student metrics...</div>;
  }

  // Calculate dynamic level based on total quizzes taken
  const level = Math.floor(stats.attempts / 3) + 1;
  const xp = stats.attempts * 50;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-violet-950 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
            Student Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
            Welcome back! Review your performance metrics and climb the leaderboard
          </p>
        </div>

        <Link
          href="/student/join"
          className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 transition-all text-sm cursor-pointer"
        >
          <Compass size={16} />
          Join New Quiz
        </Link>
      </div>

      {/* Gamification Level Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-6 shadow-xl shadow-violet-500/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
        <div className="space-y-2 flex-1 text-center md:text-left">
          <div className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 uppercase tracking-widest">
            Level {level} Explorer
          </div>
          <h2 className="text-2xl font-black">Your Learning Streak is Active!</h2>
          <p className="text-violet-100 text-xs">
            Complete {3 - (stats.attempts % 3)} more quizzes to level up your Profile Badge. Keep it up!
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 min-w-[200px] justify-around">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-violet-200">Current XP</p>
            <p className="text-xl font-black mt-0.5">{xp} XP</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-violet-200">Daily Streak</p>
            <p className="text-xl font-black mt-0.5 flex items-center gap-1">
              <Zap size={16} className="fill-amber-400 text-amber-400" />
              {stats.attempts > 0 ? 3 : 0} days
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Total Quizzes</p>
            <p className="text-2xl font-black mt-0.5">{stats.totalQuizzes}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Percent size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Avg Score</p>
            <p className="text-2xl font-black mt-0.5">{stats.averageScore.toFixed(0)}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Trophy size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Highest Score</p>
            <p className="text-2xl font-black mt-0.5">{stats.highestScore} pts</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center">
            <Award size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Attempts Taken</p>
            <p className="text-2xl font-black mt-0.5">{stats.attempts}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recommended Actions & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3">Available Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/student/join"
                className="p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 hover:border-violet-500/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all flex flex-col justify-between group"
              >
                <Compass className="text-violet-500 mb-6" size={24} />
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Join Quiz with Code</h4>
                  <p className="text-zinc-400 text-xs mt-1">Participate in published tests generated by teachers.</p>
                </div>
              </Link>
              <Link
                href="/student/history"
                className="p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 hover:border-violet-500/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all flex flex-col justify-between group"
              >
                <HistoryIcon className="text-indigo-500 mb-6" size={24} />
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Review Attempts History</h4>
                  <p className="text-zinc-400 text-xs mt-1">Review wrong answers, explanations, and metrics.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Global leader boards */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base border-b border-zinc-100 dark:border-zinc-800 pb-3">Platform Leaderboard</h3>
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-black text-sm">1</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Alex Rivera</p>
                  <p className="text-[10px] text-zinc-400">Level 8 Explorer</p>
                </div>
                <span className="text-xs font-bold">1,850 XP</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-300/20 text-zinc-500 flex items-center justify-center font-black text-sm">2</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Sarah Connor</p>
                  <p className="text-[10px] text-zinc-400">Level 6 Explorer</p>
                </div>
                <span className="text-xs font-bold">1,400 XP</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-700/10 text-amber-700 dark:text-amber-500 flex items-center justify-center font-black text-sm">3</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">You</p>
                  <p className="text-[10px] text-zinc-400">Level {level} Explorer</p>
                </div>
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{xp} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HistoryIcon = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);