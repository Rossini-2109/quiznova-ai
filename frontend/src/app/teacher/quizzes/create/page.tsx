"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function CreateQuizPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);

      const res = await api.post("/quiz/create", {
        title,
        description,
        numberOfQuestions,
      });

      alert("Quiz created successfully!");
      
      // Redirect to manage questions for the new quiz
      router.push(`/teacher/quizzes/${res.data.id}`);
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to create quiz"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-2xl shadow-indigo-500/5">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Create New Quiz
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Design a custom assessment. You can add questions manually on the next screen, or use the AI Generator to import them.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
              placeholder="e.g. Introduction to Database Systems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400 h-28 resize-none"
              placeholder="Provide a description, study tips, or syllabus topics tested."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
  <label className="block text-sm font-semibold mb-2">
    Number of Questions
  </label>

  <input
    type="number"
    min="1"
    max="100"
    value={numberOfQuestions}
    onChange={(e) =>
      setNumberOfQuestions(Number(e.target.value))
    }
    className="w-full px-4 py-3 rounded-xl border"
  />
</div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push("/teacher/quizzes")}
              className="flex-1 px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl transition-all text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 transition-all text-center cursor-pointer"
            >
              {submitting ? "Creating..." : "Create & Add Questions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}