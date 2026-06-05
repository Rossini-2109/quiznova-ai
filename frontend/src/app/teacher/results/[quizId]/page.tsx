"use client";

import { useEffect, useState, use } from "react";
import api from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowLeft, Trophy, Users, Percent, HelpCircle, FileText, ChevronRight, Activity, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Result {
  studentId: string;
  score: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  submittedAt: string;
}

interface AIAnalytics {
  hasData: boolean;
  insights: string;
  averagePercentage: number;
  totalAttempts: number;
  highestScore: number;
}

export default function TeacherResultsPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);

  // Fetch student quiz results
  const { data: results = [], isLoading: loadingResults } = useQuery<Result[]>({
    queryKey: ["quiz-results", quizId],
    queryFn: async () => {
      const res = await api.get(`/results/quiz/${quizId}`);
      return res.data;
    },
  });

  // Fetch AI Insights
  const { data: analytics, isLoading: loadingAnalytics, error: analyticsError } = useQuery<AIAnalytics>({
    queryKey: ["quiz-ai-analytics", quizId],
    queryFn: async () => {
      const res = await api.get(`/ai/analytics/${quizId}`);
      return res.data;
    },
    retry: false,
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasSubmissions = results.length > 0;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/teacher/quizzes"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 font-semibold mb-3 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Quizzes
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
            Quiz Results & Analytics
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            View student completions and AI-powered performance analysis
          </p>
        </div>
      </div>

      {!hasSubmissions && !loadingResults ? (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-4">
            <Activity size={24} />
          </div>
          <h3 className="text-lg font-bold">No Submissions Yet</h3>
          <p className="text-zinc-400 text-sm mt-1 max-w-sm mx-auto">
            Once students participate and submit answers for this quiz, their results and AI analytics will be shown here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Results Table */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-lg">Student Submissions</h3>
                <span className="text-xs bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1.5 rounded-lg text-zinc-500 font-semibold">
                  {results.length} total
                </span>
              </div>

              {loadingResults ? (
                <div className="p-10 text-center text-zinc-400">Loading submission data...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase bg-zinc-50/50 dark:bg-zinc-900/30">
                        <th className="py-4 px-6">Student Register</th>
                        <th className="py-4 px-6 text-center">Correct Answers</th>
                        <th className="py-4 px-6 text-center">Score</th>
                        <th className="py-4 px-6 text-center">Accuracy</th>
                        <th className="py-4 px-6 text-right">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {results.map((r, i) => (
                        <tr key={i} className="text-sm hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="py-4.5 px-6 font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                            {r.studentId.substring(0, 8)}...
                          </td>
                          <td className="py-4.5 px-6 text-center text-zinc-500 dark:text-zinc-400">
                            {r.correctAnswers} / {r.totalQuestions}
                          </td>
                          <td className="py-4.5 px-6 text-center font-bold text-indigo-600 dark:text-indigo-400">
                            {r.score} pts
                          </td>
                          <td className="py-4.5 px-6 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                              r.percentage >= 80
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : r.percentage >= 50
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}>
                              {r.percentage.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-4.5 px-6 text-right text-zinc-400 dark:text-zinc-500 text-xs">
                            {formatDate(r.submittedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-zinc-900 text-white rounded-3xl border border-zinc-800 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              {/* background decoration */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl" />

              <div className="flex items-center gap-2 mb-6">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles size={16} className="fill-indigo-400/25" />
                </div>
                <h3 className="font-bold text-lg">AI performance Insights</h3>
              </div>

              {loadingAnalytics ? (
                <div className="py-12 text-center text-zinc-500 space-y-3">
                  <RefreshCw className="animate-spin mx-auto text-indigo-400" size={24} />
                  <p className="text-xs">Analyzing scores & question patterns...</p>
                </div>
              ) : analyticsError || !analytics || !analytics.hasData ? (
                <div className="py-8 text-center text-zinc-500">
                  <p className="text-sm">Could not generate performance insights.</p>
                  <p className="text-xs mt-1">Make sure student answers are submitted.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Aggregated widgets */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4">
                      <p className="text-zinc-500 text-xs font-semibold">Average Score</p>
                      <p className="text-2xl font-black text-indigo-400 mt-1">{analytics.averagePercentage.toFixed(1)}%</p>
                    </div>
                    <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4">
                      <p className="text-zinc-500 text-xs font-semibold">Highest Score</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">{analytics.highestScore} pts</p>
                    </div>
                  </div>

                  {/* AI Response Text (Markdown) */}
                  <div className="border-t border-zinc-800/60 pt-4 max-h-[350px] overflow-y-auto pr-1 text-sm text-zinc-300 space-y-4 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="prose prose-invert prose-sm">
                      {analytics.insights.split("\n").map((line, idx) => {
                        if (line.startsWith("###")) {
                          return <h4 key={idx} className="text-white font-bold text-sm mt-4 mb-2">{line.replace("###", "")}</h4>;
                        }
                        if (line.startsWith("##")) {
                          return <h3 key={idx} className="text-white font-black text-base mt-5 mb-2.5 border-b border-zinc-800 pb-1 flex items-center gap-1.5">{line.replace("##", "")}</h3>;
                        }
                        if (line.startsWith("-") || line.startsWith("*")) {
                          return <li key={idx} className="ml-4 list-disc text-zinc-300 py-0.5">{line.substring(1).trim()}</li>;
                        }
                        return <p key={idx} className="my-1.5">{line}</p>;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
