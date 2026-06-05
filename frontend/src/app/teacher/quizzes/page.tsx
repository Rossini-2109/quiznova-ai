"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Plus, BookOpen, Clock, Activity, Share2, Edit3, Trash2, ShieldAlert, Sparkles, Trophy } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  status: string;
  quizCode: string;
}

export default function QuizManagementPage() {
  const router = useRouter();

  const {
    data: quizzes = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Quiz[]>({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const res = await api.get("/quiz/all");
      return res.data;
    },
  });

  const handlePublish = async (quizId: string) => {
    try {
      await api.put(`/quiz/publish/${quizId}`);
      alert("Quiz published successfully");
      refetch();
    } catch (error) {
      console.error(error);
      alert("Failed to publish quiz");
    }
  };

  const handleDelete = async (quizId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this quiz?");
    if (!confirmed) return;

    try {
      await api.delete(`/quiz/${quizId}`);
      alert("Quiz deleted successfully");
      refetch();
    } catch (error) {
      console.error(error);
      alert("Failed to delete quiz");
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Quiz code copied!");
    } catch {
      alert("Failed to copy quiz code");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-400">Loading quizzes...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-indigo-950 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
            Manage Assessments
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Create, publish, edit, and analyze quizzes for your students
          </p>
        </div>

        <button
          onClick={() => router.push("/teacher/quizzes/create")}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all text-sm cursor-pointer"
        >
          <Plus size={16} />
          Create Quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-10 text-center max-w-md mx-auto shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-4">
            <BookOpen size={20} />
          </div>
          <h3 className="text-lg font-bold">No Quizzes Found</h3>
          <p className="text-zinc-400 text-sm mt-1 mb-6">
            Get started by creating a quiz manually or parsing learning files with the AI Generator.
          </p>
          <button
            onClick={() => router.push("/teacher/quizzes/create")}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl"
          >
            Create Your First Quiz
          </button>
        </div>
      ) : (
        /* Quizzes Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {quiz.title}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    quiz.status === "Published"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}>
                    {quiz.status}
                  </span>
                </div>

                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 line-clamp-2">
                  {quiz.description || "No description provided."}
                </p>

                {/* Info row */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 rounded-xl p-3 mb-6 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="text-center">
                    <p className="font-semibold text-zinc-400">Difficulty</p>
                    <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{quiz.difficulty}</p>
                  </div>
                  <div className="text-center border-x border-zinc-200/50 dark:border-zinc-800/50">
                    <p className="font-semibold text-zinc-400">Time Limit</p>
                    <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{quiz.timeLimit}m</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-zinc-400">Join Code</p>
                    <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {quiz.quizCode || "---"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                <button
                  onClick={() => router.push(`/teacher/quizzes/${quiz.id}`)}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Questions
                </button>

                <button
                  onClick={() => router.push(`/teacher/quizzes/edit/${quiz.id}`)}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Edit
                </button>

                {quiz.status !== "Published" ? (
                  <button
                    onClick={() => handlePublish(quiz.id)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Publish
                  </button>
                ) : (
                  <button
                    onClick={() => handleCopyCode(quiz.quizCode)}
                    className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 size={12} />
                    Copy Code
                  </button>
                )}

                <button
                  onClick={() => router.push(`/teacher/results/${quiz.id}`)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trophy size={12} />
                  Results
                </button>

                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded-xl text-xs transition-colors ml-auto cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}