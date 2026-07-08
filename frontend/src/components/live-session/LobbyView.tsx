"use client";

import { Copy, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Participant, SessionState } from "./types";
import { QRCodeCanvas } from "qrcode.react";

interface Props {
  session: SessionState;
  participants: Participant[];
  onRemove: (id: string) => void;
}

export default function LobbyView({
  session,
  participants,
  onRemove,
}: Props) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const joinUrl = `${origin}/student/lobby/${session.sessionCode}`;

  return (
    <main className="flex-1 p-8 max-w-7xl mx-auto w-full">

      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-white">
          Waiting Room
        </h2>

        <p className="text-zinc-400 mt-2">
          Students can join before the quiz starts
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-center">
          <QRCodeCanvas
            value={joinUrl}
            size={256}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            className="rounded-2xl p-4 bg-white mx-auto"
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">

          <div className="flex justify-between mb-4">
            <h3 className="font-bold">
              Students
            </h3>

            <span>
              {participants.length}
            </span>
          </div>

          <div className="space-y-2">

            <AnimatePresence>

              {participants.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-between bg-white/5 p-3 rounded-xl"
                >
                  <span>{p.name}</span>

                  <button
                    onClick={() => onRemove(p.id)}
                  >
                    <X size={14}/>
                  </button>
                </motion.div>
              ))}

            </AnimatePresence>

          </div>

        </div>

      </div>

    </main>
  );
}