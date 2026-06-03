"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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

  const {
    data: quizzes,
    isLoading,
    error,
    refetch,
  } = useQuery<Quiz[]>({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const res = await api.get("/quiz/all");
      return res.data;
    },
  });

  const handlePublish = async (
    quizId: string
  ) => {
    try {
      await api.put(
        `/quiz/publish/${quizId}`
      );

      alert(
        "Quiz published successfully"
      );

      refetch();
    } catch (error) {
      console.error(error);
      alert("Failed to publish quiz");
    }
  };

  const handleDelete = async (
    quizId: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quiz?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/quiz/${quizId}`
      );

      alert(
        "Quiz deleted successfully"
      );

      refetch();
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

  const handleQuestions = (
    quizId: string
  ) => {
    router.push(
      `/teacher/quizzes/${quizId}`
    );
  };

  const handleCreateQuiz = () => {
    router.push(
      "/teacher/quizzes/create"
    );
  };

  const handleCopyCode = async (
    code: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        code
      );

      alert("Quiz code copied!");
    } catch {
      alert(
        "Failed to copy quiz code"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        Loading quizzes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Failed to load quizzes
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Quiz Management
        </h1>

        <button
          onClick={handleCreateQuiz}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + New Quiz
        </button>
      </div>

      {!quizzes ||
      quizzes.length === 0 ? (
        <div>No quizzes found.</div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="border rounded-lg p-4 shadow"
            >
              <h2 className="text-xl font-bold">
                {quiz.title}
              </h2>

              <p className="text-gray-600">
                {quiz.description}
              </p>

              <div className="mt-3 space-y-1">
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
                  <strong>
                    Status:
                  </strong>{" "}
                  {quiz.status}
                </p>

                <p>
                  <strong>
                    Quiz Code:
                  </strong>{" "}
                  {quiz.quizCode ||
                    "Not Published"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() =>
                    handleQuestions(
                      quiz.id
                    )
                  }
                  className="bg-purple-600 text-white px-3 py-2 rounded"
                >
                  Questions
                </button>

                <button
                  onClick={() =>
                    handleEdit(
                      quiz.id
                    )
                  }
                  className="bg-blue-600 text-white px-3 py-2 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    handlePublish(
                      quiz.id
                    )
                  }
                  disabled={
                    quiz.status ===
                    "Published"
                  }
                  className={`px-3 py-2 rounded text-white ${
                    quiz.status ===
                    "Published"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600"
                  }`}
                >
                  {quiz.status ===
                  "Published"
                    ? "Published"
                    : "Publish"}
                </button>

                <button
                  onClick={() =>
                    handleCopyCode(
                      quiz.quizCode
                    )
                  }
                  disabled={
                    !quiz.quizCode
                  }
                  className="bg-black text-white px-3 py-2 rounded"
                >
                  Copy Code
                </button>

                <button
                  onClick={() =>
                    handleDelete(
                      quiz.id
                    )
                  }
                  className="bg-red-600 text-white px-3 py-2 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}