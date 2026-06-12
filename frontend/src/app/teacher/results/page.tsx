"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import Link from "next/link";
import {
  ChevronRight,
  Calendar,
  BarChart3,
  Users,
  Clock,
  BookOpen,
  TrendingUp,
  Zap,
} from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  status: string;
  quizCode: string;
  totalQuestions?: number;
  createdAt?: string;
}

interface QuizSummary {
  quizId: string;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  Easy:   { label: "Easy",   className: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" },
  Medium: { label: "Medium", className: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
  Hard:   { label: "Hard",   className: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
};

const statusConfig: Record<string, { label: string; dot: string; className: string }> = {
  Published: { label: "Published", dot: "bg-emerald-500", className: "text-emerald-700 dark:text-emerald-400" },
  Draft:     { label: "Draft",     dot: "bg-amber-400",   className: "text-amber-600 dark:text-amber-400"   },
  Closed:    { label: "Closed",    dot: "bg-zinc-400",    className: "text-zinc-500 dark:text-zinc-500"     },
};

export default function TeacherResultsIndex() {
  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["results-quizzes"],
    queryFn: async () => {
      const res = await api.get("/quiz/all");
      return res.data;
    },
  });

  const publishedCount = quizzes.filter((q) => q.status === "Published").length;
  const totalQuizzes   = quizzes.length;

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1.5">
            Analytics Hub
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Results &amp; Reports
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm max-w-lg">
            Select any assessment below to view detailed student performance,
            leaderboards, heatmaps, and AI-powered insights.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl px-5 py-3 text-center shadow-sm">
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{totalQuizzes}</p>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Total Quizzes</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl px-5 py-3 text-center shadow-sm">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{publishedCount}</p>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Published</p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-16 text-center max-w-md mx-auto shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            No Quizzes Yet
          </h3>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            Create and publish quizzes to start tracking student performance and
            analytics here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quizzes.map((quiz) => {
            const diff   = difficultyConfig[quiz.difficulty] ?? difficultyConfig.Medium;
            const status = statusConfig[quiz.status]        ?? statusConfig.Draft;

            return (
              <Link
                key={quiz.id}
                href={`/teacher/results/${quiz.id}`}
                className="group bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 flex justify-between items-start gap-4"
              >
                {/* Left */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Status row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${status.className}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${diff.className}`}>
                      {diff.label}
                    </span>
                    {quiz.quizCode && (
                      <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                        #{quiz.quizCode}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {quiz.title}
                  </h3>

                  {/* Description */}
                  {quiz.description && (
                    <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} className="shrink-0" />
                      {quiz.timeLimit} min
                    </span>
                    {quiz.totalQuestions !== undefined && (
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={11} className="shrink-0" />
                        {quiz.totalQuestions} Qs
                      </span>
                    )}
                    {quiz.createdAt && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={11} className="shrink-0" />
                        {new Date(quiz.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right CTA */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 transition-all duration-200">
                    <BarChart3 size={16} />
                  </div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-indigo-500 font-medium transition-colors">
                    Analytics
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}