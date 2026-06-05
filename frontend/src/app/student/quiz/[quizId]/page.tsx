"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import api from "@/services/api";
import { Clock, BookOpen, AlertCircle, ArrowRight, Activity, Calendar } from "lucide-react";

type Quiz = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  questions: any[];
};

export default function QuizPreviewPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await api.get(`/quiz/${quizId}`);
        setQuiz(response.data);
      } catch (error) {
        console.error("Failed to load quiz details", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  const startQuiz = async () => {
    try {
      if (!quiz) return;
      setStarting(true);

      const response = await api.post("/quiz/start", {
        quizId: quiz.id,
      });

      const attemptId = response.data.id;
      if (attemptId) {
        router.push(`/student/quiz/play/${attemptId}`);
      } else {
        alert("Failed to initialize attempt. Incorrect response fields.");
      }
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to start quiz attempt"
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-zinc-400">Loading quiz overview...</div>;
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h3 className="text-lg font-bold text-red-500">Quiz Not Found</h3>
        <p className="text-zinc-400 text-sm mt-2">The assessment link you entered is invalid or deleted.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-2xl shadow-violet-500/5 space-y-6">
        
        {/* Title & badge */}
        <div className="space-y-3">
          <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
            quiz.difficulty === "Easy"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : quiz.difficulty === "Medium"
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          }`}>
            {quiz.difficulty} Difficulty
          </span>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            {quiz.title}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
            {quiz.description || "Review this quiz assessment details before starting. Good luck!"}
          </p>
        </div>

        {/* Details card list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-zinc-150 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-500 flex items-center justify-center flex-shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-zinc-400 text-[10px] uppercase font-bold">Duration</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{quiz.timeLimit} Mins</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="text-zinc-400 text-[10px] uppercase font-bold">Questions</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{quiz.questions?.length || 0} MCQ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-500 flex items-center justify-center flex-shrink-0">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-zinc-400 text-[10px] uppercase font-bold">Points</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{(quiz.questions?.length || 0) * 5} pts</p>
            </div>
          </div>
        </div>

        {/* Warning alerts */}
        <div className="flex gap-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Important Instructions:</p>
            <p className="leading-relaxed">
              Once you click Start, the floating timer will begin. If you close or reload the browser, the time will continue to tick. Make sure you have a stable network before beginning.
            </p>
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={startQuiz}
          disabled={starting}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-xl shadow-violet-500/10 hover:shadow-violet-500/20 transition-all flex items-center justify-center gap-2 group text-sm cursor-pointer"
        >
          {starting ? "Initializing Quiz Exam..." : "Start Quiz"}
          {!starting && <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
        </button>
      </div>
    </div>
  );
}