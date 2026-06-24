"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Brain, Trophy, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900/30 via-zinc-950 to-zinc-950 text-white relative overflow-hidden flex flex-col justify-between">
  {/* Background decoration */}
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-800/30 via-zinc-900 to-zinc-900 -z-10" />
  <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/10 blur-[150px] -z-10" />
  <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px] -z-10" />

      {/* Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-500 to-cyan-500 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-violet-500/20">
              Q
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              QuizNova <span className="text-violet-400 font-medium">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold hover:text-zinc-300 transition-all px-4 py-2"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white px-5 py-2.5 rounded-xl shadow-lg transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 flex-1 flex flex-col items-center justify-center text-center">
        {/* Sparkle Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles size={12} />
          Powered by Gemini 2.0 Flash
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight md:leading-tight mb-6">
          Generate Smart Quizzes in{" "}
          <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Seconds
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          The ultimate AI-powered educational platform. Upload lectures, PDFs, or study files to generate structured assessments. Students join instantly with a code.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-violet-500/15 hover:shadow-violet-500/25 transition-all text-lg group cursor-pointer"
          >
            Sign Up
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-all text-lg"
          >
            Login
            <ChevronRight size={18} />
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left mt-8">
          <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm hover:border-violet-500/30 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-6">
              <Brain size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Quiz Generation</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Convert raw documents, PDFs, or slides into multiple choice assessments instantly with advanced NLP parsing.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6">
              <Trophy size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Gamified Experience</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Keep students engaged. Award immediate scores, dynamic attempts tracking, and detailed feedback metrics.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Advanced AI Insights</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Aggregate student attempts and failures to identify weak conceptual topics and generate revision guides.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-zinc-600 text-sm">
        &copy; {new Date().getFullYear()} QuizNova AI. All rights reserved.
      </footer>
    </div>
  );
}
