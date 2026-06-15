"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import type { HubConnection } from "@microsoft/signalr";
import { startConnection, getConnection, startQuiz } from "@/lib/signalr";

import LiveHostHeader from "@/components/live/LiveHostHeader";
import QuestionNavigator from "@/components/live/QuestionNavigator";
import LeaderboardTable from "@/components/live/LeaderboardTable";
import QuestionAnalytics from "@/components/live/QuestionAnalytics";
import ClassAccuracyBar from "@/components/live/ClassAccuracyBar";

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
      } catch (err) {
        console.error("Failed to load session state", err);
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
    } catch (err) {
      console.error('Failed to start quiz', err);
    }
  };

  const handleEndQuiz = async () => {
    if (!connectionRef.current) return;
    if (confirm("Are you sure you want to end the session early?")) {
      await connectionRef.current.invoke("TeacherEndedQuiz", sessionCode);
      // Redirect to results page using quizId; fallback to sessionCode if unavailable
      const targetId = sessionState?.quizId ?? sessionCode;
      router.push(`/teacher/results/${targetId}`);
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
  // Ensure quizStarted reflects sessionState
  const isQuizStarted = sessionState?.isStarted ?? false;

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white overflow-hidden flex flex-col pt-20">
      <LiveHostHeader
        sessionCode={sessionCode}
        isPaused={sessionState.isPaused}
        onPauseToggle={handlePauseToggle}
        onEndQuiz={handleEndQuiz}
      />
      {!sessionState.isStarted && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleStartQuiz}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition"
          >
            Start Live Session
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Controls & Analytics */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-2">{sessionState.title}</h2>
            <p className="text-white/60 mb-6">You are currently broadcasting this quiz live.</p>
            
            <QuestionNavigator
              totalQuestions={sessionState.totalQuestions}
              currentIndex={sessionState.currentQuestionIndex}
              onJumpToQuestion={handleJumpToQuestion}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ClassAccuracyBar
              totalParticipants={participants.filter((p: any) => p.isJoined).length}
              correctCount={analytics.correctCount}
              wrongCount={analytics.wrongCount}
            />
            
            {/* Anti-Cheat summary card could go here */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col justify-center items-center">
              <span className="text-red-400 font-medium mb-1">Suspicious Activities</span>
              <span className="text-3xl font-bold text-red-500">
                {participants.filter(p => p.suspicionScore > 0).length}
              </span>
              <span className="text-xs text-red-400/60 mt-1">Students flagged</span>
            </div>
          </div>

          <div className="h-64">
            <QuestionAnalytics analytics={analytics} />
          </div>

        </div>

        {/* Right Column - Leaderboard */}
        <div className="lg:col-span-4 flex flex-col h-[calc(100vh-140px)]">
          <LeaderboardTable participants={participants} />
        </div>

      </main>
    </div>
  );
}
