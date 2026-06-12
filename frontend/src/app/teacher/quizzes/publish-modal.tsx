"use client";

import { useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import Image from "next/image";
import { X, Users, Play, Square } from "lucide-react";
import api from "@/services/api";

interface PublishModalProps {
  quizId: string;
  onClose: () => void;
}

export default function PublishModal({ quizId, onClose }: PublishModalProps) {
  const [step, setStep] = useState<"settings" | "lobby">("settings");
  
  // Settings State
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Lobby State
  const [quizCode, setQuizCode] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [participants, setParticipants] = useState<{name: string, connectionId: string}[]>([]);
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);

  const handlePublishSubmit = async () => {
    try {
      setIsPublishing(true);
      const res = await api.put(`/quiz/publish/${quizId}`, {
        maxAttempts,
        shuffleQuestions
      });
      
      const { quizCode: newCode, qrUrl: newQr, shareLink: newLink } = res.data;
      setQuizCode(newCode);
      setQrUrl(newQr);
      setShareLink(newLink);
      
      // Connect to SignalR as teacher for this session
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000"}/quizhub`)
        .withAutomaticReconnect()
        .build();

      connection.on("ParticipantListUpdated", (list: string[]) => {
        // Teacher receives list of names
        setParticipants(list.map(name => ({ name, connectionId: "" })));
      });

      connection.on("StudentJoined", (newName: string) => {
        setParticipants(prev => [...prev.filter(p => p.name !== newName), { name: newName, connectionId: "" }]);
      });

      await connection.start();
      // Join as teacher
      await connection.invoke("JoinSession", newCode, "Teacher");
      setHubConnection(connection);

      setStep("lobby");
    } catch (error) {
      console.error("Error publishing quiz", error);
      alert("Failed to publish quiz. See console for details.");
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (hubConnection) {
        hubConnection.stop();
      }
    };
  }, [hubConnection]);

  const handleStartQuiz = async () => {
    if (!hubConnection) return;
    try {
      await hubConnection.invoke("StartQuiz", quizCode);
      // Optional: teacher stays in lobby or redirects somewhere to monitor
      alert("Quiz started! Students can now begin.");
    } catch (e) {
      console.error("Error starting quiz", e);
    }
  };

  const handleEndQuiz = async () => {
    if (!hubConnection) return;
    try {
      await hubConnection.invoke("EndQuiz", quizCode);
      alert("Quiz ended.");
      onClose();
    } catch (e) {
      console.error("Error ending quiz", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold dark:text-white">
            {step === "settings" ? "Publish Settings" : "Live Session Lobby"}
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {step === "settings" ? (
            <div className="max-w-md mx-auto space-y-6 py-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Number of Attempts
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-xs text-zinc-500 mt-1">How many times can a student take this quiz?</p>
                </div>

                <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <div>
                    <h4 className="text-sm font-semibold dark:text-white">Shuffle Questions & Options</h4>
                    <p className="text-xs text-zinc-500">Randomize the order for each student</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              <button 
                onClick={handlePublishSubmit}
                disabled={isPublishing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isPublishing ? "Publishing..." : "Publish & Generate Codes"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 h-full">
              {/* Left Column: Codes */}
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center space-y-6">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-2">Join Code</p>
                  <div className="text-5xl font-black tracking-widest text-indigo-600 dark:text-indigo-400">
                    {quizCode}
                  </div>
                </div>

                {qrUrl && (
                  <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${qrUrl}`} alt="QR Code" width={200} height={200} className="rounded-lg object-contain" />
                  </div>
                )}

                <div className="w-full">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Shareable Link</p>
                  <div className="flex items-center gap-2 w-full">
                    <input 
                      type="text" 
                      readOnly 
                      value={shareLink} 
                      className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 outline-none"
                    />
                    <button 
                      onClick={() => navigator.clipboard.writeText(shareLink)}
                      className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 text-sm font-semibold transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Participants */}
              <div className="w-full md:w-80 flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Users className="text-zinc-500" size={20} />
                  <h3 className="font-bold dark:text-white">Participants ({participants.length})</h3>
                </div>
                
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 overflow-y-auto mb-4 min-h-[250px]">
                  {participants.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2">
                      <div className="animate-pulse flex space-x-2">
                        <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
                      </div>
                      <p className="text-sm">Waiting for students...</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {participants.map((p, i) => (
                        <li key={i} className="bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg text-sm font-medium dark:text-zinc-200 shadow-sm border border-zinc-100 dark:border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleStartQuiz}
                    disabled={participants.length === 0}
                    className="py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={18} /> Start
                  </button>
                  <button 
                    onClick={handleEndQuiz}
                    className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Square size={18} /> End
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
