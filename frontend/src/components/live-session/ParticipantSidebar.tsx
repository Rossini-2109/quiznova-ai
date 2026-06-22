"use client";

import { Participant } from "./types";

interface Props {
  participants: Participant[];
}

export default function ParticipantSidebar({
  participants,
}: Props) {

  const online = participants.filter(
    p => p.isConnected
  );

  const offline = participants.filter(
    p => !p.isConnected
  );

  return (
    <aside className="w-72 border-l border-white/10">

      <div className="p-4">

        <h3 className="font-bold mb-3">
          Online
        </h3>

        {online.map((p) => (
          <div key={p.id}>
            {p.name}
          </div>
        ))}

        <h3 className="font-bold mt-6 mb-3">
          Offline
        </h3>

        {offline.map((p) => (
          <div key={p.id}>
            {p.name}
          </div>
        ))}

      </div>

    </aside>
  );
}