"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import api from "@/services/api";
import { 
  Trophy, Play, Square, Pause, Maximize, Volume2, VolumeX, 
  Palette, Users, Loader2, Check, X, ShieldAlert, ChevronLeft, ChevronRight, Sparkles, Copy 
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useParams } from "next/navigation";


interface SessionState {
  id: string;
  sessionCode: string;
  quizId: string;
  title: string;
  isStarted: boolean;
  isPaused: boolean;
  isEnded: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
}

interface Participant {
  id: string;
  name: string;
  employeeId: string;
  isConnected: boolean;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  averageTimeTakenMs: number;
  suspicionScore: number;
  rank: number;
  tabSwitchCount: number;
  windowBlurCount: number;
  copyAttempts: number;
  currentQuestionIndex: number;
}

type ThemeType = "dark-purple" | "dark-blue" | "neon-green" | "cyber-red" | "ocean";

const THEME_CLASSES: Record<ThemeType, { bg: string; border: string; accent: string; text: string; glow: string }> = {
  "dark-purple": {
    bg: "from-[#140b2e] via-[#09041a] to-[#04020a]",
    border: "border-purple-500/20",
    accent: "bg-purple-600 hover:bg-purple-500",
    text: "text-purple-400",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)]"
  },
  "dark-blue": {
    bg: "from-[#081b33] via-[#030a17] to-[#01040a]",
    border: "border-blue-500/20",
    accent: "bg-blue-600 hover:bg-blue-500",
    text: "text-blue-400",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]"
  },
  "neon-green": {
    bg: "from-[#021d0f] via-[#010b06] to-[#000502]",
    border: "border-emerald-500/20",
    accent: "bg-emerald-600 hover:bg-emerald-500",
    text: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]"
  },
  "cyber-red": {
    bg: "from-[#220711] via-[#0c0205] to-[#050002]",
    border: "border-rose-500/20",
    accent: "bg-rose-600 hover:bg-rose-500",
    text: "text-rose-400",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]"
  },
  "ocean": {
    bg: "from-[#02232b] via-[#010e12] to-[#00070a]",
    border: "border-cyan-500/20",
    accent: "bg-cyan-600 hover:bg-cyan-500",
    text: "text-cyan-400",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]"
  }
};

export default function TeacherLiveSessionPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  // sessionId obtained from URL params

  // State Management
  const [participants, setParticipants] = useState<Participant[]>([]);
  const filteredParticipants = participants.filter(p => p.name !== "Teacher");
  const [theme, setTheme] = useState<ThemeType>("dark-purple");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "questions" | "anticheat">("leaderboard");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionAnalysis, setQuestionAnalysis] = useState<any[]>([]);
  const [session, setSession] = useState<SessionState | null>(null);
  // Collapsible sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Selected question in Questions Tab
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  // SignalR Ref
  const connectionRef = useRef<HubConnection | null>(null);

  // Audio elements (cues for join / submits)
  const joinSoundRef = useRef<HTMLAudioElement | null>(null);
  const submitSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Audio files initialization (using standard web-available alerts)
    joinSoundRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav");
    submitSoundRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");

    const loadSession = async () => {
  if (!sessionId) {
    // Session ID not yet available; skip loading.
    return;
  }
  try {
        const res = await api.get(`/LiveQuiz/by-id/${sessionId}`);
        const stateData = res.data.state;
        const fullSession = res.data.session;

        setSession({
          id: fullSession.id,
          sessionCode: fullSession.sessionCode,
          quizId: fullSession.quizId,
          title: stateData.title,
          isStarted: stateData.isStarted,
          isPaused: stateData.isPaused,
          isEnded: stateData.isEnded,
          currentQuestionIndex: stateData.currentQuestionIndex,
          totalQuestions: stateData.totalQuestions
        });

        // Load questions
        const quizRes = await api.get(`/LiveQuiz/${fullSession.sessionCode}/quiz`);
        setQuestions(quizRes.data.questions || []);

        // Load participants
        const partsRes = await api.get(`/LiveQuiz/${fullSession.sessionCode}/participants`);
        setParticipants(partsRes.data);

        // Load question analysis
        const analysisRes = await api.get(`/LiveQuiz/${fullSession.sessionCode}/question-analysis`);
        setQuestionAnalysis(analysisRes.data);

        // Initialize SignalR
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://quiznova-ai-grdq.onrender.com";
        const connection = new HubConnectionBuilder()
          .withUrl(`${backendUrl}/quizHub`)
          .configureLogging(LogLevel.Information)
          .withAutomaticReconnect()
          .build();

        connectionRef.current = connection;

        connection.on("ParticipantListUpdated", (list: Participant[]) => {
          setParticipants(list);
          if (soundEnabled && joinSoundRef.current) {
            joinSoundRef.current.play().catch(() => {});
          }
        });

        connection.on("ParticipantJoined", (name: string) => {
          console.log(`${name} joined`);
        });

        connection.on("AnswerSubmitted", (studentName: string) => {
          if (soundEnabled && submitSoundRef.current) {
            submitSoundRef.current.play().catch(() => {});
          }
        });

        connection.on("LeaderboardUpdated", (leaderboard: Participant[]) => {
          setParticipants(leaderboard);
        });

        connection.on("ThemeChanged", (newTheme: string) => {
          setTheme(newTheme as ThemeType);
        });

        connection.on("QuizStarted", () => {
          setSession(prev => prev ? { ...prev, isStarted: true } : prev);
        });

        connection.on("QuizPaused", () => {
          setSession(prev => prev ? { ...prev, isPaused: true } : prev);
        });

        connection.on("QuizResumed", () => {
          setSession(prev => prev ? { ...prev, isPaused: false } : prev);
        });

        connection.on("QuestionChanged", (direction: number) => {
          setSession(prev => prev ? { ...prev, currentQuestionIndex: Math.max(0, Math.min(prev.currentQuestionIndex + direction, prev.totalQuestions - 1)) } : prev);
        });

        connection.on("QuestionJumped", (index: number) => {
          setSession(prev => prev ? { ...prev, currentQuestionIndex: index } : prev);
        });

        connection.on("QuizEnded", () => {
  setSession(prev => {
    if (prev) {
      router.push(`/teacher/results/${prev.quizId}`);
      return { ...prev, isEnded: true };
    }

    router.push(`/teacher/results/${fullSession.quizId}`);
    return prev;
  });
});
        await connection.start();
        // Join session group
        await connection.invoke("JoinSession", fullSession.sessionCode, "Teacher", "");

      } catch (err) {
        console.error("Error loading session:", err);
      }
    };

    loadSession();

    return () => {
      connectionRef.current?.stop().catch(console.error);
    };
  }, [sessionId]); // Only re-run when sessionId changes; router and soundEnabled are stable


  // Update question analysis periodically
  useEffect(() => {
    if (!session || !session.isStarted || session.isEnded) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/LiveQuiz/${session.sessionCode}/question-analysis`);
        setQuestionAnalysis(res.data);
      } catch (e) {
        console.error("Failed to fetch live question analysis", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session, sessionId]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#09041a] flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 font-semibold animate-pulse">Initializing Live Session Console...</p>
      </div>
    );
  }

  // Live Control Functions
  const handleStartQuiz = async () => {
    if (!connectionRef.current) return;
    try {
      await connectionRef.current.invoke("TeacherStartedQuiz", session.sessionCode);
      // Stay on this page — it automatically switches to the live dashboard view
      // when session.isStarted becomes true (no redirect needed)
      setSession(prev => prev ? { ...prev, isStarted: true } : prev);
    } catch (e) {
      console.error("Failed to start quiz:", e);
    }
  };

  const handlePauseToggle = async () => {
    if (!connectionRef.current) return;
    try {
        const handleRemoveParticipant = async (participantId: string) => {
          if (!connectionRef.current) return;
          try {
            await connectionRef.current.invoke("TeacherRemoveStudent", session?.sessionCode, participantId);
          } catch (e) {
            console.error("Failed to remove participant", e);
          }
        };
      if (session.isPaused) {
        await connectionRef.current.invoke("TeacherResumedQuiz", session.sessionCode);
        setSession(prev => prev ? { ...prev, isPaused: false } : prev);
      } else {
        await connectionRef.current.invoke("TeacherPausedQuiz", session.sessionCode);
        setSession(prev => prev ? { ...prev, isPaused: true } : prev);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEndQuiz = async () => {
    if (!connectionRef.current) return;
    if (confirm("Are you sure you want to end the session? This will force submit all incomplete answers and calculate final rankings.")) {
      try {
        await connectionRef.current.invoke("TeacherEndedQuiz", session.sessionCode);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleNextQuestion = async () => {
    if (!connectionRef.current) return;
    if (session.currentQuestionIndex < session.totalQuestions - 1) {
      try {
        await connectionRef.current.invoke("TeacherMovedToQuestion", session.sessionCode, 1);
        setSession(prev => prev ? { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 } : prev);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePrevQuestion = async () => {
    if (!connectionRef.current) return;
    if (session.currentQuestionIndex > 0) {
      try {
        await connectionRef.current.invoke("TeacherMovedToQuestion", session.sessionCode, -1);
        setSession(prev => prev ? { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 } : prev);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleJumpToQuestion = async (index: number) => {
    if (!connectionRef.current) return;
    try {
      await connectionRef.current.invoke("TeacherJumpedToQuestion", session.sessionCode, index);
      setSession(prev => prev ? { ...prev, currentQuestionIndex: index } : prev);
    } catch (e) {
      console.error(e);
    }
  };

  const handleThemeChange = async (newTheme: ThemeType) => {
    if (!connectionRef.current) return;
    try {
      await connectionRef.current.invoke("ChangeTheme", session.sessionCode, newTheme);
      setTheme(newTheme);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // Class Accuracy Calculations
  const accuracyStats = (() => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    participants.forEach((p) => {
      correct += p.correctAnswers;
      wrong += p.wrongAnswers;
      skipped += p.skippedAnswers;
    });
    const totalSubmitted = correct + wrong + skipped;
    const accuracy = totalSubmitted > 0 ? Math.round((correct / totalSubmitted) * 100) : 0;
    return { correct, wrong, skipped, totalSubmitted, accuracy };
  })();

  const accuracyBarColor = (acc: number) => {
    if (acc < 40) return "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
    if (acc < 70) return "bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]";
    return "bg-green-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]";
  };

  // Wayground Leaderboard Sorting logic
  const sortedLeaderboard = [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.averageTimeTakenMs !== b.averageTimeTakenMs) return a.averageTimeTakenMs - b.averageTimeTakenMs;
    return a.name.localeCompare(b.name);
  });

  // Connection list filtering
  const onlineParticipants = participants.filter(p => p.isConnected);
  const disconnectedParticipants = participants.filter(p => !p.isConnected);

  // Question details stats helper
  const currentQ = questions[session.currentQuestionIndex];
  const activeQuestionDetail = currentQ ? questions[selectedQuestionIndex] || currentQ : null;
  const activeAnalysis = activeQuestionDetail ? questionAnalysis.find(a => a.questionId === activeQuestionDetail.id) || {
    accuracy: 0,
    countA: 0,
    countB: 0,
    countC: 0,
    countD: 0,
    countEmpty: 0
  } : { accuracy: 0, countA: 0, countB: 0, countC: 0, countD: 0, countEmpty: 0 };

  const currentTheme = THEME_CLASSES[theme] || THEME_CLASSES["dark-purple"];

  return (
    <div className="h-screen w-screen bg-gradient-to-br ${currentTheme.bg} text-white flex flex-col transition-all duration-500 font-sans overflow-hidden">
      
      {/* 1. FIXED TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles size={20} className="text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              QuizNova<span className="text-indigo-400">AI</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Live Host Dashboard</p>
          </div>
        </div>

        {/* Center Quiz Title & Code */}
        <div className="hidden md:flex flex-col items-center">
          <p className="text-zinc-400 text-xs font-bold truncate max-w-[200px]">{session.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500 font-semibold uppercase">Lobby Code:</span>
            <span className="text-xl font-black tracking-widest bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
              {session.sessionCode}
            </span>
          </div>
        </div>

        {/* Right Live Controls Toolbar */}
        <div className="flex items-center gap-2">
          {session.isStarted && !session.isEnded && (
            <button
              onClick={handlePauseToggle}
              className="px-4 py-2.5 rounded-xl border border-white/10 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10"
              title={session.isPaused ? "Resume Session" : "Pause Session"}
            >
              {session.isPaused ? (
                <>
                  <Play size={13} className="fill-green-400 text-green-400" />
                  <span className="text-green-400">Resume</span>
                </>
              ) : (
                <>
                  <Pause size={13} className="fill-amber-400 text-amber-400" />
                  <span className="text-amber-400">Pause</span>
                </>
              )}
            </button>
          )}

          {session.isStarted && !session.isEnded && (
            <button
              onClick={handleEndQuiz}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Square size={12} className="fill-current" />
              <span>End Quiz</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <X size={14} /> : <Maximize size={14} />}
          </button>

          {/* Theme Selector */}
          <div className="relative group">
            <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
              <Palette size={14} />
            </button>
            <div className="absolute right-0 top-12 bg-[#121218] border border-white/10 rounded-2xl p-3 shadow-2xl hidden group-hover:block w-44 space-y-1.5 z-50">
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Select Arena Theme</p>
              {(Object.keys(THEME_CLASSES) as ThemeType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors hover:bg-white/5 ${theme === t ? 'bg-white/10 text-white font-bold' : 'text-zinc-400'}`}
                >
                  <span className="capitalize">{t.replace("-", " ")}</span>
                  {theme === t && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-3 border rounded-xl transition-all cursor-pointer ${sidebarOpen ? 'bg-indigo-600/20 border-indigo-500/35 text-indigo-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}
            title="Toggle Student Sidebar"
          >
            <Users size={14} />
          </button>
        </div>
      </header>

      {/* 2. LOBBY OR STARTED VIEWS */}
      {!session.isStarted ? (
        /* LOBBY SCREEN (Waiting to Start) */
        <main className="flex-1 p-8 w-full flex flex-col items-center justify-center gap-8 overflow-y-auto">
          <div className="text-center space-y-3 max-w-lg">
            <h2 className="text-4xl font-extrabold tracking-tight">Waiting Room</h2>
            <p className="text-zinc-400 text-sm">
              Scan the QR code or share the join link below. The live dashboard will activate once you click Start.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-4">
            {/* QR Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`${process.env.NEXT_PUBLIC_API_URL || "https://quiznova-ai-grdq.onrender.com"}/api/LiveQuiz/${session.sessionCode}/qrcode`} 
                alt="Lobby QR Code" 
                className="rounded-2xl border-4 border-white object-contain bg-white shadow-2xl p-2 w-48 h-48 mb-6" 
              />
              <h3 className="text-lg font-bold">Scan to Participate</h3>
              <p className="text-xs text-zinc-500 mt-1">Directly redirects students to the live quiz page.</p>
              
              <div className="mt-4 flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-full max-w-sm">
                <input
                  readOnly
                  value={`${process.env.NEXT_PUBLIC_FRONTEND_URL || "https://quiznova-ai-grdq.onrender.com"}/student/lobby/${session.sessionCode}`}
                  className="flex-1 bg-transparent text-xs text-zinc-300 outline-none truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_URL || "https://quiznova-ai-grdq.onrender.com"}/student/lobby/${session.sessionCode}`).catch(() => {});
                  }}
                  className="p-1 rounded hover:bg-white/10 cursor-pointer">
                  <Copy size={14} className="text-zinc-200" />
                </button>
              </div>
            </div>

            {/* Connection List */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col backdrop-blur-xl max-h-[350px]">
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                <span className="font-bold text-sm">Lobby Status</span>
                <span className="text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                  {participants.length} Joined
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {filteredParticipants.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs py-10 gap-3">
                    <Loader2 className="animate-spin text-purple-400" size={20} />
                    <span>No students joined yet...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <AnimatePresence>
                      {filteredParticipants.map((p) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-zinc-200 truncate">{p.name}</span>
                            <span className="text-[9px] text-zinc-500 font-semibold truncate font-mono mt-0.5">{p.employeeId || "No Emp ID"}</span>
                          </div>
                          <button onClick={() => handleRemoveParticipant(p.id)} className="p-1 hover:text-red-300">
                            <X size={14} className="text-red-400" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartQuiz}
            disabled={participants.length === 0}
            className="mt-4 px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black rounded-2xl transition-all shadow-xl shadow-purple-600/25 text-base flex items-center gap-2 cursor-pointer group"
          >
            <Play size={16} className="fill-current group-hover:scale-110 transition-transform" />
            Start Live Session
          </button>
        </main>
      ) : (
        /* LIVE MONITORING DASHBOARD VIEW */
        <div className="flex-1 flex overflow-hidden">
          
          {/* A. LEFT / CENTER PRIMARY MONITORING COLUMN */}
          <main className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
            
            {/* 1. CLASS ACCURACY BAR CARD */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-4 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">Class Accuracy: {accuracyStats.accuracy}%</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Real-time accuracy based on answers submitted</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg">Correct: {accuracyStats.correct}</span>
                  <span className="text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg">Wrong: {accuracyStats.wrong}</span>
                  <span className="text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg">Skipped: {accuracyStats.skipped}</span>
                </div>
              </div>

              {/* accuracy bar */}
              <div className="w-full bg-black/35 rounded-full h-3 overflow-hidden border border-white/5 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${accuracyBarColor(accuracyStats.accuracy)}`}
                  style={{ width: `${accuracyStats.accuracy}%` }}
                />
              </div>
            </div>

            {/* 2. NAVIGATION BAR & TABS CONTROLLERS */}
            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
              {/* Tab Pills */}
              <div className="flex gap-2">
                {[
                  { id: "leaderboard", label: "Leaderboard" },
                  { id: "questions", label: "Questions" },
                  { id: "anticheat", label: "Anti-Cheat Monitor" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/5'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Question Navigation Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevQuestion}
                  disabled={session.currentQuestionIndex === 0}
                  className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
                  title="Previous Question"
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="text-center min-w-[70px]">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Active Q</p>
                  <p className="text-sm font-black">{session.currentQuestionIndex + 1} / {session.totalQuestions}</p>
                </div>

                <button
                  onClick={handleNextQuestion}
                  disabled={session.currentQuestionIndex === session.totalQuestions - 1}
                  className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
                  title="Next Question"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* 3. TABS CONTENTS */}
            <div className="flex-1 flex flex-col min-h-0">
              <AnimatePresence mode="wait">
                
                {/* A. LEADERBOARD TAB */}
                {activeTab === "leaderboard" && (
                  <motion.div
                    key="leaderboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col flex-1"
                  >
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 pb-3 text-xs uppercase font-bold text-zinc-500">
                            <th className="py-3 px-4 w-16">Rank</th>
                            <th className="py-3 px-4">Student Name</th>
                            <th className="py-3 px-4 w-32">Score</th>
                            <th className="py-3 px-4 w-44">Accuracy Rate</th>
                            <th className="py-3 px-4 w-28 text-center">Correct</th>
                            <th className="py-3 px-4 w-28 text-center">Wrong</th>
                            <th className="py-3 px-4 w-32 text-right">Avg Speed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {sortedLeaderboard.map((p, idx) => {
                            const totalAnswers = p.correctAnswers + p.wrongAnswers + p.skippedAnswers;
                            const studentAccuracy = totalAnswers > 0 ? Math.round((p.correctAnswers / totalAnswers) * 100) : 0;
                            
                            return (
                              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 px-4">
                                  <span className={`h-7 w-7 rounded-xl flex items-center justify-center font-black text-xs ${
                                    idx === 0 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                    idx === 1 ? 'bg-zinc-300/10 text-zinc-300 border border-zinc-300/20' :
                                    idx === 2 ? 'bg-amber-700/10 text-amber-500 border border-amber-700/20' :
                                    'bg-white/5 text-zinc-400'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="py-4 px-4 font-bold text-zinc-200">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                      <div className="h-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold uppercase w-6">
                                        {p.name.charAt(0)}
                                      </div>
                                      <span>{p.name}</span>
                                    </span>
                                    <button onClick={() => handleRemoveParticipant(p.id)} className="p-1 hover:text-red-300">
                                      <X size={12} className="text-red-400" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-4 px-4 font-black text-indigo-400">{p.score}</td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-bold text-zinc-400">{studentAccuracy}%</span>
                                    <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${accuracyBarColor(studentAccuracy)}`} 
                                        style={{ width: `${studentAccuracy}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-center font-semibold text-green-400">{p.correctAnswers}</td>
                                <td className="py-4 px-4 text-center font-semibold text-rose-400">{p.wrongAnswers}</td>
                                <td className="py-4 px-4 text-right font-mono text-xs text-zinc-500">{(p.averageTimeTakenMs / 1000).toFixed(1)}s</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* B. QUESTIONS TAB */}
                {activeTab === "questions" && (
                  <motion.div
                    key="questions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0"
                  >
                    {/* Left Column: Pills/Cards List (4 cols) */}
                    <div className="xl:col-span-4 flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1">
                      {questions.map((q, idx) => {
                        const ans = questionAnalysis.find(a => a.questionId === q.id) || { accuracy: 0 };
                        let pillClass = "border-red-500/20 text-red-400 bg-red-500/5";
                        if (ans.accuracy >= 70) pillClass = "border-green-500/20 text-green-400 bg-green-500/5";
                        else if (ans.accuracy >= 40) pillClass = "border-amber-500/20 text-amber-400 bg-amber-500/5";
                        
                        return (
                          <div
                            key={q.id}
                            onClick={() => setSelectedQuestionIndex(idx)}
                            className={`border p-4 rounded-2xl cursor-pointer transition-all flex flex-col gap-2 hover:bg-white/5 ${selectedQuestionIndex === idx ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20' : 'border-white/10 bg-white/5'}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-zinc-500">Question {idx + 1}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${pillClass}`}>
                                {ans.accuracy}% Accuracy
                              </span>
                            </div>
                            <p className="text-xs font-semibold truncate text-zinc-300">{q.questionText}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column: Analytics Card Detail (8 cols) */}
                    {activeQuestionDetail && (
                      <div className="xl:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-6 overflow-y-auto max-h-[500px]">
                        <div>
                          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">
                            Q{selectedQuestionIndex + 1} Breakdown
                          </span>
                          <h4 className="text-lg font-extrabold text-white mt-3">{activeQuestionDetail.questionText}</h4>
                        </div>

                        {/* Options A, B, C, D */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { id: "A", text: activeQuestionDetail.optionA, count: activeAnalysis.countA },
                            { id: "B", text: activeQuestionDetail.optionB, count: activeAnalysis.countB },
                            { id: "C", text: activeQuestionDetail.optionC, count: activeAnalysis.countC },
                            { id: "D", text: activeQuestionDetail.optionD, count: activeAnalysis.countD }
                          ].map((opt) => {
                            const isCorrect = activeQuestionDetail.correctAnswer === opt.id;
                            return (
                              <div 
                                key={opt.id} 
                                className={`bg-white/5 border rounded-2xl p-4 flex items-center justify-between transition-colors ${isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-white/5'}`}
                              >
                                <div className="flex flex-col min-w-0 pr-4">
                                  <span className={`text-[9px] font-bold uppercase ${isCorrect ? 'text-green-400' : 'text-zinc-500'}`}>
                                    Option {opt.id} {isCorrect && "• Correct"}
                                  </span>
                                  <span className="text-zinc-200 text-xs font-semibold truncate mt-0.5">{opt.text}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-lg font-black text-white">{opt.count}</span>
                                  <span className="block text-[8px] text-zinc-500 uppercase font-semibold">Submits</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Recharts chart */}
                        <div className="h-56 bg-black/20 rounded-2xl border border-white/5 p-4">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-4">Option Distribution</p>
                          <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={[
                              { name: 'A', students: activeAnalysis.countA, fill: activeQuestionDetail.correctAnswer === 'A' ? '#10b981' : '#8b5cf6' },
                              { name: 'B', students: activeAnalysis.countB, fill: activeQuestionDetail.correctAnswer === 'B' ? '#10b981' : '#ec4899' },
                              { name: 'C', students: activeAnalysis.countC, fill: activeQuestionDetail.correctAnswer === 'C' ? '#10b981' : '#3b82f6' },
                              { name: 'D', students: activeAnalysis.countD, fill: activeQuestionDetail.correctAnswer === 'D' ? '#10b981' : '#10b981' }
                            ]}>
                              <XAxis dataKey="name" stroke="#ffffff30" tick={{ fill: '#ffffff60', fontSize: 10 }} />
                              <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff60', fontSize: 10 }} />
                              <Tooltip contentStyle={{ backgroundColor: '#101018', borderColor: '#ffffff10', color: '#fff', borderRadius: '12px', fontSize: '12px' }} />
                              <Bar dataKey="students" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* C. ANTI-CHEAT MONITOR TAB */}
                {activeTab === "anticheat" && (
                  <motion.div
                    key="anticheat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col flex-1"
                  >
                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
                      <ShieldAlert className="text-red-400 shrink-0" size={16} />
                      <p className="text-xs text-red-300">
                        The console aggregates student browser signals (tab switches, focus loss, connection drops) in real-time. Red risks indicate high anomaly frequencies.
                      </p>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 pb-3 text-xs uppercase font-bold text-zinc-500">
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4">Employee ID</th>
                            <th className="py-3 px-4 w-28 text-center">Tab Switches</th>
                            <th className="py-3 px-4 w-28 text-center">Focus Losses</th>
                            <th className="py-3 px-4 w-28 text-center">Copy Attempts</th>
                            <th className="py-3 px-4 w-32 text-center">Suspicion Score</th>
                            <th className="py-3 px-4 w-28 text-right">Risk Assessment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {participants.filter(p => p.suspicionScore > 0 || p.tabSwitchCount > 0 || p.windowBlurCount > 0).map((p) => {
                            let risk = "Low";
                            let riskColor = "bg-green-500/10 text-green-400 border-green-500/20";
                            if (p.suspicionScore >= 70) {
                              risk = "High";
                              riskColor = "bg-red-500/15 text-red-400 border-red-500/25";
                            } else if (p.suspicionScore >= 40) {
                              risk = "Medium";
                              riskColor = "bg-orange-500/15 text-orange-400 border-orange-500/25";
                            }
                            
                            return (
                              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 px-4 font-bold text-zinc-200">{p.name}</td>
                                <td className="py-4 px-4 font-mono text-xs text-zinc-400">{p.employeeId}</td>
                                <td className="py-4 px-4 text-center font-bold font-mono text-zinc-300">{p.tabSwitchCount ?? 0}</td>
                                <td className="py-4 px-4 text-center font-bold font-mono text-zinc-300">{p.windowBlurCount ?? 0}</td>
                                <td className="py-4 px-4 text-center font-bold font-mono text-zinc-300">{p.copyAttempts ?? 0}</td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`font-black font-mono text-sm ${p.suspicionScore >= 70 ? 'text-red-400' : p.suspicionScore >= 40 ? 'text-orange-400' : 'text-zinc-400'}`}>
                                    {p.suspicionScore}%
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded border ${riskColor}`}>
                                    {risk} Risk
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {participants.filter(p => p.suspicionScore > 0 || p.tabSwitchCount > 0 || p.windowBlurCount > 0).length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-10 text-zinc-500 text-xs italic">
                                No suspicious flags detected in this live session yet. Good job!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </main>

          {/* B. RIGHT SIDEBAR PANEL: CONNECTIVITY MAP */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-black/35 border-l border-white/10 backdrop-blur-xl flex flex-col shrink-0"
              >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <span className="font-bold text-xs uppercase text-zinc-400 tracking-wider">Class Connectivity</span>
                  <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-300">
                    {participants.length} Active
                  </span>
                </div>

                {/* Sidebar Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Online Students */}
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Online ({onlineParticipants.length})
                    </h5>
                    <div className="space-y-2">
                      {onlineParticipants.map(p => (
                        <div key={p.id} className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-xs text-zinc-200 truncate">{p.name}</p>
                            <p className="text-[8px] text-zinc-500 truncate mt-0.5">{p.employeeId}</p>
                          </div>
                          <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono shrink-0" title="Current student question index">
                            Q{p.currentQuestionIndex + 1}
                          </span>
                        </div>
                      ))}
                      {onlineParticipants.length === 0 && (
                        <p className="text-[10px] text-zinc-600 italic pl-1">No online participants...</p>
                      )}
                    </div>
                  </div>

                  {/* Disconnected Students */}
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Disconnected ({disconnectedParticipants.length})
                    </h5>
                    <div className="space-y-2">
                      {disconnectedParticipants.map(p => (
                        <div key={p.id} className="bg-white/5 border border-red-500/10 rounded-xl p-2.5 flex items-center justify-between opacity-50">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-xs text-red-300 truncate">{p.name}</p>
                            <p className="text-[8px] text-zinc-650 truncate mt-0.5">{p.employeeId}</p>
                          </div>
                          <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest" title="Connection dropped">
                            Offline
                          </span>
                        </div>
                      ))}
                      {disconnectedParticipants.length === 0 && (
                        <p className="text-[10px] text-zinc-600 italic pl-1">No disconnected participants...</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
}
