"use client";

import React, { use, useState, useMemo } from "react";
import api from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  Users,
  CheckCircle2,
  XCircle,
  Minus,
  Clock,
  BarChart3,
  RefreshCw,
  Download,
  Share2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  TrendingUp,
  BookOpen,
  Eye,
  Filter,
  ArrowUpDown,
  Medal,
} from "lucide-react";

/* ═══════════════════════════════════ TYPES ══════════════════════════════════ */

interface StudentResult {
  studentId: string;
  studentName?: string;
  studentRegister?: string;
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers?: number;
  unansweredQuestions?: number;
  totalQuestions: number;
  attemptedQuestions?: number;
  accuracy?: number;
  timeTaken?: number; // seconds
  submittedAt: string;
  answers?: QuestionAnswer[];
  tabSwitches?: number;
  windowBlurs?: number;
}

interface QuestionAnswer {
  questionId: string;
  questionIndex: number;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean | null; // null = unanswered
  timeTaken?: number;
}

interface QuizDetails {
  id: string;
  title: string;
  description?: string;
  totalQuestions: number;
  totalMarks: number;
  timeLimit: number;
  status: string;
  passPercentage?: number;
  createdAt?: string;
}

interface AIAnalytics {
  hasData: boolean;
  insights: string;
  averagePercentage: number;
  totalAttempts: number;
  highestScore: number;
}

/* ════════════════════════════════ UTILITIES ═════════════════════════════════ */

const fmt = (s: string) =>
  new Date(s).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtTime = (secs?: number) => {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const pctColor = (p: number) =>
  p >= 80
    ? "text-emerald-600 dark:text-emerald-400"
    : p >= 50
    ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

const pctBg = (p: number) =>
  p >= 80
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
    : p >= 50
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
    : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";

const rankMedal = (rank: number) => {
  if (rank === 1) return { icon: "🥇", className: "text-amber-500" };
  if (rank === 2) return { icon: "🥈", className: "text-zinc-400" };
  if (rank === 3) return { icon: "🥉", className: "text-amber-700" };
  return { icon: `#${rank}`, className: "text-zinc-500 font-mono text-xs" };
};

/* ─── Derived analytics from results ─────────────────────────────────────── */

function deriveStats(results: StudentResult[], quiz: QuizDetails | undefined, passPercentage: number) {
  if (!results.length || !quiz) return null;

  const scores      = results.map((r,ri) => r.percentage);
  const avg         = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highest     = Math.max(...scores);
  const lowest      = Math.min(...scores);
  const passed      = results.filter((r) => r.percentage >= passPercentage).length;
  const failed      = results.length - passed;
  const passRate    = (passed / results.length) * 100;

  const accuracies  = results.map((r,ri) => {
    const attempted = r.attemptedQuestions ?? (r.correctAnswers + (r.wrongAnswers ?? 0));
    if (!attempted) return 0;
    return (r.correctAnswers / attempted) * 100;
  });
  const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;

  const times       = results.map((r,ri) => r.timeTaken).filter(Boolean) as number[];
  const avgTime     = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const fastestTime = times.length ? Math.min(...times) : 0;
  const slowestTime = times.length ? Math.max(...times) : 0;

  // Ranked results: highest score → highest accuracy → fastest time
  const ranked = [...results].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const accA = a.accuracy ?? (a.correctAnswers / Math.max(a.attemptedQuestions ?? a.totalQuestions, 1)) * 100;
    const accB = b.accuracy ?? (b.correctAnswers / Math.max(b.attemptedQuestions ?? b.totalQuestions, 1)) * 100;
    if (accB !== accA) return accB - accA;
    return (a.timeTaken ?? Infinity) - (b.timeTaken ?? Infinity);
  });

  // Per-question accuracy from answers
  const questionAccuracy: Record<number, { correct: number; wrong: number; skipped: number; total: number }> = {};
  for (let i = 0; i < (quiz?.totalQuestions ?? 0); i++) {
    questionAccuracy[i] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
  }
  results.forEach((r) => {
    if (!r.answers) return;
    r.answers.forEach((a) => {
      const idx = a.questionIndex;
      if (questionAccuracy[idx] === undefined) questionAccuracy[idx] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
      questionAccuracy[idx].total++;
      if (a.isCorrect === null || a.selectedAnswer === null) questionAccuracy[idx].skipped++;
      else if (a.isCorrect) questionAccuracy[idx].correct++;
      else questionAccuracy[idx].wrong++;
    });
  });

  return { avg, highest, lowest, passed, failed, passRate, avgAccuracy, avgTime, fastestTime, slowestTime, ranked, questionAccuracy, accuracies };
}

/* ═══════════════════════════════ SUBCOMPONENTS ══════════════════════════════ */

/** Stat overview card */
function StatCard({
  icon,
  label,
  value,
  sub,
  color = "indigo",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: "indigo" | "emerald" | "amber" | "red" | "violet";
}) {
  const colorMap: Record<string, string> = {
    indigo:  "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    amber:   "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    red:     "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    violet:  "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

/** Progress bar */
function ProgressBar({ value, max = 100, color = "bg-indigo-500" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Heatmap cell */
function HeatCell({ state }: { state: "correct" | "wrong" | "skipped" | null }) {
  if (state === null)
    return <td className="px-1 py-1"><div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/40 flex items-center justify-center"><Minus size={10} className="text-zinc-300 dark:text-zinc-600" /></div></td>;
  if (state === "correct")
    return <td className="px-1 py-1"><div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" /></div></td>;
  if (state === "wrong")
    return <td className="px-1 py-1"><div className="w-8 h-8 rounded-md bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 flex items-center justify-center"><XCircle size={12} className="text-red-500 dark:text-red-400" /></div></td>;
  // skipped
  return <td className="px-1 py-1"><div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800/60 border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center"><Minus size={10} className="text-zinc-400" /></div></td>;
}

/* ═══════════════════════════════════ TABS ═══════════════════════════════════ */

type TabId = "overview" | "participants" | "questions" | "anticheat";

/* ═══════════════════════════════ MAIN PAGE ══════════════════════════════════ */

export default function TeacherResultsPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const [activeTab, setActiveTab]       = useState<TabId>("overview");
  const [sortKey, setSortKey]           = useState<"rank" | "name" | "score" | "accuracy" | "time">("rank");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc");
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [passPercentage, setPassPercentage]   = useState(50);

  /* ── Queries ── */
  const { data: results = [], isLoading: loadingResults } = useQuery<StudentResult[]>({
    queryKey: ["quiz-results", quizId],
    queryFn: async () => {
      const res = await api.get(`/results/quiz/${quizId}`);
      return res.data;
    },
  });

  const { data: quiz, isLoading: loadingQuiz } = useQuery<QuizDetails>({
    queryKey: ["quiz-details", quizId],
    queryFn: async () => {
      const res = await api.get(`/quiz/${quizId}`);
      return res.data;
    },
  });

  const { data: analytics, isLoading: loadingAI } = useQuery<AIAnalytics>({
    queryKey: ["quiz-ai-analytics", quizId],
    queryFn: async () => {
      const res = await api.get(`/ai/analytics/${quizId}`);
      return res.data;
    },
    retry: false,
  });

  /* ── Derived stats ── */
  const stats = useMemo(
    () => deriveStats(results, quiz, passPercentage),
    [results, quiz, passPercentage]
  );

  /* ── Sorted leaderboard ── */
  const sortedResults = useMemo(() => {
    if (!stats) return results;
    const ranked = stats.ranked.map((r, i) => ({ ...r, _rank: i + 1 }));
    return [...ranked].sort((a, b) => {
      let diff = 0;
      if (sortKey === "rank")     diff = a._rank - b._rank;
      if (sortKey === "name")     diff = (a.studentName ?? a.studentId).localeCompare(b.studentName ?? b.studentId);
      if (sortKey === "score")    diff = b.score - a.score;
      if (sortKey === "accuracy") diff = (b.accuracy ?? b.percentage) - (a.accuracy ?? a.percentage);
      if (sortKey === "time")     diff = (a.timeTaken ?? 9999) - (b.timeTaken ?? 9999);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [stats, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const hasData       = results.length > 0;
  const isLoading     = loadingResults || loadingQuiz;
  const totalQs       = quiz?.totalQuestions ?? 0;
  const qAccuracy     = stats?.questionAccuracy ?? {};
  const exportReport = (quizId: string) => {
  window.open(
    `${process.env.NEXT_PUBLIC_API_URL}/api/ExportExcel/quiz/${quizId}`,
    "_blank"
  );
};

  /* ── Diff badge for a question ── */
  const getDiffBadge = (idx: number) => {
    const q = qAccuracy[idx];
    if (!q || !q.total) return null;
    const acc = (q.correct / q.total) * 100;
    if (acc >= 80) return { label: "Easy",   className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
    if (acc >= 50) return { label: "Medium", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    return           { label: "Hard",   className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  };

  /* ── Heatmap row state for a student ── */
  const getHeatRow = (r: StudentResult) => {
    const cells: ("correct" | "wrong" | "skipped" | null)[] = Array(totalQs).fill(null);
    if (!r.answers) return cells;
    r.answers.forEach((a) => {
      const i = a.questionIndex;
      if (i < 0 || i >= totalQs) return;
      if (a.isCorrect === null || a.selectedAnswer === null) cells[i] = "skipped";
      else cells[i] = a.isCorrect ? "correct" : "wrong";
    });
    return cells;
  };

  /* ─────────────────────────────── RENDER ──────────────────────────────── */

  return (
    <div className="space-y-7 pb-16">

      {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link
            href="/teacher/results"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-semibold mb-3 transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Results Hub
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {loadingQuiz ? "Loading…" : quiz?.title ?? "Quiz Analytics"}
            </h1>
            {quiz?.status && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                quiz.status === "Published"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${quiz.status === "Published" ? "bg-emerald-500" : "bg-zinc-400"}`} />
                {quiz.status}
              </span>
            )}
          </div>
          <p className="text-zinc-400 dark:text-zinc-500 mt-1 text-sm">
            View student completions, AI insights, heatmaps, and question analytics
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => {
  if (!quiz) return;
  exportReport(quiz.id);
}}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all shadow-sm">
            <Download size={14} />
            Export
          </button>
          <button className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
            <Share2 size={14} />
            Share Report
          </button>
        </div>
      </div>

      {/* ══ OVERVIEW STAT CARDS ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart3 size={18} />}
          label="Avg Score"
          value={stats ? `${stats.avg.toFixed(1)}%` : "—"}
          sub={stats ? `Highest: ${stats.highest.toFixed(0)}%` : undefined}
          color="indigo"
        />
        <StatCard
          icon={<Target size={18} />}
          label="Avg Accuracy"
          value={stats ? `${stats.avgAccuracy.toFixed(1)}%` : "—"}
          sub="Correct ÷ Attempted"
          color="violet"
        />
        <StatCard
          icon={<Users size={18} />}
          label="Participants"
          value={results.length}
          sub={quiz ? `${((results.length / 1) * 100).toFixed(0)} submissions` : undefined}
          color="amber"
        />
        <StatCard
          icon={<BookOpen size={18} />}
          label="Questions"
          value={quiz?.totalQuestions ?? "—"}
          sub={quiz ? `${quiz.timeLimit} min limit` : undefined}
          color="emerald"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Passed"
          value={stats?.passed ?? "—"}
          sub={stats ? `Pass rate: ${stats.passRate.toFixed(0)}%` : undefined}
          color="emerald"
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Failed"
          value={stats?.failed ?? "—"}
          sub={`Pass mark: ${passPercentage}%`}
          color="red"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Avg Time"
          value={stats ? fmtTime(Math.round(stats.avgTime)) : "—"}
          sub={stats?.fastestTime ? `Fastest: ${fmtTime(stats.fastestTime)}` : undefined}
          color="amber"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Lowest Score"
          value={stats ? `${stats.lowest.toFixed(0)}%` : "—"}
          sub={stats ? `Range: ${(stats.highest - stats.lowest).toFixed(0)}pp` : undefined}
          color="red"
        />
      </div>

      {/* ══ NO DATA STATE ════════════════════════════════════════════════════ */}
      {!isLoading && !hasData && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-14 text-center max-w-xl mx-auto shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400 flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">No Submissions Yet</h3>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed max-w-sm mx-auto">
            Once students submit answers, their performance data, leaderboard, heatmap, and analytics will appear here.
          </p>
        </div>
      )}

      {/* ══ TAB BAR ══════════════════════════════════════════════════════════ */}
      {hasData && (
        <>
          <div className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-800/60 p-1 rounded-xl w-fit border border-zinc-200/60 dark:border-zinc-700/50">
            {(
              [
                ["overview",     "Overview",     <BarChart3 size={13} />  ],
                ["participants", "Participants",  <Users     size={13} />  ],
                ["questions",    "Questions",     <BookOpen  size={13} />  ],
                ["anticheat",    "Anti-Cheat",    <AlertTriangle size={13} />],
              ] as [TabId, string, React.ReactNode][]
            ).map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === id
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* ══════════════════════ OVERVIEW TAB ══════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Heatmap — left 2/3 */}
              <div className="xl:col-span-2 space-y-5">

                {/* Pass mark control */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Pass Mark Threshold</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Affects Pass/Fail calculation across all views</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min={10} max={100} step={5}
                      value={passPercentage}
                      onChange={(e) => setPassPercentage(Number(e.target.value))}
                      className="w-28 accent-indigo-600"
                    />
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 w-10 text-center">
                      {passPercentage}%
                    </span>
                  </div>
                </div>

                {/* Performance Heatmap Matrix */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Performance Matrix</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Question-by-question accuracy heatmap</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/60 inline-block" />Correct</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900/60 inline-block" />Wrong</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-zinc-200 dark:bg-zinc-700 border border-dashed border-zinc-300 inline-block" />Skipped</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto p-4">
                    {loadingResults ? (
                      <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">Loading heatmap…</div>
                    ) : (
                      <table className="border-collapse text-xs">
                        <thead>
                          <tr>
                            <th className="text-left px-2 py-2 font-semibold text-zinc-400 min-w-[160px]">Participant</th>
                            <th className="px-2 py-2 font-semibold text-zinc-400 text-center w-20">Points</th>
                            {Array.from({ length: totalQs }, (_, i) => {
                              const q = qAccuracy[i];
                              const acc = q?.total ? Math.round((q.correct / q.total) * 100) : null;
                              const accColor =
                                acc === null ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-700"
                                : acc >= 80   ? "bg-emerald-200 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400"
                                : acc >= 50   ? "bg-amber-200 text-amber-700 dark:bg-amber-900/60 dark:text-amber-400"
                                :               "bg-red-200 text-red-700 dark:bg-red-900/60 dark:text-red-400";
                              return (
                                <th key={i} className="px-1 py-2 text-center w-10">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Q{i + 1}</span>
                                    {acc !== null && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${accColor}`}>
                                        {acc}%
                                      </span>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                          {(stats?.ranked ?? results).map((r, ri) => {
                            const cells = getHeatRow(r);
                            const rank  = ri + 1;
                            const medal = rankMedal(rank);
                            return (
                              <tr key={`${r.studentId}-${ri}`} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20 transition-colors">
                                <td className="px-2 py-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm ${medal.className}`}>{medal.icon}</span>
                                    <div>
                                      <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                                        {r.studentName ?? r.studentRegister ?? r.studentId.substring(0, 10) + "…"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <span className="font-black text-zinc-800 dark:text-zinc-200">
                                    {r.correctAnswers}/{r.totalQuestions}
                                  </span>
                                  <br />
                                  <span className={`text-[10px] font-semibold ${pctColor(r.percentage)}`}>
                                    ({r.percentage.toFixed(0)}%)
                                  </span>
                                </td>
                                {cells.map((state, ci) => (
                                  <HeatCell key={ci} state={state} />
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Insights — right 1/3 */}
              <div className="xl:col-span-1 space-y-5">
                <div className="bg-zinc-950 dark:bg-zinc-950 text-white rounded-2xl border border-zinc-800 p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl" />

                  <div className="flex items-center gap-2.5 mb-5 relative">
                    <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Sparkles size={15} className="fill-indigo-400/30" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">AI Performance Insights</h3>
                      <p className="text-[10px] text-zinc-500">Powered by quiz analytics engine</p>
                    </div>
                  </div>

                  {loadingAI ? (
                    <div className="py-10 text-center space-y-3">
                      <RefreshCw className="animate-spin mx-auto text-indigo-400" size={20} />
                      <p className="text-xs text-zinc-500">Analysing patterns…</p>
                    </div>
                  ) : !analytics?.hasData ? (
                    <p className="text-sm text-zinc-500 py-6 text-center">Could not generate insights.</p>
                  ) : (
                    <div className="space-y-4 relative">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                          <p className="text-[10px] text-zinc-500 font-semibold">Avg Score</p>
                          <p className="text-xl font-black text-indigo-400 mt-0.5">
                            {analytics.averagePercentage.toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                          <p className="text-[10px] text-zinc-500 font-semibold">Top Score</p>
                          <p className="text-xl font-black text-emerald-400 mt-0.5">
                            {analytics.highestScore} pts
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-zinc-800/60 pt-4 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 pr-1 space-y-1 text-[13px] text-zinc-300 leading-relaxed">
                        {analytics.insights.split("\n").map((line, idx) => {
                          if (!line.trim()) return null;
                          if (line.startsWith("### "))
                            return <h4 key={idx} className="text-white font-bold text-sm mt-4 mb-1">{line.replace("### ", "")}</h4>;
                          if (line.startsWith("## "))
                            return <h3 key={idx} className="text-white font-black text-base mt-5 mb-2 border-b border-zinc-800 pb-1">{line.replace("## ", "")}</h3>;
                          if (line.startsWith("- ") || line.startsWith("* "))
                            return <li key={idx} className="ml-3 list-disc text-zinc-400 py-0.5">{line.substring(2)}</li>;
                          return <p key={idx} className="text-zinc-400">{line}</p>;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pass/Fail mini chart */}
                {stats && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-4">Pass vs Fail</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Passed ({stats.passed})</span>
                          <span className="font-mono text-zinc-400">{stats.passRate.toFixed(0)}%</span>
                        </div>
                        <ProgressBar value={stats.passRate} color="bg-emerald-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-red-500 font-semibold">Failed ({stats.failed})</span>
                          <span className="font-mono text-zinc-400">{(100 - stats.passRate).toFixed(0)}%</span>
                        </div>
                        <ProgressBar value={100 - stats.passRate} color="bg-red-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════ PARTICIPANTS TAB ══════════════════════════════ */}
          {activeTab === "participants" && (
            <div className="space-y-5">
              {/* Individual student report drawer */}
              {selectedStudent && (
                <div className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl shadow-lg p-6 relative">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="absolute top-4 right-4 text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    ✕ Close
                  </button>
                  <div className="flex items-start gap-5 flex-wrap">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xl font-black flex items-center justify-center">
                      {(selectedStudent.studentName ?? selectedStudent.studentId)[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                        {selectedStudent.studentName ?? selectedStudent.studentRegister ?? selectedStudent.studentId.substring(0, 8) + "…"}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-3 text-sm">
                        {[
                          ["Score",      `${selectedStudent.score} pts`                   ],
                          ["Percentage", `${selectedStudent.percentage.toFixed(1)}%`       ],
                          ["Correct",    `${selectedStudent.correctAnswers}/${selectedStudent.totalQuestions}`],
                          ["Wrong",      `${selectedStudent.wrongAnswers ?? "—"}`          ],
                          ["Skipped",    `${selectedStudent.unansweredQuestions ?? "—"}`   ],
                          ["Time",       fmtTime(selectedStudent.timeTaken)                ],
                          ["Submitted",  fmt(selectedStudent.submittedAt)                  ],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2">
                            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">{k}</p>
                            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>
                      {/* Mini heatmap for selected student */}
                      {selectedStudent.answers && totalQs > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-zinc-400 mb-2">Question-by-Question</p>
                          <div className="flex flex-wrap gap-1">
                            {getHeatRow(selectedStudent).map((state, i) => (
                              <div
                                key={i}
                                title={`Q${i + 1}: ${state ?? "no data"}`}
                                className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold border ${
                                  state === "correct"
                                    ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-700"
                                    : state === "wrong"
                                    ? "bg-red-100 border-red-300 text-red-600 dark:bg-red-900/30 dark:border-red-700"
                                    : state === "skipped"
                                    ? "bg-zinc-100 border-dashed border-zinc-300 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-600"
                                    : "bg-zinc-100 border-zinc-200 text-zinc-300 dark:bg-zinc-800/40 dark:border-zinc-700"
                                }`}
                              >
                                {i + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedStudent.tabSwitches !== undefined && (
                        <div className="mt-4 flex gap-3">
                          {selectedStudent.tabSwitches > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 px-3 py-1 rounded-full">
                              <AlertTriangle size={12} />
                              {selectedStudent.tabSwitches} tab switch{selectedStudent.tabSwitches !== 1 ? "es" : ""}
                            </span>
                          )}
                          {(selectedStudent.windowBlurs ?? 0) > 2 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 px-3 py-1 rounded-full">
                              <AlertTriangle size={12} />
                              {selectedStudent.windowBlurs} focus losses
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard table */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Leaderboard</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Ranked by score → accuracy → speed</p>
                  </div>
                  <span className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-1.5 rounded-lg">
                    {results.length} submissions
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
                        {(
                          [
                            ["rank",     "Rank"       ],
                            ["name",     "Student"    ],
                            ["score",    "Score"      ],
                            ["accuracy", "Accuracy"   ],
                            ["time",     "Time Taken" ],
                          ] as [typeof sortKey, string][]
                        ).map(([key, label]) => (
                          <th
                            key={key}
                            className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            onClick={() => toggleSort(key)}
                          >
                            <span className="inline-flex items-center gap-1">
                              {label}
                              <ArrowUpDown size={11} className={sortKey === key ? "text-indigo-500" : "opacity-30"} />
                            </span>
                          </th>
                        ))}
                        <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Status</th>
                        <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-right">Submitted</th>
                        <th className="py-3.5 px-5 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                      {sortedResults.map((r, i) => {
                        const rank     = (r as any)._rank ?? i + 1;
                        const medal    = rankMedal(rank);
                        const isPassed = r.percentage >= passPercentage;
                        const accuracy = r.accuracy
                          ?? (r.attemptedQuestions
                            ? (r.correctAnswers / r.attemptedQuestions) * 100
                            : r.percentage);
                        return (
                          <tr
                            key={`${r.studentId}-${i}`}
                            className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20 transition-colors cursor-pointer"
                            onClick={() => setSelectedStudent(r)}
                          >
                            {/* Rank */}
                            <td className="py-4 px-5">
                              <span className={`text-base font-black ${medal.className}`}>{medal.icon}</span>
                            </td>

                            {/* Student */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0">
                                  {(r.studentName ?? r.studentId)[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {r.studentName ?? r.studentRegister ?? r.studentId.substring(0, 8) + "…"}
                                  </p>
                                  {r.studentRegister && (
                                    <p className="text-[10px] text-zinc-400 font-mono">{r.studentRegister}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Score */}
                            <td className="py-4 px-5">
                              <p className="font-black text-zinc-900 dark:text-zinc-100">
                                {r.correctAnswers}/{r.totalQuestions}
                              </p>
                              <p className={`text-xs font-semibold ${pctColor(r.percentage)}`}>
                                {r.percentage.toFixed(0)}%
                              </p>
                            </td>

                            {/* Accuracy */}
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${pctBg(accuracy)}`}>
                                {accuracy.toFixed(0)}%
                              </span>
                            </td>

                            {/* Time */}
                            <td className="py-4 px-5 font-mono text-xs text-zinc-500">
                              {fmtTime(r.timeTaken)}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                isPassed
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isPassed ? "bg-emerald-500" : "bg-red-400"}`} />
                                {isPassed ? "Passed" : "Failed"}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-4 px-5 text-right text-[11px] text-zinc-400 font-mono whitespace-nowrap">
                              {fmt(r.submittedAt)}
                            </td>

                            {/* Detail arrow */}
                            <td className="py-4 px-4">
                              <Eye size={14} className="text-zinc-300 group-hover:text-indigo-400" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ QUESTIONS TAB ══════════════════════════════════ */}
          {activeTab === "questions" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">Per-question performance breakdown. Difficulty is auto-classified by accuracy rate.</p>
              {Array.from({ length: totalQs }, (_, i) => {
                const q    = qAccuracy[i] ?? { correct: 0, wrong: 0, skipped: 0, total: 0 };
                const acc  = q.total ? (q.correct / q.total) * 100 : 0;
                const diff = getDiffBadge(i);
                return (
                  <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-black flex items-center justify-center shrink-0">
                          Q{i + 1}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Question {i + 1}</p>
                          <p className="text-xs text-zinc-400">{q.total} attempt{q.total !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {diff && (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${diff.className}`}>
                            {diff.label}
                          </span>
                        )}
                        <span className={`text-sm font-black ${pctColor(acc)}`}>
                          {acc.toFixed(0)}% accuracy
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      {[
                        { label: "Correct",  value: q.correct, color: "text-emerald-600 dark:text-emerald-400" },
                        { label: "Wrong",    value: q.wrong,   color: "text-red-500 dark:text-red-400"         },
                        { label: "Skipped",  value: q.skipped, color: "text-zinc-400"                          },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl py-3">
                          <p className={`text-xl font-black ${color}`}>{value}</p>
                          <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    <ProgressBar value={acc} color={acc >= 80 ? "bg-emerald-500" : acc >= 50 ? "bg-amber-400" : "bg-red-400"} />
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════ ANTI-CHEAT TAB ══════════════════════════════ */}
          {activeTab === "anticheat" && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Anti-cheat data is collected from the student client (tab switches, window focus loss). These are indicators, not definitive proof of misconduct.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Anti-Cheat Report</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Behavioural signals collected during the quiz session</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50/60 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800">
                        {["Student", "Tab Switches", "Focus Loss", "Risk Level"].map((h) => (
                          <th key={h} className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                      {results.map((r,ri) => {
                        const tabs   = r.tabSwitches  ?? 0;
                        const blurs  = r.windowBlurs  ?? 0;
                        const risk   = tabs > 5 || blurs > 8 ? "High" : tabs > 2 || blurs > 3 ? "Medium" : "Low";
                        const riskCx =
                          risk === "High"   ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          : risk === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                          :                    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
                        return (
                          <tr key={`${r.studentId}-${ri}`} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 transition-colors">
                            <td className="py-4 px-5 font-semibold text-zinc-900 dark:text-zinc-100">
                              {r.studentName ?? r.studentRegister ?? r.studentId.substring(0, 10) + "…"}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`font-mono font-bold ${tabs > 2 ? "text-amber-600 dark:text-amber-400" : "text-zinc-500"}`}>
                                {tabs}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <span className={`font-mono font-bold ${blurs > 3 ? "text-red-500" : "text-zinc-500"}`}>
                                {blurs}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${riskCx}`}>
                                {risk === "High" && <AlertTriangle size={10} />}
                                {risk} Risk
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}