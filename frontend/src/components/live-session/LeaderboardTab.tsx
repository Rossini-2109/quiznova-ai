"use client";

import { Participant } from "./types";

interface Props {
  participants: Participant[];
  onRemove: (id: string) => void;
}

export default function LeaderboardTab({
  participants,
  onRemove,
}: Props) {

  const sorted = [...participants].sort(
    (a, b) => b.score - a.score
  );

  return (
    <div className="bg-white/5 rounded-3xl p-6">

      <table className="w-full">

        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
            <th>Correct</th>
          </tr>
        </thead>

        <tbody>

          {sorted.map((p, idx) => (
            <tr key={p.id}>
              <td>{idx + 1}</td>
              <td>{p.name}</td>
              <td>{p.score}</td>
              <td>{p.correctAnswers}</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}