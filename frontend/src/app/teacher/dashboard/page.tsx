"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Clock, Activity, Sparkles, Trophy, ArrowRight, ClipboardList } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  status: string;
  quizCode: string;
}

interface Attempt {
  id: string;
  quizId: string;
  score: number;
  percentage: number;
  startedAt: string;
  submittedAt: string;
}

export default function TeacherDashboard() {
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const quizRes = await api.get("/quiz/all");
      setQuizzes(quizRes.data);

      const attemptRes = await api.get("/attempts/all");
      setAttempts(attemptRes.data);
    } catch (error) {
      console.error("Failed to load dashboard statistics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const publishedCount = quizzes.filter((q) => q.status === "Published").length;
  const draftCount = quizzes.filter((q) => q.status === "Draft").length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-indigo-950 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
          Teacher Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
          Overview of educational quizzes, attempts, and AI generation features
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Total Quizzes</p>
            <p className="text-2xl font-black mt-0.5">{quizzes.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Published</p>
            <p className="text-2xl font-black mt-0.5">{publishedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Drafts</p>
            <p className="text-2xl font-black mt-0.5">{draftCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Total Attempts</p>
            <p className="text-2xl font-black mt-0.5">{attempts.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-zinc-800">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            <div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                <Sparkles size={18} className="fill-indigo-400/25" />
              </div>
              <h3 className="font-extrabold text-xl mb-2">QuizNova AI Engine</h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                Convert lectures, PDFs, docx question banks, or slides into multiple choice tests automatically in under a minute.
              </p>
            </div>
            <button
              onClick={() => router.push("/teacher/ai-generator")}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Open AI Generator
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base">Quick Shortcuts</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/teacher/quizzes/create")}
                className="w-full text-left px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-sm font-semibold transition-all flex items-center justify-between group cursor-pointer"
              >
                Create Quiz Manually
                <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => router.push("/teacher/quizzes")}
                className="w-full text-left px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-sm font-semibold transition-all flex items-center justify-between group cursor-pointer"
              >
                View Published Quizzes
                <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => router.push("/teacher/results")}
                className="w-full text-left px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-sm font-semibold transition-all flex items-center justify-between group cursor-pointer"
              >
                AI Analytics Hub
                <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Attempts Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-lg">Recent Student Activity</h3>
              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-500 font-semibold">
                Live Submissions
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-zinc-400 py-4 text-center">Loading attempts data...</p>
            ) : attempts.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">No quiz submissions yet.</p>
            ) : (
              <div className="space-y-3.5">
                {attempts.slice(0, 5).map((attempt, index) => {
                  const matchingQuiz = quizzes.find((q) => q.id === attempt.quizId);
                  return (
                    <div
                      key={attempt.id}
                      className="border border-zinc-100 dark:border-zinc-800/60 hover:border-zinc-200 dark:hover:border-zinc-700/80 rounded-2xl p-4 flex items-center justify-between text-sm transition-all"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {matchingQuiz ? matchingQuiz.title : "Unknown Quiz"}
                        </p>
                        <p className="text-xs text-zinc-400 font-medium">
                          Completed on: {new Date(attempt.submittedAt || attempt.startedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-indigo-600 dark:text-indigo-400">{attempt.score} pts</p>
                        <p className="text-xs text-zinc-400 font-semibold mt-0.5">{attempt.percentage.toFixed(0)}% accuracy</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
interface ChevronRightProps {
  size?: number;
  className?: string;
}
const ChevronRight = ({ size = 16, className = "" }: ChevronRightProps) => (
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
    <path d="m9 18 6-6-6-6" />
  </svg>
);