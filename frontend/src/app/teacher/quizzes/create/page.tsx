"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  status: string;
  quizCode: string;
}

export default function QuizManagementPage() {
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuizzes = async () => {
    try {
      const response = await api.get("/quiz/all");

      setQuizzes(response.data);
    } catch (error) {
      console.error("Failed to load quizzes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handlePublish = async (
    quizId: string
  ) => {
    try {
      await api.put(
        `/quiz/publish/${quizId}`
      );

      alert("Quiz published");

      loadQuizzes();
    } catch (error) {
      console.error(error);
      alert("Failed to publish quiz");
    }
  };

  const handleDelete = async (
    quizId: string
  ) => {
    const confirmed = window.confirm(
      "Delete this quiz?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/quiz/${quizId}`
      );

      alert("Quiz deleted");

      loadQuizzes();
    } catch (error) {
      console.error(error);
      alert("Failed to delete quiz");
    }
  };

  const handleEdit = (
    quizId: string
  ) => {
    router.push(
      `/teacher/quizzes/edit/${quizId}`
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Quiz Management
      </h1>

      {loading ? (
        <p>Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <p>No quizzes found.</p>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="border rounded p-4 shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">
                    {quiz.title}
                  </h2>

                  <p>
                    {quiz.description}
                  </p>

                  <p>
                    Difficulty:{" "}
                    {quiz.difficulty}
                  </p>

                  <p>
                    Time Limit:{" "}
                    {quiz.timeLimit} mins
                  </p>

                  <p>
                    Status: {quiz.status}
                  </p>

                  <p>
                    Quiz Code:{" "}
                    {quiz.quizCode}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleEdit(
                        quiz.id
                      )
                    }
                    className="bg-blue-500 text-white px-3 py-2 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handlePublish(
                        quiz.id
                      )
                    }
                    className="bg-green-500 text-white px-3 py-2 rounded"
                  >
                    Publish
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        quiz.id
                      )
                    }
                    className="bg-red-500 text-white px-3 py-2 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}