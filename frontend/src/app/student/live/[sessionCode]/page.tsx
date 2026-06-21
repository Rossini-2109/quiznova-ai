"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as signalR from "@microsoft/signalr";
import api from "@/services/api";
import {
  startConnection,
  stopConnection,
  getConnection,
  reportSuspicion,
  updateCurrentQuestion,
} from "@/lib/signalr";
import type { HubConnection } from "@microsoft/signalr";
import { Clock, ShieldAlert, Sparkles, Loader2, Check } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionType: string;
  questionTimeLimit: number;
}

export default function StudentLivePage() {
  const params = useParams();
  const router = useRouter();
  // Sanitize sessionCode to remove any query parameters (e.g., "?" suffix)
  const rawSessionCode = params.sessionCode as string;
  const sessionCode = rawSessionCode ? rawSessionCode.split('?')[0] : '';


  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [theme, setTheme] = useState<string>("dark-purple");
  const [sessionId, setSessionId] = useState<string>("");
  const [quizStarted, setQuizStarted] = useState(false);  
  // Gameplay States
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [showSubmittedPopup, setShowSubmittedPopup] = useState<"submitted" | "timesup" | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Refs to prevent stale closures in SignalR callbacks
  const questionsRef = useRef<Question[]>([]);
  const sessionIdRef = useRef<string>("");
  const skipCountdownRef = useRef<boolean>(false);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Auto-redirect to result page when quiz is finished for this student
  useEffect(() => {
    if (isFinished && sessionId && sessionCode) {
      const finalizeAndRedirect = async () => {
        try {
          const studentName = localStorage.getItem("studentName");
          if (studentName) {
            await api.post(`/LiveQuiz/${sessionCode}/finish-student`, { studentName });
          }
        } catch (err) {
          console.error("Failed to finalize student quiz session", err);
        }
        router.push(`/student/result/${sessionId}`);
      };

      const timer = setTimeout(() => {
        finalizeAndRedirect();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isFinished, sessionId, sessionCode, router]);

  const startTimeRef = useRef<number>(0);
  const connectionRef = useRef<HubConnection | null>(null);

  // Fetch questions, state, and setup connection
  useEffect(() => {
    if (!sessionCode) return;
    const studentName = localStorage.getItem("studentName");
    if (!studentName) {
      router.replace(`/student/lobby/${sessionCode}`);
      return;
    }

    // Fetch questions and live quiz state
    Promise.all([
      api.get(`/LiveQuiz/${sessionCode}/quiz`),
      api.get(`/LiveQuiz/${sessionCode}/state`)
    ]).then(([quizRes, stateRes]) => {
      const qs = quizRes.data.questions || [];
      setQuestions(qs);
      questionsRef.current = qs;

      const sId = quizRes.data.sessionId || "";
      setSessionId(sId);
      sessionIdRef.current = sId;

      const state = stateRes.data;
      if (state.isStarted) {
        skipCountdownRef.current = true;
        setQuizStarted(true);
      }
      if (state.isPaused) {
        setIsPaused(true);
      }
      if (state.isEnded) {
        setIsFinished(true);
      }
      if (state.currentQuestionIndex !== undefined) {
        setCurrentIndex(state.currentQuestionIndex);
      }
      startTimeRef.current = Date.now();
    }).catch(err => {
      console.error("Failed to load quiz or state", err);
      alert("Failed to load quiz details.");
    });

    // Start SignalR connection using shared helper
    startConnection(sessionCode, studentName, localStorage.getItem("employeeId") || "").then(() => {
      const hub = getConnection();
      connectionRef.current = hub;

      // Re-join on reconnection
      hub.onreconnected(() => {
        hub.invoke("JoinSession", sessionCode, studentName, localStorage.getItem("employeeId") || "");
      });

      // Minimal onclose handler
      hub.onclose((error) => {
        console.warn('SignalR connection closed', error);
      });

      // Register listeners after connection is established
      hub.on("QuizPaused", () => setIsPaused(true));
      hub.on("QuizResumed", () => setIsPaused(false));
      hub.on("ThemeChanged", (newTheme: string) => setTheme(newTheme));
      hub.on("QuizStarted", () => setQuizStarted(true));

      hub.on("QuestionChanged", (direction: number) => {
        setCurrentIndex(prev => {
          const next = prev + direction;
          const targetIndex = Math.max(0, Math.min(next, questionsRef.current.length - 1));
          return targetIndex;
        });
        setSelectedOption(null);
        setIsSubmitted(false);
        setShowSubmittedPopup(null);
        setIsFinished(false);
        startTimeRef.current = Date.now();
      });

      hub.on("QuestionJumped", (index: number) => {
        setCurrentIndex(index);
        setSelectedOption(null);
        setIsSubmitted(false);
        setShowSubmittedPopup(null);
        setIsFinished(false);
        startTimeRef.current = Date.now();
      });

      hub.on("QuizEnded", () => {
        // Navigate to result page using persistent sessionId
        router.push(`/student/result/${sessionIdRef.current}`);
      });

      hub.on("StudentKicked", (kickedName: string) => {
        const currentName = localStorage.getItem("studentName");
        if (kickedName === currentName) {
          alert("Teacher removed you from the session.");
          router.push("/student/dashboard");
        }
      });
    }).catch(err => console.error("SignalR start error:", err));

    // Anti-cheat Listeners
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        reportSuspicion(sessionCode, studentName, "TabSwitch").catch(console.error);
      }
    };

    const handleBlur = () => {
      reportSuspicion(sessionCode, studentName, "WindowBlur").catch(console.error);
    };

    const handleCopy = (e: ClipboardEvent) => {
      reportSuspicion(sessionCode, studentName, "Copy").catch(console.error);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
      
      const hub = connectionRef.current;
      if (hub) {
        hub.off("QuizPaused");
        hub.off("QuizResumed");
        hub.off("ThemeChanged");
        hub.off("QuizStarted");
        hub.off("QuestionChanged");
        hub.off("QuestionJumped");
        hub.off("QuizEnded");
        hub.off("StudentKicked");
      }
      connectionRef.current = null;
      // Gracefully stop SignalR connection on component unmount
      stopConnection().catch((e) => console.warn("Error stopping SignalR on unmount", e));
    };
  }, [sessionCode, router]);

  // Start countdown when quiz starts (only if not skipping)
  useEffect(() => {
    if (quizStarted && countdown === null && !skipCountdownRef.current) {
      setCountdown(3);
    }
  }, [quizStarted]);

// Decrement countdown timer each second
useEffect(() => {
  if (countdown !== null && countdown > 0) {
    const timer = setTimeout(() => setCountdown((c) => (c! - 1)), 1000);
    return () => clearTimeout(timer);
  }
}, [countdown]);

  // Question Timer Effect
  useEffect(() => {
    if (countdown !== null || isPaused || isSubmitted || isFinished || questions.length === 0) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleTimeUp();
    }
  }, [timeLeft, countdown, isPaused, isSubmitted, isFinished, questions.length]);

  // Handle Current Question State Resets
  useEffect(() => {
    if (questions.length > 0 && questions[currentIndex]) {
      const limit = questions[currentIndex].questionTimeLimit || 30;
      setTimeLeft(limit);
      setSelectedOption(null);
      setIsSubmitted(false);
      setShowSubmittedPopup(null);
      setIsFinished(false);
      startTimeRef.current = Date.now();

      // Notify the teacher console of our question index progress
      const studentName = localStorage.getItem("studentName") || "";
      if (studentName) {
        updateCurrentQuestion(sessionCode, studentName, currentIndex).catch(console.error);
      }
    }
  }, [currentIndex, questions, sessionCode]);

  // Time Out handler
const handleTimeUp = async () => {
  if (isSubmitted) return;

  setSelectedOption(null);
  setIsSubmitted(true);
  setShowSubmittedPopup("timesup");

  const studentName = localStorage.getItem("studentName") || "";
  const currentQ = questions[currentIndex];

  if (connectionRef.current?.state === signalR.HubConnectionState.Connected && currentQ) {
    try {
      await connectionRef.current.invoke("SubmitAnswer", sessionCode, studentName, currentQ.id, "", 0);
    } catch (err) {
      console.error("Failed to submit timeout answer", err);
    }
  }

  // Auto‑advance to next question
  setCurrentIndex(prev => {
    const next = prev + 1;
    const maxIdx = questionsRef.current.length - 1;
    const newIdx = Math.max(0, Math.min(next, maxIdx));
    // If this was the last question, mark quiz as finished
    if (newIdx === maxIdx) {
      setIsFinished(true);
    }
    return newIdx;
  });
  // Reset submission state for next question
  setIsSubmitted(false);
  // Hide the popup
  setShowSubmittedPopup(null);
};
// Submit Selected Option handler
const handleSubmit = async (option: string) => {
  if (isSubmitted || isPaused || countdown !== null) return;

  setSelectedOption(option);
  setIsSubmitted(true);
  setShowSubmittedPopup("submitted");

  const studentName = localStorage.getItem("studentName") || "";
  const currentQ = questions[currentIndex];
  const timeTakenMs = Date.now() - startTimeRef.current;

  if (connectionRef.current?.state === signalR.HubConnectionState.Connected && currentQ) {
    try {
      await connectionRef.current.invoke(
        "SubmitAnswer",
        sessionCode,
        studentName,
        currentQ.id,
        option,
        timeTakenMs
      );
    } catch (err) {
      console.error("Failed to submit answer", err);
    }
  }

  // Auto‑advance to next question
  setCurrentIndex(prev => {
  const next = prev + 1;
  const maxIdx = questionsRef.current.length - 1;
  const newIdx = Math.max(0, Math.min(next, maxIdx));
  // If this was the last question, mark quiz as finished
  if (newIdx === maxIdx) {
    setIsFinished(true);
  }
  return newIdx;
});
  // Reset submission state for next question
  setIsSubmitted(false);
  // Hide the submitted popup immediately
  setShowSubmittedPopup(null);
};

  // Move to Next Question or Finalize
  const advanceNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      setShowSubmittedPopup(null);
    }
  };

  const THEME_BGS: Record<string, string> = {
    "dark-purple": "from-[#140b2e] via-[#09041a] to-[#04020a]",
    "dark-blue": "from-[#081b33] via-[#030a17] to-[#01040a]",
    "neon-green": "from-[#021d0f] via-[#010b06] to-[#000502]",
    "cyber-red": "from-[#220711] via-[#0c0205] to-[#050002]",
    "ocean": "from-[#02232b] via-[#010e12] to-[#00070a]"
  };

  const THEME_ACCENTS: Record<string, string> = {
    "dark-purple": "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10",
    "dark-blue": "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10",
    "neon-green": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10",
    "cyber-red": "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10",
    "ocean": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/10"
  };

  const THEME_PROGRESS: Record<string, string> = {
    "dark-purple": "bg-purple-500 shadow-[0_0_15px_#a855f7]",
    "dark-blue": "bg-blue-500 shadow-[0_0_15px_#3b82f6]",
    "neon-green": "bg-emerald-500 shadow-[0_0_15px_#10b981]",
    "cyber-red": "bg-rose-500 shadow-[0_0_15px_#f43f5e]",
    "ocean": "bg-cyan-500 shadow-[0_0_15px_#06b6d4]"
  };

  const currentQuestion = questions[currentIndex];
  const activeBg = THEME_BGS[theme] || THEME_BGS["dark-purple"];
  const activeAccent = THEME_ACCENTS[theme] || THEME_ACCENTS["dark-purple"];
  const activeProgress = THEME_PROGRESS[theme] || THEME_PROGRESS["dark-purple"];
  const limitTime = currentQuestion?.questionTimeLimit || 30;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${activeBg} text-white flex flex-col items-center justify-center p-6 transition-all duration-500 overflow-hidden relative`}>
      
      {/* 1. START COUNTDOWN OVERLAY */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center overflow-hidden"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[90px]" />
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className="text-center"
              >
                <span className="text-[130px] font-black tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(168,85,247,0.3)]">
                  {countdown}
                </span>
                <p className="text-zinc-400 font-bold uppercase tracking-widest mt-4 animate-pulse">Get Ready...</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Waiting for teacher to start the quiz */}
        {!quizStarted && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center"
            >
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-sm text-center backdrop-blur-xl shadow-2xl">
                <Clock className="w-12 h-12 mx-auto text-purple-400 mb-4 animate-pulse" />
                <h2 className="text-2xl font-black text-purple-400 mb-2">Waiting for Teacher...</h2>
                <p className="text-white/60 text-sm">The quiz will begin once the teacher starts the session.</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        {/* 2. QUIZ PAUSED OVERLAY */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center"
          >
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-sm text-center backdrop-blur-xl shadow-2xl">
              <ShieldAlert className="w-16 h-16 text-orange-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-3xl font-black text-orange-400 mb-2">Quiz Paused</h2>
              <p className="text-white/60 text-sm">Please wait for the teacher to resume the quiz.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ANSWER SUBMITTED / TIME'S UP POPUPS */}
      <AnimatePresence>
        {showSubmittedPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-40 flex items-center justify-center p-4"
          >
            {showSubmittedPopup === "submitted" ? (
              <div className="bg-white/5 border border-emerald-500/25 p-8 rounded-3xl max-w-sm text-center shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/35">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-2xl font-black text-emerald-400">Answer Submitted!</h3>
                <p className="text-zinc-500 text-xs mt-2">Your answer has been recorded. Moving on...</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-red-500/25 p-8 rounded-3xl max-w-sm text-center shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/35 font-black text-2xl">
                  !
                </div>
                <h3 className="text-2xl font-black text-red-400">Time's Up!</h3>
                <p className="text-zinc-500 text-xs mt-2">Moving to the next question...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. FINISHED / WAITING ROOM */}
      {isFinished && (
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl space-y-6">
          <div className="h-16 w-16 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25">
            <Sparkles size={32} className="text-white animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black">All Done!</h2>
            <p className="text-zinc-400 text-sm">You have completed all questions in this session.</p>
          </div>
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-indigo-300/60 text-xs font-semibold uppercase tracking-wider">Waiting for teacher to end quiz...</p>
          </div>
        </div>
      )}

      {/* 5. MAIN PLAY SCREEN */}
      {!isFinished && quizStarted && countdown === null && (
        <div className="w-full max-w-3xl flex flex-col gap-6">
          
          {/* Header Progress Card */}
          <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
            <span className="text-white/60 font-black tracking-wider uppercase text-xs">
              Question {currentIndex + 1} of {questions.length}
            </span>
            
            {/* Timer component */}
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-zinc-400" />
              <span className="font-mono text-zinc-300 font-bold bg-black/30 px-2.5 py-1 rounded-lg text-sm">
                {timeLeft}s
              </span>
            </div>
            
            <span className={`font-mono font-black border px-3 py-1 rounded-lg text-xs tracking-wider shadow-inner ${activeAccent}`}>
              {sessionCode}
            </span>
          </div>

          {/* Glowing Progress Bar */}
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${activeProgress}`} 
              style={{ width: `${(timeLeft / limitTime) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="text-center py-6">
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white drop-shadow-sm">
              {currentQuestion?.questionText}
            </h1>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              { id: "A", text: currentQuestion?.optionA, color: "from-purple-600/90 to-purple-800/90 shadow-purple-500/10 hover:shadow-purple-500/20" },
              { id: "B", text: currentQuestion?.optionB, color: "from-pink-600/90 to-pink-800/90 shadow-pink-500/10 hover:shadow-pink-500/20" },
              { id: "C", text: currentQuestion?.optionC, color: "from-blue-600/90 to-blue-800/90 shadow-blue-500/10 hover:shadow-blue-500/20" },
              { id: "D", text: currentQuestion?.optionD, color: "from-emerald-600/90 to-emerald-800/90 shadow-emerald-500/10 hover:shadow-emerald-500/20" },
            ].map((opt) => {
              if (!opt.text) return null;
              return (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: isSubmitted ? 1 : 1.015 }}
                  whileTap={{ scale: isSubmitted ? 1 : 0.985 }}
                  onClick={() => handleSubmit(opt.id)}
                  disabled={isSubmitted || isPaused}
                  className={`
                    relative p-6 rounded-2xl text-left font-extrabold text-lg transition-all min-h-[90px] flex items-center border border-white/10 bg-gradient-to-br
                    ${isSubmitted && selectedOption === opt.id ? `${opt.color} ring-4 ring-white shadow-[0_0_40px_rgba(255,255,255,0.25)] scale-[1.02]` : ''}
                    ${isSubmitted && selectedOption !== opt.id ? 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed opacity-30 scale-[0.98]' : ''}
                    ${!isSubmitted ? `${opt.color} shadow-lg cursor-pointer hover:border-white/20` : ''}
                  `}
                >
                  <span className="absolute top-4 left-4 w-7 h-7 rounded-full bg-black/35 border border-white/10 flex items-center justify-center text-xs font-black">
                    {opt.id}
                  </span>
                  <span className="pl-10 block w-full truncate">{opt.text}</span>
                </motion.button>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
