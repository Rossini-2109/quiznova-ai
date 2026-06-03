"use client";

import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReviewPage() {
  const { attemptId } = useParams();

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    axios
      .get(
        `http://localhost:5103/api/attempts/review/${attemptId}`
      )
      .then((res) => setItems(res.data));
  }, [attemptId]);

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">
        Review Answers
      </h1>

      {items.map((item, index) => (
        <div
          key={index}
          className="border p-4 mb-4 rounded"
        >
          <h2 className="font-semibold">
            {item.questionText}
          </h2>

          <p>
            Your Answer:
            {item.yourAnswer}
          </p>

          <p>
            Correct Answer:
            {item.correctAnswer}
          </p>

          <p>
            Explanation:
            {item.explanation}
          </p>

          <p>
            Result:
            {item.isCorrect
              ? "Correct"
              : "Wrong"}
          </p>
        </div>
      ))}
    </div>
  );
}