"use client";

import {
  useEffect,
  useState
} from "react";

import {
  connection
} from "@/lib/signalr";

export default function LobbyPage() {
  const [students,
    setStudents] =
      useState<string[]>([]);

  useEffect(() => {

    const init = async () => {

      if (
        connection.state ===
        "Disconnected"
      ) {
        await connection.start();
      }

      connection.on(
        "StudentJoined",
        (name: string) => {
          setStudents(prev => [
            ...prev,
            name
          ]);
        }
      );

      connection.on(
        "QuizStarted",
        () => {
          window.location.href =
            "/student/quiz";
        }
      );
    };

    init();

  }, []);

  return (
    <div className="p-10">

      <h1 className="text-4xl font-bold">
        Waiting Room
      </h1>

      <p>
        Waiting for teacher...
      </p>

      <div className="mt-6">

        {students.map(
          (s, i) => (
            <div
              key={i}
            >
              ✓ {s}
            </div>
          )
        )}

      </div>

    </div>
  );
}