"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Brain, Trophy, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden flex flex-col justify-between">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] -z-10" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px] -z-10" />

      {/* Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-indigo-500/20">
              Q
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              QuizNova <span className="text-indigo-400 font-medium">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold hover:text-zinc-300 transition-all px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-200 px-5 py-2.5 rounded-xl shadow-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 flex-1 flex flex-col items-center justify-center text-center">
        {/* Sparkle Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles size={12} />
          Powered by Gemini 2.0 Flash
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight md:leading-tight mb-6">
          Generate Smart Quizzes in{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Seconds
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          The ultimate AI-powered educational platform. Upload lectures, PDFs, or study files to generate structured assessments. Students join instantly with a code.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all text-lg group cursor-pointer"
          >
            Create Free Account
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-all text-lg"
          >
            Demo Sign In
            <ChevronRight size={18} />
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left mt-8">
          <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm hover:border-zinc-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
              <Brain size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Quiz Generation</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Convert raw documents, PDFs, or slides into multiple choice assessments instantly with advanced NLP parsing.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm hover:border-zinc-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
              <Trophy size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Gamified Experience</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Keep students engaged. Award immediate scores, dynamic attempts tracking, and detailed feedback metrics.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm hover:border-zinc-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-6">
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