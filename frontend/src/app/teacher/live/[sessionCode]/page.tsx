"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";
import type { HubConnection } from "@microsoft/signalr";
import { startConnection, getConnection, startQuiz } from "@/lib/signalr";

import LiveHostHeader from "@/components/live/LiveHostHeader";
import QuestionNavigator from "@/components/live/QuestionNavigator";
import LeaderboardTable from "@/components/live/LeaderboardTable";
import QuestionAnalytics from "@/components/live/QuestionAnalytics";
import ClassAccuracyBar from "@/components/live/ClassAccuracyBar";
import QuestionStatsList from "@/components/live/QuestionStatsList";
import TeacherLobby from "@/components/live/TeacherLobby";
import Podium from "@/components/live/Podium";
import { Target, Users, CheckCircle2, ShieldAlert, Trophy, ListChecks, ShieldCheck } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}) {
  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-3">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-white/45 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-black text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

interface LiveSessionState {
  sessionCode: string;
  quizId: string;
  title: string;
  isStarted: boolean;
  isPaused: boolean;
  isEnded: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
}

export default function TeacherLiveDashboard() {
  const params = useParams();
  const router = useRouter();
  // Sanitize sessionCode to remove any query parameters (e.g., "?" suffix)
  const rawSessionCode = params.sessionCode as string;
  const sessionCode = rawSessionCode ? rawSessionCode.split('?')[0] : '';


  // If sessionCode is missing after sanitization, show an error UI
  if (!sessionCode) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center text-white">
        <p className="text-center text-xl">Invalid session link. Please check the URL.</p>
      </div>
    );
  }

  const [sessionState, setSessionState] = useState<LiveSessionState | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "questions" | "anticheat">("leaderboard");
  const [showPodium, setShowPodium] = useState(false);
  const [analytics, setAnalytics] = useState({
    correctCount: 0,
    wrongCount: 0,
    skippedCount: 0,
    optionACount: 0,
    optionBCount: 0,
    optionCCount: 0,
    optionDCount: 0,
  });

  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    // Initial data fetch
    const fetchState = async () => {
      if (!sessionCode) return;
      try {
        const res = await api.get(`/LiveQuiz/${sessionCode}/state`);
        setSessionState(res.data);
        
        const partsRes = await api.get(`/LiveQuiz/${sessionCode}/participants`);
        const filtered = partsRes.data.filter((p: any) => p.name && p.name.toLowerCase() !== "teacher");
        setParticipants(filtered);
      } catch (err: any) {
  console.error("Error loading session:", err);

  if (err.response) {
    console.log("Status:", err.response.status);
    console.log("Data:", err.response.data);
  }
}
    };
    
    fetchState();

    // SignalR Setup using shared helper
    const init = async () => {
      await startConnection(sessionCode, "Teacher");
      const hub = getConnection();
      connectionRef.current = hub;

      hub.on("ParticipantListUpdated", (updatedParticipants) => {
        const filtered = updatedParticipants.filter(
          (p: any) => p.name && p.name.toLowerCase() !== "teacher"
        );
        setParticipants(filtered);
      });
      hub.on("QuizStarted", () => {
        setSessionState(prev => prev ? { ...prev, isStarted: true } : prev);
        setQuizStarted(true);
      });

      hub.on("AnalyticsUpdated", (updatedAnalytics) => {
        setAnalytics(updatedAnalytics);
      });

      hub.on("LeaderboardUpdated", (updatedLeaderboard) => {
        const filtered = updatedLeaderboard.filter(
          (p: any) => p.name && p.name.toLowerCase() !== "teacher"
        );
        setParticipants(filtered);
      });
    };

    init();

    return () => {
      const hub = connectionRef.current;
      if (hub) {
        hub.off("ParticipantListUpdated");
        hub.off("QuizStarted");
        hub.off("AnalyticsUpdated");
        hub.off("LeaderboardUpdated");
      }
    };
  }, [sessionCode]);

  const handlePauseToggle = async () => {
    if (!sessionState || !connectionRef.current) return;
    
    if (sessionState.isPaused) {
      await connectionRef.current.invoke("TeacherResumedQuiz", sessionCode);
      setSessionState({ ...sessionState, isPaused: false });
    } else {
      await connectionRef.current.invoke("TeacherPausedQuiz", sessionCode);
      setSessionState({ ...sessionState, isPaused: true });
    }
  };

  const handleStartQuiz = async () => {
    if (!sessionCode) return;
    if (!connectionRef.current) {
      console.warn('SignalR connection not ready');
      return;
    }
    try {
      await startQuiz(sessionCode);
    } catch (err: any) {
  console.error("Error loading session:", err);

  if (err.response) {
    console.log("Status:", err.response.status);
    console.log("Data:", err.response.data);
  }
}
  };

  const goToResults = () => {
    const targetId = sessionState?.quizId ?? sessionCode;
    router.push(`/teacher/results/${targetId}`);
  };

  const handleEndQuiz = async () => {
    if (!connectionRef.current) return;
    if (confirm("Are you sure you want to end the session early?")) {
      await connectionRef.current.invoke("TeacherEndedQuiz", sessionCode);
      setSessionState((prev) => (prev ? { ...prev, isEnded: true } : prev));
      setShowPodium(true);
    }
  };

  const handleRemoveParticipant = async (studentName: string) => {
    if (!connectionRef.current) return;
    if (!confirm(`Remove ${studentName} from the session?`)) return;
    try {
      await connectionRef.current.invoke("KickStudent", sessionCode, studentName);
    } catch (err) {
      console.error("Failed to remove participant", err);
    }
  };

  const handleJumpToQuestion = async (index: number) => {
    if (!connectionRef.current) return;
    await connectionRef.current.invoke("TeacherJumpedToQuestion", sessionCode, index);
    setSessionState(prev => prev ? { ...prev, currentQuestionIndex: index } : prev);
  };

  const handleNext = async () => {
    if (!connectionRef.current || !sessionState) return;
    await connectionRef.current.invoke("TeacherMovedToQuestion", sessionCode, 1);
    setSessionState(prev => prev ? { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 } : prev);
  };

  const handlePrevious = async () => {
    if (!connectionRef.current || !sessionState) return;
    await connectionRef.current.invoke("TeacherMovedToQuestion", sessionCode, -1);
    setSessionState(prev => prev ? { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 } : prev);
  };

  if (!sessionState) return <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center text-white">Loading Live Session...</div>;

  const liveStudents = participants.filter((p: any) => p.isConnected).length;
  const flaggedCount = participants.filter((p: any) => p.suspicionScore > 0).length;
  const answeredTotal = analytics.correctCount + analytics.wrongCount;
  const classAccuracy = answeredTotal === 0 ? 0 : Math.round((analytics.correctCount / answeredTotal) * 100);

  // Pre-start: show the lobby with QR / code / link / participants + remove
  if (!sessionState.isStarted) {
    return (
      <TeacherLobby
        sessionCode={sessionCode}
        title={sessionState.title}
        participants={participants}
        onRemove={handleRemoveParticipant}
        onStart={handleStartQuiz}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white overflow-hidden flex flex-col pt-20">
      <LiveHostHeader
        sessionCode={sessionCode}
        isPaused={sessionState.isPaused}
        onPauseToggle={handlePauseToggle}
        onEndQuiz={handleEndQuiz}
      />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto w-full space-y-6">

          {/* Title row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{sessionState.title}</h2>
              <p className="text-white/50 text-sm">
                Broadcasting live · Question {sessionState.currentQuestionIndex + 1} of {sessionState.totalQuestions}
              </p>
            </div>
            {sessionState.isPaused && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
                Paused
              </span>
            )}
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Class Accuracy"
              value={`${classAccuracy}%`}
              icon={Target}
              accent="bg-emerald-500/15 text-emerald-300"
            />
            <StatCard
              label="Live Students"
              value={liveStudents}
              icon={Users}
              accent="bg-blue-500/15 text-blue-300"
            />
            <StatCard
              label="Correct Answers"
              value={analytics.correctCount}
              icon={CheckCircle2}
              accent="bg-purple-500/15 text-purple-300"
            />
            <StatCard
              label="Flagged"
              value={flaggedCount}
              icon={ShieldAlert}
              accent="bg-red-500/15 text-red-300"
            />
          </div>

          {/* Class accuracy hero */}
          <ClassAccuracyBar
            totalParticipants={liveStudents}
            correctCount={analytics.correctCount}
            wrongCount={analytics.wrongCount}
          />

          {/* Tabbed panel */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-1 p-2 border-b border-white/10">
              {([
                { key: "leaderboard", label: "Leaderboard", icon: Trophy },
                { key: "questions", label: "Questions", icon: ListChecks },
                { key: "anticheat", label: "Anti-cheating", icon: ShieldCheck },
              ] as const).map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/45 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Icon size={16} />
                    {t.label}
                    {t.key === "anticheat" && flaggedCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300">
                        {flaggedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4">
              {activeTab === "leaderboard" && (
                <div className="h-[calc(100vh-360px)] min-h-[420px]">
                  <LeaderboardTable
                    participants={participants}
                    totalQuestions={sessionState.totalQuestions}
                    onKick={handleRemoveParticipant}
                  />
                </div>
              )}

              {activeTab === "questions" && (
                <div className="flex flex-col gap-6">
                  <QuestionNavigator
                    totalQuestions={sessionState.totalQuestions}
                    currentIndex={sessionState.currentQuestionIndex}
                    onJumpToQuestion={handleJumpToQuestion}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                  />
                  <div className="h-64">
                    <QuestionAnalytics analytics={analytics} />
                  </div>
                  <QuestionStatsList
                    sessionCode={sessionCode}
                    liveStudents={liveStudents}
                  />
                </div>
              )}

              {activeTab === "anticheat" && (
                <div className="space-y-2">
                  {participants.filter((p: any) => p.suspicionScore > 0).length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 text-center py-16">
                      <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300">
                        <ShieldCheck size={26} />
                      </div>
                      <p className="text-white/60 font-medium">No suspicious activity detected</p>
                      <p className="text-white/30 text-xs">Tab switches and focus losses appear here.</p>
                    </div>
                  ) : (
                    participants
                      .filter((p: any) => p.suspicionScore > 0)
                      .sort((a: any, b: any) => b.suspicionScore - a.suspicionScore)
                      .map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white text-sm">{p.name}</p>
                            <p className="text-white/40 text-xs">{p.employeeId}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                                style={{ width: `${Math.min(100, p.suspicionScore)}%` }}
                              />
                            </div>
                            <span className="text-red-300 font-bold text-sm w-10 text-right">
                              {p.suspicionScore}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showPodium && (
        <Podium participants={participants} onClose={goToResults} />
      )}
    </div>
  );
}
