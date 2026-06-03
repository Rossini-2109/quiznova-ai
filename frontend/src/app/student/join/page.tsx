"use client";

import { useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";

export default function JoinQuizPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleJoin = async () => {
    if (!code.trim()) {
      alert("Please enter a quiz code");
      return;
    }

    try {
      setLoading(true);

      const res = await api.get(
        `/quiz/code/${code}`
      );

      router.push(
        `/student/quiz/${res.data.id}`
      );
    } catch (error) {
      console.error(error);
      alert("Quiz not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">
        Join Quiz
      </h1>

      <input
        className="border p-2 w-full rounded"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter Quiz Code"
      />

      <button
        onClick={handleJoin}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 mt-4 rounded w-full"
      >
        {loading ? "Joining..." : "Join Quiz"}
      </button>
    </div>
  );
}