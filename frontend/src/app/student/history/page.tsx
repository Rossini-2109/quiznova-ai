"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import Link from "next/link";
import { Trophy, Calendar, ClipboardList, ChevronRight, Activity } from "lucide-react";

interface Attempt {
  id: string;
  quizId: string;
  score: number;
  percentage: number;
  startedAt: string;
  submittedAt: string;
}

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/attempts/student")
      .then((res) => setAttempts(res.data))
      .catch((err) => console.error("History error", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-violet-950 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
          My Quiz History
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
          Review your past assessment scores, accuracy levels, and performance details
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-400">Loading attempts...</div>
      ) : attempts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-10 text-center max-w-md mx-auto shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-4">
            <ClipboardList size={20} />
          </div>
          <h3 className="text-lg font-bold">No History Found</h3>
          <p className="text-zinc-400 text-sm mt-1 mb-6">
            You haven't participated in any quizzes yet. Use the Join Quiz tab with a code from your teacher!
          </p>
          <Link
            href="/student/join"
            className="text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-xl"
          >
            Join Your First Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attempts.map((attempt) => (
            <Link
              key={attempt.id}
              href={`/student/results/${attempt.id}`}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-violet-500/20 transition-all flex justify-between items-center group"
            >
              <div className="space-y-2">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                  attempt.percentage >= 80
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : attempt.percentage >= 50
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}>
                  {attempt.percentage.toFixed(0)}% Accuracy
                </span>

                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Score: {attempt.score} pts
                </h3>

                <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(attempt.submittedAt || attempt.startedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy size={12} />
                    Passed
                  </span>
                </div>
              </div>

              <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 group-hover:text-violet-500 transition-all">
                <ChevronRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}