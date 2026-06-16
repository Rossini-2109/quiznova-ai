"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import api from "@/services/api";
import { Users,User, Loader2 } from "lucide-react";

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();

  const sessionCode = params.sessionCode as string;

  const [connection, setConnection] =
    useState<signalR.HubConnection | null>(null);

  const [isRegistered, setIsRegistered] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [empIdInput, setEmpIdInput] = useState("");

  const [studentName, setStudentName] = useState("");
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
  currentQuestionIndex: number;
}

const [participants, setParticipants] = useState<Participant[]>([]);

  const [countdown, setCountdown] = useState<number | null>(null);

  // ----------------------------------------------------
  // Registration
  // ----------------------------------------------------

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameInput.trim() || !empIdInput.trim()) {
      alert("Please enter both Name and Employee ID");
      return;
    }

    const combinedName =
      `${nameInput.trim()} (${empIdInput.trim()})`;

    setStudentName(combinedName);

    localStorage.setItem("studentName", combinedName);
    localStorage.setItem("employeeId", empIdInput.trim());

    setIsRegistered(true);
  };

  // ----------------------------------------------------
  // SignalR Connection
  // ----------------------------------------------------

  useEffect(() => {
    if (!isRegistered || !studentName) return;

    // Check if session is already started
    api
  .get(`/LiveQuiz/${sessionCode}/state`)
  .then((res: any) => {
    if (res.data.isStarted && !res.data.isEnded) {
      router.push(`/student/live/${sessionCode}`);
    }
  })
  .catch((err: unknown) => {
    console.error(err);
  });

    const hubConnection =
      new signalR.HubConnectionBuilder()
        .withUrl(
          `${
            process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
            "https://quiznova-ai-grdq.onrender.com"
          }/quizHub`
        )
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    const connect = async () => {
      try {
        await hubConnection.start();

        console.log("Lobby SignalR Connected");

        await hubConnection.invoke(
          "JoinSession",
          sessionCode,
          studentName,
          localStorage.getItem("employeeId") || ""
        );
        
        
      } catch (err) {
        console.error("SignalR Error:", err);
      }
    };

    connect();

    hubConnection.on("ParticipantListUpdated", (list: Participant[]) => {
      const filtered = list.filter(
        (p) => p.name && p.name.toLowerCase() !== "teacher"
      );
      setParticipants(filtered);
    });

    hubConnection.on("ParticipantJoined", (participant: Participant) => {
      // Exclude teacher from the list
      if (participant.name && participant.name.toLowerCase() === "teacher") return;
      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === participant.id);
        if (exists) return prev;
        return [...prev, participant];
      });
    });

    // Teacher starts quiz
    hubConnection.on("QuizStarted", () => {
      setCountdown(3);
    });

    setConnection(hubConnection);

    return () => {
      hubConnection.off("ParticipantListUpdated");
      hubConnection.off("ParticipantJoined");
      hubConnection.off("QuizStarted");

      hubConnection
        .stop()
        .catch(() => {});
    };
  }, [
    isRegistered,
    studentName,
    sessionCode,
  ]);

  // ----------------------------------------------------
  // Countdown Logic
  // ----------------------------------------------------

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      router.push(
        `/student/live/${sessionCode}`
      );
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) =>
        prev !== null ? prev - 1 : null
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    countdown,
    router,
    sessionCode,
  ]);

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-900 p-4 text-white relative">

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
          <div className="text-8xl font-black text-indigo-400 animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {!isRegistered && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white/10 border border-white/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-sm">

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>

              <h2 className="text-2xl font-black">
                Join Quiz
              </h2>

              <p className="text-zinc-400 mt-2">
                Session:
                <span className="ml-2 text-indigo-400 font-mono">
                  {sessionCode}
                </span>
              </p>
            </div>

            <form
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Full Name"
                value={nameInput}
                onChange={(e) =>
                  setNameInput(e.target.value)
                }
                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10"
              />

              <input
                type="text"
                placeholder="Employee ID"
                value={empIdInput}
                onChange={(e) =>
                  setEmpIdInput(e.target.value)
                }
                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10"
              />

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold"
              >
                Join Lobby
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lobby */}
      <div
        className={`bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center transition-all duration-500 ${
          !isRegistered
            ? "opacity-20 blur-sm scale-95 pointer-events-none"
            : ""
        }`}
      >
        <h1 className="text-3xl font-black mb-3">
          Waiting Room
        </h1>

        <p className="text-zinc-400 mb-6">
          Code: {sessionCode}
        </p>

        {studentName && (
          <p className="mb-6">
            Joined as:
            <br />
            <span className="font-bold text-indigo-300">
              {studentName}
            </span>
          </p>
        )}

        <div className="bg-black/20 rounded-2xl p-4">
          <h2 className="font-semibold mb-4">
            Participants ({participants.length})
          </h2>

          <ul className="space-y-2 max-h-52 overflow-y-auto">
            {participants.length === 0 ? (
              <li className="text-zinc-500">
                Waiting for others...
              </li>
            ) : (
              participants.map((p) => (
                <li
                  key={`${p.id}-${p.employeeId}`}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-left flex items-center space-x-3"
                >
                  <User className="w-5 h-5 text-purple-400" />
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{p.name}</span>
                    <span className="text-xs text-zinc-500">{p.employeeId}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />

          <p className="text-sm text-zinc-400">
            Waiting for teacher to start quiz...
          </p>
        </div>
      </div>
    </div>
  );
}