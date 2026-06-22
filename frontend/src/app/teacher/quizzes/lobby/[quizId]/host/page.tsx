"use client";

import LiveLobby from "./LiveLobby";

export default function HostLobbyPage() {
  return <LiveLobby />;
}

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import api from "@/services/api";

type Participant = { id: string; name: string };

export default function HostLobbyPage() {
  const { quizId } = useParams() as { quizId: string };
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [started, setStarted] = useState(false);

  const quizLink = typeof window !== "undefined" ? `${window.location.origin}/teacher/quizzes/lobby/${quizId}/student` : "";

  const fetchParticipants = async () => {
    try { const res = await api.get(`/lobby/${quizId}/participants`); setParticipants(res.data); }
    catch (e) { console.error(e); }
  };

  const removeParticipant = async (pid: string) => {
    try { await api.post(`/lobby/${quizId}/remove`, { participantId: pid }); setParticipants(p => p.filter(p => p.id !== pid)); }
    catch (e) { console.error(e); }
  };

  const startSession = async () => {
    try { await api.post(`/lobby/${quizId}/start`); setStarted(true); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { fetchParticipants(); const int = setInterval(fetchParticipants, 5000); return () => clearInterval(int); }, []);

  useEffect(() => { if (started) router.push(`/teacher/quizzes/${quizId}/live`); }, [started]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Live Quiz Lobby – Host</h1>
      <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 shadow">
        <p className="font-semibold">Quiz Code:</p>
        <p className="text-2xl tracking-wider">{quizId}</p>
        <p className="mt-2 font-semibold">Join Link:</p>
        <a href={quizLink} className="text-indigo-600 underline">{quizLink}</a>
        <div className="mt-4 flex justify-center"><QRCodeCanvas value={quizLink} size={128} /></div>
      </div>
      <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 shadow">
        <h2 className="text-xl font-semibold mb-2">Participants ({participants.length})</h2>
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {participants.map(p => (
            <li key={p.id} className="flex justify-between items-center">
              <span>{p.name || p.id}</span>
              <button onClick={() => removeParticipant(p.id)} className="text-sm text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Remove</button>
            </li>
          ))}
        </ul>
        <button onClick={startSession} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded">Start Live Session</button>
      </div>
    </div>
  );
}
