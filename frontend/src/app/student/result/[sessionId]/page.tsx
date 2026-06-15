"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/services/api";
import {
  Trophy,
  Check,
  X,
  Clock,
  ArrowRight,
  Award,
} from "lucide-react";

interface ParticipantResult {
  id: string;
  studentName: string;
  employeeId: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  averageTime: number;
  rank: number;
  completedAt: string;
}

export default function StudentResultPage() {
  const { sessionId } = useParams() as { sessionId: string };

  const [result, setResult] =
    useState<ParticipantResult | null>(null);

  const [loading, setLoading] = useState(true);

  const [confettiParticles] = useState(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 4,
      rotation: Math.random() * 360,
      duration: Math.random() * 8 + 8,
      delay: Math.random() * 3,
      color: [
        "#a855f7",
        "#ec4899",
        "#3b82f6",
        "#10b981",
        "#f59e0b",
      ][Math.floor(Math.random() * 5)],
    }))
  );

  // Expose fetchResult for manual refresh
  const fetchResult = async (retry = false) => {
    let myResult: ParticipantResult | null = null;
    try {
      const res = await api.get(`/LiveQuiz/${sessionId}/results`);
      const results: ParticipantResult[] = res.data;
      if (results && results.length > 0) {
        myResult = results[0];
      }
      setResult(myResult);
    } catch (err) {
      console.error('Failed to load live quiz result', err);
    } finally {
      setLoading(false);
      if (!myResult && !retry) {
        // start polling if not found, up to 12 attempts (≈36s)
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const res = await api.get(`/LiveQuiz/${sessionId}/results`);
            const results: ParticipantResult[] = res.data;
            if (results && results.length > 0) {
              setResult(results[0]);
              clearInterval(pollInterval);
            } else if (attempts >= 30) {
              // give up after attempts
              clearInterval(pollInterval);
              setResult(null);
            }
          } catch (e) {
            console.error('Polling error', e);
          }
        }, 3000);
      }
    }
  };

  // Initial load effect
  useEffect(() => {
    if (!sessionId) {
      // If sessionId is missing, stop loading and show a helpful message
      setLoading(false);
      console.warn('No sessionId provided to result page.');
      return;
    }
    fetchResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0722] flex flex-col items-center justify-center text-white gap-4">
        <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 font-semibold animate-pulse">
          Calculating Score Cards...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0d0722] flex flex-col items-center justify-center text-white gap-4">
        <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 font-semibold animate-pulse">
          Waiting for results to be processed...
        </p>
        <button
          onClick={() => fetchResult()}
          className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
        >
          Retry Now
        </button>
        <Link
          href="/student/dashboard"
          className="mt-6 px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const totalQuestions =
    result.correctCount +
    result.incorrectCount;

  const accuracy =
    totalQuestions === 0
      ? 0
      : Math.round(
          (result.correctCount / totalQuestions) * 100
        );

  const averageTimeSec = (
    result.averageTime / 1000
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-[#0d0722] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {confettiParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              top: `${p.y}%`,
              left: `${p.x}%`,
              rotate: p.rotation,
            }}
            animate={{
              top: "110%",
              left: `${p.x + Math.random() * 20 - 10}%`,
              rotate: p.rotation + 360,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "linear",
              repeat: Infinity,
            }}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-lg z-10 flex flex-col gap-6">

        {/* Top Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center text-center shadow-2xl">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-black flex items-center justify-center mb-6">
            <Trophy size={40} />
          </div>

          <h1 className="text-3xl font-black">
            {accuracy >= 70
              ? "Fantastic Performance!"
              : "Good Effort!"}
          </h1>

          <div className="mt-8">
            <span className="text-zinc-500 text-xs uppercase">
              Final Score
            </span>

            <div className="text-5xl font-black text-purple-400 mt-2">
              {result.score}
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-4xl font-black">
              {accuracy}%
            </div>

            <div className="text-zinc-500 text-xs uppercase">
              Accuracy
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">

          <div className="bg-white/5 rounded-2xl p-4">
            <Award className="text-purple-400 mb-2" />
            <p className="text-zinc-500 text-xs">
              Rank
            </p>
            <p className="text-xl font-black">
              #{result.rank}
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4">
            <Clock className="text-blue-400 mb-2" />
            <p className="text-zinc-500 text-xs">
              Avg Speed
            </p>
            <p className="text-xl font-black">
              {averageTimeSec}s
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4">
            <Check className="text-green-400 mb-2" />
            <p className="text-zinc-500 text-xs">
              Correct
            </p>
            <p className="text-xl font-black text-green-400">
              {result.correctCount}
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4">
            <X className="text-red-400 mb-2" />
            <p className="text-zinc-500 text-xs">
              Wrong
            </p>
            <p className="text-xl font-black text-red-400">
              {result.incorrectCount}
            </p>
          </div>

        </div>

        <Link
          href="/student/dashboard"
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-center flex items-center justify-center gap-2"
        >
          Return to Dashboard
          <ArrowRight size={18} />
        </Link>

      </div>
    </div>
  );
}