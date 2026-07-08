"use client";

import { useState } from "react";
import { Users, UserMinus, Copy, Check, Play, QrCode } from "lucide-react";
import api from "@/services/api";
import { QRCodeCanvas } from "qrcode.react";

interface Participant {
  id: string;
  name: string;
  employeeId: string;
  isConnected: boolean;
}

interface TeacherLobbyProps {
  sessionCode: string;
  title: string;
  participants: Participant[];
  onRemove: (studentName: string) => void;
  onStart: () => void;
}

export default function TeacherLobby({
  sessionCode,
  title,
  participants,
  onRemove,
  onStart,
}: TeacherLobbyProps) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const joinUrl = `${origin}/student/lobby/${sessionCode}`;

  const copy = async (value: string, which: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const joined = participants.filter((p) => p.isConnected);

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-white/50 mt-2">
            Share the code, link, or QR for students to join.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Join details */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
            <div className="text-center">
              <span className="text-xs text-white/50 uppercase tracking-widest">
                Quiz Code
              </span>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-5xl font-black tracking-[0.3em] text-white">
                  {sessionCode}
                </span>
                <button
                  onClick={() => copy(sessionCode, "code")}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                  title="Copy code"
                >
                  {copied === "code" ? (
                    <Check size={18} className="text-emerald-400" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                <QrCode size={14} /> Scan to join
              </span>
              <QRCodeCanvas
                value={joinUrl}
                size={176}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                className="rounded-xl p-2 bg-white"
              />
            </div>

            <div>
              <span className="text-xs text-white/50 uppercase tracking-widest">
                Join Link
              </span>
              <div className="mt-2 flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-sm text-white/70 truncate flex-1" title={joinUrl}>
                  {joinUrl}
                </span>
                <button
                  onClick={() => copy(joinUrl, "link")}
                  className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition flex items-center gap-1"
                >
                  {copied === "link" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Users size={18} /> Participants
              </h2>
              <span className="text-sm text-white/50">{joined.length} joined</span>
            </div>

            <ul className="space-y-2 flex-1 overflow-y-auto max-h-[320px] custom-scrollbar">
              {joined.length === 0 ? (
                <li className="text-white/40 text-center py-8">
                  Waiting for students to join...
                </li>
              ) : (
                joined.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{p.name}</span>
                      <span className="text-xs text-white/40">{p.employeeId}</span>
                    </div>
                    <button
                      onClick={() => onRemove(p.name)}
                      className="px-3 py-1 text-sm rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition flex items-center gap-1"
                      title="Remove participant"
                    >
                      <UserMinus size={14} /> Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={onStart}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition flex items-center gap-2 shadow-[0_0_25px_rgba(34,197,94,0.3)]"
          >
            <Play size={20} /> Start Live Session
          </button>
        </div>
      </div>
    </div>
  );
}
