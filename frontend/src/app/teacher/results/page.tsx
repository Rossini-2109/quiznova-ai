"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import Link from "next/link";
import { FileText, ChevronRight, Activity, Calendar, HelpCircle } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  status: string;
  quizCode: string;
}

export default function TeacherResultsIndex() {
  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["results-quizzes"],
    queryFn: async () => {
      const res = await api.get("/quiz/all");
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-indigo-950 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
          Results & Analytics Hub
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
          Select a quiz to view student completion scores and AI-powered learning insights
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-zinc-400">Loading assessments...</div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-10 text-center max-w-md mx-auto shadow-sm">
          <h3 className="text-lg font-bold">No Quizzes Created</h3>
          <p className="text-zinc-400 text-sm mt-1">
            Once you create quizzes and publish them, their analytics hubs will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/teacher/results/${quiz.id}`}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-500/20 transition-all flex justify-between items-center group"
            >
              <div className="space-y-2">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                  quiz.status === "Published"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}>
                  {quiz.status}
                </span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-zinc-400 text-xs line-clamp-1 max-w-sm">
                  {quiz.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {quiz.timeLimit} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle size={12} />
                    {quiz.difficulty}
                  </span>
                </div>
              </div>

              <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500 transition-all">
                <ChevronRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}