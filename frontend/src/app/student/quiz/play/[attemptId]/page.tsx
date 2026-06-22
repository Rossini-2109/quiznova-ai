"use client";

import { useEffect, useState, use } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

type Question = {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type QuizData = {
  id: string;
  title: string;
  timeLimit: number;
  questions: Question[];
};

export default function QuizPlayerPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { answers, saveAnswer, clearAnswers } = useQuizStore();

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await api.get(`/Attempts/${attemptId}`);
        setQuiz(response.data);
        setTimeLeft(response.data.timeLimit * 60);
      } catch (error) {
        console.error("Failed to load attempt", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [attemptId]);

  const submitQuiz = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const payload = {
        attemptId,
        answers,
      };

      const response = await api.post("/Attempts/submit", payload);
      
      alert(`Quiz Completed! Your Score: ${response.data.score}`);
      
      // Clear local store answers
      clearAnswers();

      router.push(`/student/results/${attemptId}`);
    } catch (error) {
      console.error("Submission failed", error);
      alert("Failed to submit quiz responses. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!quiz) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz]);

  if (loading) {
    return <div className="p-10 text-center text-zinc-400">Loading quiz materials...</div>;
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <h3 className="text-lg font-bold text-red-500">Quiz Empty or Not Found</h3>
        <p className="text-zinc-400 text-sm">This quiz has no questions or your attempt could not load.</p>
        <button
          onClick={() => router.push("/student/dashboard")}
          className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const question = quiz.questions[currentQuestionIndex];
  const selectedAnswer = answers[question.id];

  const optionKeys = ["A", "B", "C", "D"] as const;
  const optionValues = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  } as const;

  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

useEffect(() => {
  if (!quiz) return;
  // Auto-submit after 15th question (index 14)
  if (currentQuestionIndex === 14) {
    submitQuiz();
  }
}, [currentQuestionIndex, quiz]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Top sticky navbar for timer */}
      <div className="flex justify-between items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-5 shadow-sm sticky top-6 z-20">
        <div className="space-y-0.5">
          <h1 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 truncate max-w-md">
            {quiz.title}
          </h1>
          <p className="text-zinc-400 text-xs font-semibold">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 px-3.5 py-2 rounded-xl font-mono font-bold text-sm border border-red-500/20">
          <Clock size={16} className="animate-pulse" />
          <span>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-600 transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Active Question Box */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed">
          {question.questionText}
        </h2>

        {/* Options Stack */}
        <div className="grid grid-cols-1 gap-3.5">
          {optionKeys.map((key) => {
            const label = optionValues[key];
            const isSelected = selectedAnswer === key;
            return (
              <button
                key={key}
                onClick={() => saveAnswer(question.id, key)}
                className={`w-full text-left px-5 py-4.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer group ${
                  isSelected
                    ? "bg-violet-500/5 border-violet-500 ring-2 ring-violet-500/20"
                    : "border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  isSelected
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-600"
                }`}>
                  {key}
                </span>
                <span className={`font-semibold text-sm ${
                  isSelected ? "text-zinc-950 dark:text-white" : "text-zinc-700 dark:text-zinc-300"
                }`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center gap-4">
        <button
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
          className="px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {!isLastQuestion ? (
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-600/10 hover:shadow-violet-600/20 transition-all flex items-center gap-1 cursor-pointer"
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={submitQuiz}
            disabled={submitting}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={14} />
                Submit Quiz
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}