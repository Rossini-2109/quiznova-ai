"use client";

import { Participant } from "./types";

interface Props {
  participants: Participant[];
}

export default function AntiCheatTab({
  participants,
}: Props) {

  const flagged = participants.filter(
    p =>
      p.suspicionScore > 0 ||
      p.tabSwitchCount > 0 ||
      p.windowBlurCount > 0
  );

  return (
    <div className="bg-white/5 rounded-3xl p-6">

      <table className="w-full">

        <thead>
          <tr>
            <th>Name</th>
            <th>Tabs</th>
            <th>Blur</th>
            <th>Score</th>
          </tr>
        </thead>

        <tbody>

          {flagged.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.tabSwitchCount}</td>
              <td>{p.windowBlurCount}</td>
              <td>{p.suspicionScore}%</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}