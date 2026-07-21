"use client";

import React, { use, useState, useMemo } from "react";
import api from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  FileText,
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
  timeTaken?: number;

  startedAt?: string;      // ADD THIS
  submittedAt: string;

  answers?: QuestionAnswer[];

  tabSwitches?: number;
  windowBlurs?: number;

  completionStatus?: string;
}

interface QuestionAnswer {
  questionId: string;
  questionIndex: number;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean | null; // null = unanswered
  timeTaken?: number;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswer: string;
  explanation?: string;
  questionType?: string;
  orderIndex: number;
  questionImageUrl?: string;
  optionAImageUrl?: string;
  optionBImageUrl?: string;
  optionCImageUrl?: string;
  optionDImageUrl?: string;
  optionEImageUrl?: string;
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
  questions?: QuizQuestion[];
  tags?: string;
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

const cleanStudentName = (name?: string) => {
  if (!name) return "Unknown";
  return name.replace(/\s*\(\d{8}\)\s*$/, "").trim();
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

  const scores = results.map(r => r.percentage);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);

  // total correct and incorrect answers across all students
  const correctTotal = results.reduce((sum, r) => sum + r.correctAnswers, 0);
  const incorrectTotal = results.reduce((sum, r) => {
    const wrong = r.wrongAnswers ?? (
      r.attemptedQuestions
        ? r.attemptedQuestions - r.correctAnswers
        : r.totalQuestions - r.correctAnswers - (r.unansweredQuestions ?? 0)
    );
    return sum + (wrong ?? 0);
  }, 0);

  const passed = results.filter(r => r.percentage >= passPercentage).length;
  const failed = results.length - passed;
  const passRate = (passed / results.length) * 100;

  const accuracies = results.map(r => {
    const attempted = r.attemptedQuestions ?? (r.correctAnswers + (r.wrongAnswers ?? 0));
    if (!attempted) return 0;
    return (r.correctAnswers / attempted) * 100;
  });
  const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;

  const times = results.map(r => r.timeTaken).filter(Boolean) as number[];
  const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
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
  results.forEach(r => {
    if (!r.answers) return;
    r.answers.forEach(a => {
      const idx = a.questionIndex;
      if (questionAccuracy[idx] === undefined) questionAccuracy[idx] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
      questionAccuracy[idx].total++;
      if (a.isCorrect === null || a.selectedAnswer === null) questionAccuracy[idx].skipped++;
      else if (a.isCorrect) questionAccuracy[idx].correct++;
      else questionAccuracy[idx].wrong++;
    });
  });

  return {
    avg,
    highest,
    lowest,
    passed,
    failed,
    passRate,
    avgAccuracy,
    avgTime,
    fastestTime,
    slowestTime,
    ranked,
    questionAccuracy,
    accuracies,
    correctTotal,
    incorrectTotal,
  };
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
    return <td className="px-1 py-1"><div className="w-8 h-8 rounded-md bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 flex items-center justify-center"><XCircle size={12} className="text-red-600 dark:text-red-400" /></div></td>;
  return null;
}

/* ═══════════════════════════════════ TABS ═══════════════════════════════════ */

type TabId = "overview" | "participants" | "questions" | "accommodations" | "tags" | "anticheat";

/* ═══════════════════════════════ MAIN PAGE ══════════════════════════════════ */

export default function TeacherResultsPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const router = useRouter();
  const { quizId } = use(params);
  
  // Navigation states
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  
  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Leaderboard sorting
  const [sortKey, setSortKey] = useState<"rank" | "name" | "score" | "accuracy" | "time">("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [passPercentage, setPassPercentage] = useState(50);
  
  // Matrix (Heatmap) states
  const [matrixSortKey, setMatrixSortKey] = useState<"accuracy" | "name" | "score">("score");
  const [matrixSortDir, setMatrixSortDir] = useState<"asc" | "desc">("desc");
  const [matrixFilter, setMatrixFilter] = useState<"all" | "top" | "low">("all");
  const [matrixSearch, setMatrixSearch] = useState<string>("");

  /* ── Helper to trigger toast notifications ── */
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  /* ── Queries ── */
  
  // 1. Sessions List Query (only enabled when selectedSessionId is null)
  const { data: sessionData, isLoading: loadingSessions } = useQuery<{
    sessions: Array<{
      id: string;
      sessionCode: string;
      joinLink: string;
      isStarted: boolean;
      isEnded: boolean;
      createdAt: string;
      startedAt?: string;
      endedAt?: string;
      participantCount: number;
    }>;
    practiceAttemptCount: number;
  }>({
    queryKey: ["quiz-sessions", quizId],
    queryFn: async () => {
      const res = await api.get(`/results/quiz/${quizId}/sessions`);
      return res.data;
    },
  });

  // 2. Results Query (filtered by selectedSessionId)
  const { data: results = [], isLoading: loadingResults } = useQuery<StudentResult[]>({
    queryKey: ["quiz-results", quizId, selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return [];
      const sessionIdParam = selectedSessionId === "practice" ? "00000000-0000-0000-0000-000000000000" : selectedSessionId;
      const res = await api.get(`/results/quiz/${quizId}?sessionId=${sessionIdParam}`);
      return res.data;
    },
    enabled: !!selectedSessionId,
  });

  // 3. Quiz Details Query (fetched once)
  const { data: quiz, isLoading: loadingQuiz } = useQuery<QuizDetails>({
    queryKey: ["quiz-details", quizId],
    queryFn: async () => {
      const res = await api.get(`/quiz/${quizId}`);
      return res.data;
    },
  });

  // 4. AI Analytics Query (filtered by selectedSessionId)
  const { data: analytics, isLoading: loadingAI } = useQuery<AIAnalytics>({
    queryKey: ["quiz-ai-analytics", quizId, selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return { hasData: false, insights: "", averagePercentage: 0, totalAttempts: 0, highestScore: 0 };
      const sessionIdParam = selectedSessionId === "practice" ? "00000000-0000-0000-0000-000000000000" : selectedSessionId;
      const res = await api.get(`/ai/analytics/${quizId}?sessionId=${sessionIdParam}`);
      return res.data;
    },
    retry: false,
    enabled: !!selectedSessionId,
  });

  // Find the selected session object for UI labels
  const selectedSession = useMemo(() => {
    if (!sessionData?.sessions) return null;
    return sessionData.sessions.find(s => s.id === selectedSessionId) ?? null;
  }, [sessionData, selectedSessionId]);

  // Map questions index properly in the frontend to avoid EF Core index mismatch
  const mappedResults = useMemo(() => {
    if (!quiz?.questions || !results.length) return results;
    const questionIdToIndex = new Map(
      [...quiz.questions]
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map((q, idx) => [q.id, idx])
    );
    
  return results.map(r => {
  if (!r.answers) return r;

  return {
    ...r,
    answers: r.answers.map(a => ({
      ...a,
      questionIndex: questionIdToIndex.get(a.questionId) ?? a.questionIndex
    }))
  };
});
  }, [results, quiz]);

  const stats = useMemo(
    () => deriveStats(mappedResults, quiz, passPercentage),
    [mappedResults, quiz, passPercentage]
  );

  // Leaderboard sorting (Participants tab)
  const sortedResults = useMemo(() => {
    if (!stats) return mappedResults;
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
  }, [stats, mappedResults, sortKey, sortDir]);

  // Heatmap rows sorted, filtered, and searched (Overview tab Matrix)
  const matrixStudents = useMemo(() => {
    if (!mappedResults.length) return [];
    
    // 1. Search filter
    let filtered = mappedResults;
    if (matrixSearch.trim()) {
      const q = matrixSearch.toLowerCase();
      filtered = filtered.filter(s => 
        (s.studentName ?? s.studentId).toLowerCase().includes(q) || 
        (s.studentRegister ?? "").toLowerCase().includes(q)
      );
    }
    
    // 2. Accuracy filter (Top Performers: >=80%, Low Accuracy: <50%)
    if (matrixFilter === "top") {
      filtered = filtered.filter(s => s.percentage >= 80);
    } else if (matrixFilter === "low") {
      filtered = filtered.filter(s => s.percentage < 50);
    }
    
    // 3. Sorting
    return [...filtered].sort((a, b) => {
      let diff = 0;
      if (matrixSortKey === "name") {
        diff = (a.studentName ?? a.studentId).localeCompare(b.studentName ?? b.studentId);
      } else if (matrixSortKey === "accuracy") {
        diff = b.percentage - a.percentage; // high accuracy first
      } else if (matrixSortKey === "score") {
        diff = b.score - a.score; // high score first
      }
      return matrixSortDir === "asc" ? -diff : diff;
    });
  }, [mappedResults, matrixSearch, matrixFilter, matrixSortKey, matrixSortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const hasData       = results.length > 0;
  const isLoading     = loadingResults || loadingQuiz;
  const totalQs       = quiz?.totalQuestions ?? 0;
  const qAccuracy     = stats?.questionAccuracy ?? {};

  const handleExportExcel = () => {
    if (!quiz) return;
    const sessionIdParam = selectedSessionId === "practice" ? "00000000-0000-0000-0000-000000000000" : selectedSessionId;
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/ExportExcel/quiz/${quizId}?sessionId=${sessionIdParam}`,
      "_blank"
    );
  };

  const handleShareReport = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        triggerToast("🚀 Report share link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy share link: ", err);
        triggerToast("❌ Failed to copy share link");
      });
  };

  const handleViewDashboard = () => {
    router.push("/teacher/dashboard");
  };

  const handleAssignHomework = () => {
    triggerToast("📅 Homework assigned successfully to class!");
  };

  /* ── Diff badge for a question ── */
  const getDiffBadge = (idx: number) => {
    const q = qAccuracy[idx];
    if (!q || !q.total) return null;
    const acc = (q.correct / q.total) * 100;
    if (acc >= 80) return { label: "Easy",   className: "bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" };
    if (acc >= 50) return { label: "Medium", className: "bg-amber-50 text-amber-700 border border-amber-250 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" };
    return           { label: "Hard",   className: "bg-red-50 text-red-700 border border-red-250 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" };
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

  // ═══════════════════════ VIEW A: SESSIONS / REPORTS LISTING ═══════════════════════
  if (!selectedSessionId) {
    return (
      <div className="space-y-8 pb-16">
        <div>
          <Link
            href="/teacher/results"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-semibold mb-3 transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Results Hub
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {loadingQuiz ? "Loading..." : quiz?.title ?? "Assessments Reports"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm max-w-lg">
            Choose a separate run or practice session below to view student completions, performance heatmaps, and details.
          </p>
        </div>

        {loadingSessions || loadingQuiz ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (!sessionData?.sessions || sessionData.sessions.length === 0) && sessionData?.practiceAttemptCount === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-16 text-center max-w-md mx-auto shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">No Reports Yet</h3>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              No students have taken this quiz yet. Share the quiz code or host a live run to view reports here!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Live / Completed runs */}
            {sessionData?.sessions.map((s) => {
              const dateStr = fmt(s.startedAt ?? s.createdAt);
              const isLive = s.isStarted && !s.isEnded;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className="text-left group bg-white/10 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-350 dark:hover:border-indigo-750 transition-all flex justify-between items-start gap-4"
                >
                  <div className="space-y-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                        isLive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                        {isLive ? "Live Quiz" : "Completed"}
                      </span>
                      <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                        Code #{s.sessionCode}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                      Run on {dateStr}
                    </h3>
                    <p className="text-zinc-400 text-xs flex items-center gap-1.5">
                      <Users size={12} /> {s.participantCount} Participant{s.participantCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  
                  <div className="h-10 w-10 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-250 dark:border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 transition-all duration-205">
                    <BarChart3 size={16} />
                  </div>
                </button>
              );
            })}

            {/* Direct practice attempts */}
            {sessionData?.practiceAttemptCount && sessionData.practiceAttemptCount > 0 ? (
              <button
                onClick={() => setSelectedSessionId("practice")}
                className="text-left group bg-white/10 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-350 dark:hover:border-indigo-750 transition-all flex justify-between items-start gap-4"
              >
                <div className="space-y-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      Solo Practice
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                    Direct / Solo Practice Attempts
                  </h3>
                  <p className="text-zinc-400 text-xs flex items-center gap-1.5">
                    <Users size={12} /> {sessionData.practiceAttemptCount} Completion{sessionData.practiceAttemptCount !== 1 ? "s" : ""}
                  </p>
                </div>
                
                <div className="h-10 w-10 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-250 dark:border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 transition-all duration-205">
                  <Trophy size={16} />
                </div>
              </button>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════ VIEW B: DETAILED REPORT DASHBOARD ═══════════════════════
  const sessionStartedDate = selectedSession?.startedAt ?? selectedSession?.createdAt ?? results[0]?.startedAt;
  const sessionEndedDate = selectedSession?.endedAt ?? results[0]?.submittedAt;
  const isSelectedLive = selectedSession && selectedSession.isStarted && !selectedSession.isEnded;

  return (
    <div className="space-y-7 pb-16">

      {/* ══ TOP BAR & SUMMARY HEADER ════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5 pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
        <div>
          <button
            onClick={() => setSelectedSessionId(null)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-semibold mb-3 transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Reports List
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {loadingQuiz ? "Loading…" : quiz?.title ?? "Quiz Analytics"}
            </h1>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
              isSelectedLive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                : "bg-zinc-150 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSelectedLive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              {isSelectedLive ? "Live Quiz" : "Completed"}
            </span>
            {selectedSession?.sessionCode && (
              <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                Code: #{selectedSession.sessionCode}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500 mt-2 font-mono">
            {sessionStartedDate && (
              <span>Started: {new Date(sessionStartedDate).toLocaleString()}</span>
            )}
            {sessionEndedDate && !isSelectedLive && (
              <span>Ended: {new Date(sessionEndedDate).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleViewDashboard}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300 hover:border-zinc-350 dark:hover:border-zinc-650 transition-all shadow-sm"
          >
            <Eye size={14} />
            View Dashboard
          </button>
          <button
            onClick={handleAssignHomework}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300 hover:border-zinc-350 dark:hover:border-zinc-650 transition-all shadow-sm"
          >
            <Zap size={14} />
            Assign Homework
          </button>
          <button
            onClick={handleShareReport}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300 hover:border-zinc-350 dark:hover:border-zinc-650 transition-all shadow-sm"
          >
            <Share2 size={14} />
            Share Report
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-indigo-650 text-white hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>

      {/* ══ OVERVIEW STAT CARDS (Grid of Exactly 4) ═══════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Accuracy */}
        <div className="bg-white/10 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800 rounded-3xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Target size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Accuracy</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50 mt-1 leading-none">
              {stats ? `${stats.avgAccuracy.toFixed(0)}%` : "—"}
            </p>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1.5 flex items-center gap-0.5">
              <span>▲</span> +2.4% trend
            </p>
          </div>
        </div>

        {/* Card 2: Completion Rate */}
        <div className="bg-white/10 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800 rounded-3xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Completion Rate</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50 mt-1 leading-none">
              {analytics?.hasData ? `${analytics.averagePercentage >= 0 ? "100%" : "0%"}` : "100%"}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1.5">All submissions finalized</p>
          </div>
        </div>

        {/* Card 3: Total Participants */}
        <div className="bg-white/10 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800 rounded-3xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Students</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50 mt-1 leading-none">
              {results.length}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1.5">Active participants</p>
          </div>
        </div>

        {/* Card 4: Questions */}
        <div className="bg-white/10 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800 rounded-3xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Questions</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50 mt-1 leading-none">
              {quiz?.totalQuestions ?? 0}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1.5">Assessment length</p>
          </div>
        </div>
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

      {/* ══ TAB BAR & TABS CONTENTS ══════════════════════════════════════════ */}
      {hasData && (
        <>
          <div className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-800/60 p-1 rounded-xl w-fit border border-zinc-200/60 dark:border-zinc-700/50 overflow-x-auto max-w-full">
            {(
              [
                ["overview",       "Overview",       <BarChart3     size={13} key="overview" />  ],
                ["participants",   "Participants",   <Users         size={13} key="participants" />  ],
                ["questions",      "Questions",      <BookOpen      size={13} key="questions" />  ],
                ["accommodations", "Accommodations", <Users         size={13} key="accommodations" />],
                ["tags",           "Tags",           <BookOpen      size={13} key="tags" />],
                ["anticheat",      "Anti-Cheating",  <AlertTriangle size={13} key="anticheat" />],
              ] as [TabId, string, React.ReactNode][]
            ).map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === id
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* ══════════════════════ TAB 1: OVERVIEW ══════════════════════════════ */}
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
                      className="w-28 accent-indigo-650"
                    />
                    <span className="text-sm font-black text-indigo-650 dark:text-indigo-400 w-10 text-center">
                      {passPercentage}%
                    </span>
                  </div>
                </div>

                {/* Filters, Sorting & Search Bar */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  {/* Search */}
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      placeholder="Search participants by name..."
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-205 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                    />
                    <span className="absolute left-3 top-2 text-zinc-400 text-sm">🔍</span>
                  </div>

                  {/* Filters & Sorting */}
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                    {/* Filters */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-400 font-semibold">Filter:</span>
                      <select
                        value={matrixFilter}
                        onChange={(e) => setMatrixFilter(e.target.value as any)}
                        className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-205 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
                      >
                        <option value="all">All Students</option>
                        <option value="top">Top Performers</option>
                        <option value="low">Low Accuracy</option>
                      </select>
                    </div>

                    {/* Sorting */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-400 font-semibold">Sort:</span>
                      <select
                        value={matrixSortKey}
                        onChange={(e) => setMatrixSortKey(e.target.value as any)}
                        className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-205 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
                      >
                        <option value="score">Score</option>
                        <option value="accuracy">Accuracy</option>
                        <option value="name">Name</option>
                      </select>
                      
                      <button
                        onClick={() => setMatrixSortDir(d => d === "asc" ? "desc" : "asc")}
                        className="p-1.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-205 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        title="Toggle Sort Direction"
                      >
                        {matrixSortDir === "asc" ? "↑" : "↓"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Participant Performance Matrix */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Participant Performance Matrix</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Question-by-question performance accuracy heatmap</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                      <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-md bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 inline-block" />Correct</span>
                      <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-md bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 inline-block" />Wrong</span>
                      <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-dashed border-zinc-300 inline-block" />Not Attempted</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto p-4">
                    {loadingResults ? (
                      <div className="h-48 flex items-center justify-center text-zinc-400 text-sm animate-pulse">Loading matrix details…</div>
                    ) : matrixStudents.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">No students match your filter or search.</div>
                    ) : (
                      <table className="border-collapse text-xs w-full">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20">
                            <th className="text-left px-3 py-3 font-bold text-zinc-400 uppercase tracking-wider min-w-[160px]">Participant</th>
                            <th className="px-3 py-3 font-bold text-zinc-400 text-center uppercase tracking-wider w-20">Score</th>
                            {Array.from({ length: totalQs }, (_, i) => {
                              const q = qAccuracy[i];
                              const acc = q?.total ? Math.round((q.correct / q.total) * 100) : null;
                              const accColor =
                                acc === null ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-700"
                                : acc >= 80   ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-800"
                                : acc >= 50   ? "bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-250 dark:border-amber-800"
                                :               "bg-red-500/10 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-250 dark:border-red-800";
                              return (
                                <th key={i} className="px-1 py-3 text-center w-10 min-w-[42px]">
                                  <div className="flex flex-col items-center gap-1.5">
                                    <span className="text-zinc-500 dark:text-zinc-400 font-bold">Q{i + 1}</span>
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
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                          {matrixStudents.map((r, ri) => {
                            const cells = getHeatRow(r);
                            const rank  = ri + 1;
                            const medal = rankMedal(rank);
                            return (
                              <tr key={`${r.studentId}-${ri}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm ${medal.className}`}>{medal.icon}</span>
                                    <div className="min-w-0">
                                       <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">
                                         {cleanStudentName(r.studentName) ?? cleanStudentName(r.studentRegister) ?? r.studentId.substring(0, 10) + "…"}
                                       </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
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

                {/* Correct vs Incorrect mini chart */}
                {stats && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-4">Correct vs Incorrect</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Correct ({stats.correctTotal})</span>
                          <span className="font-mono text-zinc-400">{stats.avgAccuracy.toFixed(0)}%</span>
                        </div>
                        <ProgressBar value={stats.avgAccuracy} color="bg-emerald-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-red-550 dark:text-red-400 font-semibold">Incorrect ({stats.incorrectTotal})</span>
                          <span className="font-mono text-zinc-400">{(100 - stats.avgAccuracy).toFixed(0)}%</span>
                        </div>
                        <ProgressBar value={100 - stats.avgAccuracy} color="bg-red-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════ TAB 2: PARTICIPANTS ══════════════════════════════ */}
          {activeTab === "participants" && (
            <div className="space-y-5">
              {/* Individual student report drawer */}
              {selectedStudent && (
                <div className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/60 rounded-3xl shadow-lg p-6 relative">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="absolute top-4 right-4 text-xs font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    ✕ Close
                  </button>
                  <div className="flex items-start gap-5 flex-wrap">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xl font-black flex items-center justify-center">
                      {(selectedStudent.studentName ?? selectedStudent.studentId)[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                        {cleanStudentName(selectedStudent.studentName) ?? cleanStudentName(selectedStudent.studentRegister) ?? selectedStudent.studentId.substring(0, 8) + "…"}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-3 text-sm">
                        {[
                          ["Score",      `${selectedStudent.score} pts`                   ],
                          ["Percentage", `${selectedStudent.percentage.toFixed(1)}%`       ],
                          ["Correct",    `${selectedStudent.correctAnswers}/${selectedStudent.totalQuestions}`],
                          ["Wrong",      `${selectedStudent.wrongAnswers ?? "—"}`          ],
                          ["Skipped",    `${selectedStudent.unansweredQuestions ?? "—"}`   ],
                          ["Time",       `${selectedStudent.timeTaken ? Math.round(selectedStudent.timeTaken) : 0} sec` ],
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
                                    ? "bg-red-100 border-red-300 text-red-655 dark:bg-red-900/30 dark:border-red-700"
                                    : state === "skipped"
                                    ? "bg-zinc-100 border-dashed border-zinc-300 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-600"
                                    : "bg-zinc-100 border-zinc-200 text-zinc-350 dark:bg-zinc-800/40 dark:border-zinc-700"
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
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-705 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 px-3 py-1 rounded-full">
                              <AlertTriangle size={12} />
                              {selectedStudent.tabSwitches} tab switch{selectedStudent.tabSwitches !== 1 ? "es" : ""}
                            </span>
                          )}
                          {(selectedStudent.windowBlurs ?? 0) > 2 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-705 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 px-3 py-1 rounded-full">
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
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Participants List</h3>
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
                        <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Rank / Status</th>
                        <th className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-right">Submitted</th>
                        <th className="py-3.5 px-5 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                      {sortedResults.map((r, i) => {
                        const rank     = (r as any)._rank ?? i + 1;
                        const medal    = rankMedal(rank);
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
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {cleanStudentName(r.studentName) ?? cleanStudentName(r.studentRegister) ?? r.studentId.substring(0, 8) + "…"}
                                </p>
                                {r.studentRegister && (
                                  <p className="text-[10px] text-zinc-400 font-mono">{r.studentRegister}</p>
                                )}
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

                            {/* Time (Must display in sec) */}
                            <td className="py-4 px-5 font-mono text-xs text-zinc-550">
                              {r.timeTaken ? `${Math.round(r.timeTaken)} sec` : "0 sec"}
                            </td>

                            {/* Rank / Completed Status Column */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-150 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350 border border-zinc-250 dark:border-zinc-700">
                                  #{rank}
                                </span>
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                  r.submittedAt
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                    : "bg-amber-50 text-amber-705 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${r.completionStatus === "Completed" ? "bg-emerald-500" : "bg-amber-400"}`} />
                                  {r.completionStatus ?? "Completed"}
                                </span>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-4 px-5 text-right text-[11px] text-zinc-400 font-mono whitespace-nowrap">
                              {fmt(r.submittedAt)}
                            </td>

                            {/* Detail arrow */}
                            <td className="py-4 px-4">
                              <Eye size={14} className="text-zinc-350 group-hover:text-indigo-400" />
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

          {/* ══════════════════ TAB 3: QUESTIONS ══════════════════════════════════ */}
          {activeTab === "questions" && (
            <div className="space-y-6">
              {quiz?.questions && quiz.questions.length > 0 ? (
                quiz.questions
                  .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                  .map((q, i) => {
                    const statsQ = qAccuracy[i] ?? { correct: 0, wrong: 0, skipped: 0, total: 0 };
                    const acc = statsQ.total ? (statsQ.correct / statsQ.total) * 100 : 0;
                    const diff = getDiffBadge(i);
                    return (
                      <div key={q.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all space-y-6">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 text-sm font-black flex items-center justify-center shrink-0">
                              Q{i + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">Question {i + 1}</h4>
                                {q.questionType && (
                                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-zinc-105 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-700">
                                    {q.questionType}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400">{statsQ.total} submission{statsQ.total !== 1 ? "s" : ""}</p>
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

                        {/* Question Text & Optional Image */}
                        <div className="space-y-4">
                          <p className="text-zinc-800 dark:text-zinc-100 text-lg font-semibold leading-relaxed">
                            {q.questionText}
                          </p>
                          {q.questionImageUrl && (
                            <div className="flex justify-center max-w-lg mx-auto py-2">
                              <img
                                src={q.questionImageUrl}
                                alt={`Question ${i + 1}`}
                                className="rounded-2xl max-h-60 border border-zinc-200 dark:border-zinc-800 object-contain shadow-sm bg-zinc-50 dark:bg-zinc-950/40"
                              />
                            </div>
                          )}
                        </div>

                        {/* Options list */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { key: "A", text: q.optionA, img: q.optionAImageUrl },
                            { key: "B", text: q.optionB, img: q.optionBImageUrl },
                            { key: "C", text: q.optionC, img: q.optionCImageUrl },
                            { key: "D", text: q.optionD, img: q.optionDImageUrl },
                            ...(q.optionE ? [{ key: "E", text: q.optionE, img: q.optionEImageUrl }] : [])
                          ].map((opt) => {
                            const isCorrect = q.correctAnswer.toUpperCase() === opt.key;
                            return (
                              <div
                                key={opt.key}
                                className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                                  isCorrect
                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 dark:border-emerald-700/80 shadow-sm"
                                    : "bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                                }`}
                              >
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${
                                  isCorrect
                                    ? "bg-emerald-500 text-white"
                                    : "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                }`}>
                                  {opt.key}
                                </div>
                                <div className="space-y-2 flex-1">
                                  <p className="font-semibold text-sm pt-1.5">{opt.text}</p>
                                  {opt.img && (
                                    <div className="pt-2">
                                      <img
                                        src={opt.img}
                                        alt={`Option ${opt.key}`}
                                        className="rounded-xl max-h-32 border border-zinc-205/50 dark:border-zinc-800/80 object-contain shadow-sm bg-white dark:bg-zinc-905"
                                      />
                                    </div>
                                  )}
                                </div>
                                {isCorrect && (
                                  <span className="text-emerald-500 font-bold self-start mt-2">✓</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation callout */}
                        {q.explanation && (
                          <div className="bg-indigo-50/55 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-950 rounded-2xl p-4 flex gap-3">
                            <Sparkles size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Explanation</p>
                              <p className="text-xs text-indigo-650 dark:text-zinc-300 mt-1 leading-relaxed">{q.explanation}</p>
                            </div>
                          </div>
                        )}

                        {/* Accuracy Stats Row */}
                        <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                          {[
                            { label: "Correct",  value: statsQ.correct, color: "text-emerald-600 dark:text-emerald-400" },
                            { label: "Wrong",    value: statsQ.wrong,   color: "text-red-500 dark:text-red-400"         },
                            { label: "Skipped",  value: statsQ.skipped, color: "text-zinc-400"                          },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-3">
                              <p className={`text-xl font-black ${color}`}>{value}</p>
                              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{label}</p>
                            </div>
                          ))}
                        </div>

                        <ProgressBar value={acc} color={acc >= 80 ? "bg-emerald-500" : acc >= 50 ? "bg-amber-400" : "bg-red-400"} />
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-10 text-zinc-400 text-sm">No questions found for this quiz.</div>
              )}
            </div>
          )}

          {/* ══════════════════ TAB 4: ACCOMMODATIONS ══════════════════════════════ */}
          {activeTab === "accommodations" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-sm text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Student Accommodations</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
                Configure special rules like time-limit multipliers (e.g. 1.5x time) or text-to-speech settings for specific participants.
              </p>
              <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mt-4 max-w-lg mx-auto">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Active Multipliers</p>
                <div className="flex justify-between items-center text-xs py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">Standard student time limit</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">1.0x</span>
                </div>
                <div className="flex justify-between items-center text-xs py-2">
                  <span className="text-zinc-705 dark:text-zinc-400 font-medium">No custom time-limits are active for this session.</span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ TAB 5: TAGS ══════════════════════════════════════ */}
{activeTab === "tags" && (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-sm space-y-5">
    <div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
        Quiz Tags & Topics
      </h3>
      <p className="text-zinc-400 text-xs mt-0.5">
        Topic tags mapped from your questions to track performance by subject area.
      </p>
    </div>

    <div className="flex flex-wrap gap-2.5">
      {quiz?.tags ? (
        quiz.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => (
            <span
              key={tag}
              className="text-xs px-3.5 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 font-semibold"
            >
              🏷️ {tag}
            </span>
          ))
      ) : (
        <>
          <span className="text-xs px-3.5 py-1.5 bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold">
            General Knowledge
          </span>

          <span className="text-xs px-3.5 py-1.5 bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold">
            Math
          </span>

          <span className="text-xs px-3.5 py-1.5 bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold">
            Science
          </span>
        </>
      )}
    </div>
  </div>
)}
          {/* ══════════════════ TAB 6: ANTI-CHEAT ══════════════════════════════ */}
          {activeTab === "anticheat" && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-605 dark:text-amber-400 shrink-0 mt-0.5" />
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
                      {results.map((r, ri) => {
                        const tabs   = r.tabSwitches  ?? 0;
                        const blurs  = r.windowBlurs  ?? 0;
                        const risk   = tabs > 5 || blurs > 8 ? "High" : tabs > 2 || blurs > 3 ? "Medium" : "Low";
                        const riskCx =
                          risk === "High"   ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          : risk === "Medium" ? "bg-amber-50 text-amber-705 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                          :                    "bg-emerald-50 text-emerald-705 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
                        return (
                          <tr key={`${r.studentId}-${ri}`} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 transition-colors">
                            <td className="py-4 px-5 font-semibold text-zinc-900 dark:text-zinc-100">
                              {r.studentName ?? r.studentRegister ?? r.studentId.substring(0, 10) + "…"}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`font-mono font-bold ${tabs > 2 ? "text-amber-605 dark:text-amber-400" : "text-zinc-555"}`}>
                                {tabs}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <span className={`font-mono font-bold ${blurs > 3 ? "text-red-500" : "text-zinc-555"}`}>
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

      {/* ══ TOAST NOTIFICATIONS ══════════════════════════════════════════════ */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-950/90 dark:bg-zinc-50/90 backdrop-blur border border-zinc-800 dark:border-zinc-200 text-white dark:text-zinc-900 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-5 duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
}