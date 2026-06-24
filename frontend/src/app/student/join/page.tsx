"use client";

import { useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { Compass, KeyRound, AlertCircle, RefreshCw } from "lucide-react";

// New join page: collect session code, student name, and employee/PS number

export default function JoinQuizPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleJoin = async () => {
    if (!code.trim()) {
      setError("Please enter a valid quiz join code");
      return;
    }
    if (!name.trim() || !empId.trim()) {
      setError("Please enter both name and employee/PS number.");
      return;
    }
    const empIdPattern = /^\d{8}$/;
    if (!empIdPattern.test(empId.trim())) {
      setError("Employee ID / PS Number must be exactly 8 digits.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const combinedName = `${name.trim()} (${empId.trim()})`;
      localStorage.setItem("studentName", combinedName);
      localStorage.setItem("employeeId", empId.trim());

      router.push(`/student/lobby/${code.trim()}`);
    } catch (err) {
      console.error(err);
      setError("Quiz not found. Double check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-2xl shadow-violet-500/5 text-center flex flex-col items-center">
        
        <div className="h-14 w-14 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-500 flex items-center justify-center mb-6">
          <Compass size={28} className="animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 via-violet-950 to-zinc-900 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
          Join a Quiz Assessment
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 mb-8 max-w-xs mx-auto">
          Enter the access code provided by your instructor to view and start the assessment.
        </p>

        <div className="w-full space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-4 top-3.5 text-zinc-500" size={18} />
            <input
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-400 text-center tracking-widest uppercase font-mono font-bold"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Join Code"
              maxLength={8}
            />
          </div>
          
          {/* Name Input */}
          <div className="relative">
            <KeyRound className="absolute left-4 top-3.5 text-zinc-500" size={18} />
            <input
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-400 text-center uppercase font-bold"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Your Name"
            />
          </div>

          {/* Employee ID Input */}
          <div className="relative">
            <KeyRound className="absolute left-4 top-3.5 text-zinc-500" size={18} />
            <input
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-400 text-center tracking-widest uppercase font-mono font-bold"
              value={empId}
              onChange={(e) => {
                setEmpId(e.target.value);
                setError("");
              }}
              placeholder="Employee ID / PS Number"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-left">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                Accessing Quiz...
              </>
            ) : (
              "Enter Lobby"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}