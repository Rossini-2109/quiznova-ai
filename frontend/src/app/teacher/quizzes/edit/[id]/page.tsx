"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [difficulty, setDifficulty] =
    useState("");

  const [timeLimit, setTimeLimit] =
    useState(0);

  useEffect(() => {
    if (!id) return;

    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
  try {
    console.log("Quiz ID:", id);
    console.log(
      "Request URL:",
      `http://localhost:5201/api/Quiz/${id}`
    );

    const res = await api.get(`/Quiz/${id}`);

    console.log("Response:", res.data);

    const quiz = res.data;

    setTitle(quiz.title);
    setDescription(quiz.description);
    setDifficulty(quiz.difficulty);
    setTimeLimit(quiz.timeLimit);
  } catch (error) {
    console.error("LOAD QUIZ ERROR:", error);
    alert("Quiz not found");
  }
};

  const updateQuiz = async () => {
    try {
      await api.put(
        `/quiz/${id}`,
        {
          title,
          description,
          difficulty,
          timeLimit,
        }
      );

      alert(
        "Quiz updated successfully"
      );

      router.push(
        "/teacher/quizzes"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to update quiz"
      );
    }
  };

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">
        Edit Quiz
      </h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          placeholder="Title"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Difficulty"
          value={difficulty}
          onChange={(e) =>
            setDifficulty(
              e.target.value
            )
          }
        />

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Time Limit"
          value={timeLimit}
          onChange={(e) =>
            setTimeLimit(
              Number(
                e.target.value
              )
            )
          }
        />

        <button
          onClick={updateQuiz}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Update Quiz
        </button>
      </div>
    </div>
  );
}