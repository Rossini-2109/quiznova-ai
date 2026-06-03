"use client";

import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const { attemptId } = useParams();

  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    axios
      .get(
        `http://localhost:5103/api/attempts/result/${attemptId}`
      )
      .then((res) => setResult(res.data));
  }, [attemptId]);

  if (!result)
    return <div>Loading...</div>;

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="border rounded p-6">
        <h1 className="text-3xl font-bold mb-6">
          Quiz Completed
        </h1>

        <p>
          Score: {result.score}
        </p>

        <p>
          Correct:
          {result.correctAnswers}
        </p>

        <p>
          Wrong:
          {result.wrongAnswers}
        </p>

        <p>
          Percentage:
          {result.percentage.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}