"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

export default function TeacherDashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [timeLimit, setTimeLimit] = useState("");

  const [quizzes, setQuizzes] = useState<any[]>([]);

  const publishedCount = quizzes.filter(
    (q) => q.status === "Published"
  ).length;

  const draftCount = quizzes.filter(
    (q) => q.status === "Draft"
  ).length;

  const loadQuizzes = async () => {
    try {
      const response = await api.get("/quiz/all");
      setQuizzes(response.data);
    } catch (error) {
      console.error(
        "Failed to load quizzes",
        error
      );
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleCreateQuiz = async () => {
    try {
      const res = await api.post(
        "/quiz/create",
        {
          title,
          description,
          difficulty,
          timeLimit: Number(timeLimit),
        }
      );

      console.log(
        "Quiz Created:",
        res.data
      );

      alert("Quiz created successfully!");

      await loadQuizzes();

      setTitle("");
      setDescription("");
      setDifficulty("");
      setTimeLimit("");
    } catch (error: any) {
      console.error(error);

      if (error.response) {
        alert(
          typeof error.response.data === "string"
            ? error.response.data
            : error.response.data?.message ||
                "Error creating quiz"
        );
      } else {
        alert("Failed to create quiz");
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Teacher Dashboard
      </h1>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-gray-600">
            Total Quizzes
          </h2>
          <p className="text-2xl font-bold">
            {quizzes.length}
          </p>
        </div>

        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-gray-600">
            Published
          </h2>
          <p className="text-2xl font-bold">
            {publishedCount}
          </p>
        </div>

        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-gray-600">
            Draft
          </h2>
          <p className="text-2xl font-bold">
            {draftCount}
          </p>
        </div>

        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-gray-600">
            Attempts
          </h2>
          <p className="text-2xl font-bold">
            0
          </p>
        </div>
      </div>

      {/* Create Quiz Form */}
      <div className="space-y-4 max-w-md border p-6 rounded">
        <h2 className="text-xl font-bold">
          Create New Quiz
        </h2>

        <input
          className="border p-2 w-full rounded"
          placeholder="Quiz Title"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
        />

        <input
          className="border p-2 w-full rounded"
          placeholder="Description"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        <input
          className="border p-2 w-full rounded"
          placeholder="Difficulty (Easy / Medium / Hard)"
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value)
          }
        />

        <input
          type="number"
          className="border p-2 w-full rounded"
          placeholder="Time Limit (Minutes)"
          value={timeLimit}
          onChange={(e) =>
            setTimeLimit(e.target.value)
          }
        />

        <button
          onClick={handleCreateQuiz}
          className="bg-black text-white px-4 py-2 rounded w-full"
        >
          Create Quiz
        </button>
      </div>

      {/* Quiz List */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          My Quizzes
        </h2>

        {quizzes.length === 0 ? (
          <div className="border rounded p-4">
            No quizzes found.
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="border p-4 rounded mb-3 shadow-sm"
            >
              <h3 className="text-lg font-bold">
                {quiz.title}
              </h3>

              <p className="mt-1">
                {quiz.description}
              </p>

              <div className="mt-2 space-y-1">
                <p>
                  <strong>
                    Difficulty:
                  </strong>{" "}
                  {quiz.difficulty}
                </p>

                <p>
                  <strong>
                    Time Limit:
                  </strong>{" "}
                  {quiz.timeLimit} mins
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {quiz.status}
                </p>

                <p>
                  <strong>Quiz Code:</strong>{" "}
                  {quiz.quizCode}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}