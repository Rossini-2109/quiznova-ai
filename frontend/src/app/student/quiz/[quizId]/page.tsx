"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Quiz = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  questionCount: number;
};

export default function QuizPreviewPage() {
  const params = useParams();
  const router = useRouter();

  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5103/api/quiz/${quizId}`
        );

        setQuiz(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading Quiz...
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-10 text-center">
        Quiz not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="border rounded-lg p-6 shadow">
        <h1 className="text-3xl font-bold mb-4">
          {quiz.title}
        </h1>

        <p className="mb-6 text-gray-600">
          {quiz.description}
        </p>

        <div className="space-y-2">
          <p>
            <strong>Difficulty:</strong>{" "}
            {quiz.difficulty}
          </p>

          <p>
            <strong>Questions:</strong>{" "}
            {quiz.questionCount}
          </p>

          <p>
            <strong>Time Limit:</strong>{" "}
            {quiz.timeLimit} Minutes
          </p>
        </div>

        <button
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded"
          onClick={() =>
            router.push(
              `/student/quiz/${quiz.id}/start`
            )
          }
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
}