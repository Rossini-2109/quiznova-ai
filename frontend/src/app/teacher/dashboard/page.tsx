"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Clock, Activity, Sparkles, Trophy, ArrowRight, ClipboardList, FolderOpen } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  status: string;
  quizCode: string;
  folderId?: string;
  folderName?: string;
}

interface Attempt {
  id: string;
  quizId: string;
  score: number;
  percentage: number;
  startedAt: string;
  submittedAt: string;
  studentName?: string;
}

interface Folder {
  id: string;
  name: string;
  quizCount: number;
}

export default function TeacherDashboard() {
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [quizRes, attemptRes, folderRes] = await Promise.all([
        api.get("/quiz/all"),
        api.get("/attempts/all"),
        api.get("/folders/all").catch(() => ({ data: [] })),
      ]);
      setQuizzes(quizRes.data);
      setAttempts(attemptRes.data);
      setFolders(folderRes.data || []);
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
  const folderCount = folders.length;

  const recentAttempts = [...attempts]
    .sort((a, b) => new Date(b.submittedAt || b.startedAt).getTime() - new Date(a.submittedAt || a.startedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Teacher Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
          Overview of educational quizzes, attempts, and AI generation features
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-violet-500/10 transition-all">
          <div className="h-12 w-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Total Quizzes</p>
            <p className="text-2xl font-black mt-0.5 text-white">{quizzes.length}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-emerald-500/10 transition-all">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Published</p>
            <p className="text-2xl font-black mt-0.5 text-white">{publishedCount}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-amber-500/10 transition-all">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Drafts</p>
            <p className="text-2xl font-black mt-0.5 text-white">{draftCount}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-cyan-500/10 transition-all">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Total Attempts</p>
            <p className="text-2xl font-black mt-0.5 text-white">{attempts.length}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-pink-500/10 transition-all">
          <div className="h-12 w-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
            <FolderOpen size={22} />
          </div>
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Folders</p>
            <p className="text-2xl font-black mt-0.5 text-white">{folderCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-violet-600 to-cyan-600 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-violet-500/30">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div>
              <div className="h-10 w-10 rounded-xl bg-white/20 text-white flex items-center justify-center mb-6">
                <Sparkles size={18} className="fill-white/25" />
              </div>
              <h3 className="font-extrabold text-xl mb-2">QuizNova AI Engine</h3>
              <p className="text-white/80 text-xs leading-relaxed mb-6">
                Convert lectures, PDFs, docx question banks, or slides into multiple choice tests automatically in under a minute.
              </p>
            </div>
            <button
              onClick={() => router.push("/teacher/ai-generator")}
              className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-sm"
            >
              Open AI Generator
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Quick Shortcuts</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/teacher/quizzes/create")}
                className="w-full text-left px-4 py-3 rounded-xl border border-violet-200 dark:border-violet-800/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-sm font-semibold transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-zinc-700 dark:text-zinc-200">Create Quiz Manually</span>
                <ArrowRight size={14} className="text-violet-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => router.push("/teacher/quizzes")}
                className="w-full text-left px-4 py-3 rounded-xl border border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-sm font-semibold transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-zinc-700 dark:text-zinc-200">View Published Quizzes</span>
                <ArrowRight size={14} className="text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => router.push("/teacher/results")}
                className="w-full text-left px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-semibold transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-zinc-700 dark:text-zinc-200">AI Analytics Hub</span>
                <ArrowRight size={14} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => router.push("/teacher/folders")}
                className="w-full text-left px-4 py-3 rounded-xl border border-pink-200 dark:border-pink-800/50 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-sm font-semibold transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-zinc-700 dark:text-zinc-200">Library & Folders</span>
                <ArrowRight size={14} className="text-pink-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Attempts Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-lg bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Recent Student Activity</h3>
              <span className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-1 rounded text-zinc-500 font-semibold">
                Live Submissions
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-zinc-400 py-4 text-center">Loading attempts data...</p>
            ) : recentAttempts.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">No quiz submissions yet.</p>
            ) : (
              <div className="space-y-3.5">
                {recentAttempts.map((attempt, index) => {
                  const matchingQuiz = quizzes.find((q) => q.id === attempt.quizId);
                  const matchingStudent = attempt.studentName || "Unknown Student";
                  return (
                    <div
                      key={attempt.id}
                      className="border border-zinc-100 dark:border-zinc-800/60 hover:border-violet-200 dark:hover:border-violet-700/80 rounded-2xl p-4 flex items-center justify-between text-sm transition-all bg-gradient-to-r from-transparent to-violet-500/5"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {matchingQuiz ? matchingQuiz.title : "Unknown Quiz"}
                        </p>
                        <p className="text-xs text-zinc-400 font-medium">
                          Student: {matchingStudent}
                        </p>
                        <p className="text-xs text-zinc-400 font-medium">
                          Completed on: {new Date(attempt.submittedAt || attempt.startedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-violet-600 dark:text-violet-400">{attempt.score} pts</p>
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
