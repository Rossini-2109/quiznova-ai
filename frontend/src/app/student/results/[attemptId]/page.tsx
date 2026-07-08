"use client";

import { useEffect, useState, use } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { Trophy, HelpCircle, Check, X, BookOpen, ArrowRight, Zap, RefreshCw } from "lucide-react";
import Link from "next/link";

interface ResultData {
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  percentage: number;
}

interface ReviewQuestion {
  questionText: string;
  yourAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const router = useRouter();

  const [result, setResult] = useState<ResultData | null>(null);
  const [review, setReview] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const resultRes = await api.get(`/attempts/result/${attemptId}`);
        setResult(resultRes.data);

        const reviewRes = await api.get(`/attempts/review/${attemptId}`);
        setReview(reviewRes.data);
      } catch (error) {
        console.error("Failed to load results/review", error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [attemptId]);

  if (loading) {
    return <div className="p-10 text-center text-zinc-400">Loading results...</div>;
  }

  if (!result) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h3 className="text-lg font-bold text-red-500 font-sans">Results Not Found</h3>
        <p className="text-zinc-400 text-sm mt-2">Make sure you completed the quiz before opening this page.</p>
      </div>
    );
  }

  const passed = result.percentage >= 50;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Top Banner Card */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-2xl shadow-violet-500/5 text-center flex flex-col items-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
          <Trophy size={32} />
        </div>

        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-zinc-900 via-violet-950 to-zinc-900 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
          {passed ? "Congratulations!" : "Keep Practicing!"}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 mb-8 max-w-sm mx-auto">
          {passed
            ? "You did an excellent job. Check the question breakdown below to review explanations."
            : "Review the answers below to strengthen your understanding of the weak topics."}
        </p>

        {/* Scoring Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full border-t border-zinc-100 dark:border-zinc-800/60 pt-6">
          <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl">
            <p className="text-zinc-400 text-[10px] uppercase font-bold">Accuracy</p>
            <p className="text-lg font-black text-violet-600 dark:text-violet-400 mt-0.5">{result.percentage.toFixed(0)}%</p>
          </div>
          <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl">
            <p className="text-zinc-400 text-[10px] uppercase font-bold">Correct</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{result.correctAnswers}</p>
          </div>
          <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl">
            <p className="text-zinc-400 text-[10px] uppercase font-bold">Incorrect</p>
            <p className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">{result.wrongAnswers}</p>
          </div>
          <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl">
            <p className="text-zinc-400 text-[10px] uppercase font-bold">Score</p>
            <p className="text-lg font-black mt-0.5">{result.score} pts</p>
          </div>
        </div>
      </div>

      {/* Question review detail panel */}
      {review.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent mb-4">
            Question Review
          </h2>

          <div className="space-y-4">
            {review.map((q, index) => (
              <div
                key={index}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex gap-4 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors"
              >
                <div className={`h-8 w-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                  q.isCorrect
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}>
                  {q.isCorrect ? <Check size={18} /> : <X size={18} />}
                </div>

                <div className="space-y-3 flex-1">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {q.questionText}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50">
                      <span className="text-zinc-400 font-semibold">Your Answer:</span>{" "}
                      <span className={`font-bold ${q.isCorrect ? "text-emerald-600" : "text-red-500"}`}>
                        Option {q.yourAnswer || "Not Answered"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50">
                      <span className="text-zinc-400 font-semibold">Correct Answer:</span>{" "}
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        Option {q.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-150 dark:border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                      <p className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <BookOpen size={12} />
                        Explanation
                      </p>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Nav Action */}
      <div className="flex pt-4">
        <Link
          href="https://quiznova-ai-eta.vercel.app/join"
          className="mx-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-2xl transition-all text-sm flex items-center gap-2 group shadow-xl"
        >
          Return to Join Page
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}