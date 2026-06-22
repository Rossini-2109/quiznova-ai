"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function CreateQuizPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a quiz title");
      return;
    }

    try {
      setSubmitting(true);

      const res = await api.post(
        "/quiz/create",
        {
          title,
        }
      );

      alert("Quiz created successfully!");

      router.push(
        `/teacher/quizzes/edit/${res.data.id}`
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
        error?.response?.data ||
        "Failed to create quiz"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-3xl border shadow-sm p-8">

        <h1 className="text-3xl font-bold mb-2">
          Create New Quiz
        </h1>

        <p className="text-gray-500 mb-8">
          Enter a quiz title and start adding questions.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold mb-2">
              Quiz Title
            </label>

            <input
              type="text"
              placeholder="e.g. DBMS Quiz"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              required
              className="w-full px-4 py-3 rounded-xl border"
            />
          </div>

          <div className="flex gap-4">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/teacher/quizzes"
                )
              }
              className="flex-1 px-6 py-3 rounded-xl border"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white"
            >
              {submitting
                ? "Creating..."
                : "Create Quiz"}
            </button>

          </div>
        </form>

      </div>
    </div>
  );
}