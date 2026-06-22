"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { v4 as uuidv4 } from "uuid";

import OptionInput from "./components/OptionInput";

interface Option {
  id: string;
  text: string;
  imageUrl: string;
}

export default function CreateQuizPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);

  const [questionText, setQuestionText] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [timeLimit, setTimeLimit] = useState(10);
  const [questionSubmitting, setQuestionSubmitting] = useState(false);

  const [questions, setQuestions] = useState<
    Array<{ id: string; questionText: string }>
  >([]);

  // ✅ FIX: missing option states
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [optionE, setOptionE] = useState("");

  const [questionImageUrl, setQuestionImageUrl] = useState("");
  const [optionAImageUrl, setOptionAImageUrl] = useState("");
  const [optionBImageUrl, setOptionBImageUrl] = useState("");
  const [optionCImageUrl, setOptionCImageUrl] = useState("");
  const [optionDImageUrl, setOptionDImageUrl] = useState("");
  const [optionEImageUrl, setOptionEImageUrl] = useState("");

  const resetQuestionForm = () => {
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setOptionE("");
    setCorrectAnswer("A");
    setTimeLimit(10);
    setQuestionImageUrl("");
    setOptionAImageUrl("");
    setOptionBImageUrl("");
    setOptionCImageUrl("");
    setOptionDImageUrl("");
    setOptionEImageUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a quiz title");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/quiz/create", { title });
      setQuizId(res.data.id);
      alert("Quiz created successfully!");
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

  const handleSaveQuiz = () => {
    if (questions.length === 0) {
      alert("Please add at least one question before saving the quiz.");
      return;
    }
    router.push("/teacher/quizzes");
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      alert("Please enter question text");
      return;
    }

    if (!quizId) {
      alert("Quiz ID missing");
      return;
    }

    try {
      setQuestionSubmitting(true);

      const res = await api.post(`/quiz/${quizId}/questions`, {
        questionText,
        options: [optionA, optionB, optionC, optionD, optionE].filter(Boolean),
        correctAnswer,
        timeLimit,
        imageUrl: questionImageUrl,
        optionImages: {
          A: optionAImageUrl,
          B: optionBImageUrl,
          C: optionCImageUrl,
          D: optionDImageUrl,
          E: optionEImageUrl,
        },
      });

      const newQuestion = {
        id: res.data.id,
        questionText,
      };

      setQuestions((prev) => [...prev, newQuestion]);
      resetQuestionForm();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to add question");
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleDuplicate = async (questionId: string, idx: number) => {
    if (!quizId) {
      alert("Quiz ID missing");
      return;
    }

    try {
      const res = await api.post(
        `/quiz/${quizId}/questions/${questionId}/duplicate`
      );

      const newDup = {
        id: res.data.id,
        questionText: res.data.questionText,
      };

      setQuestions((prev) => {
        const copy = [...prev];
        copy.splice(idx + 1, 0, newDup);
        return copy;
      });
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to duplicate question");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-3xl border shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-2">Create New Quiz</h1>
        <p className="text-gray-500 mb-8">
          Enter a quiz title and start adding questions.
        </p>

        {/* QUIZ TITLE */}
        {!quizId && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl"
                placeholder="e.g. DBMS Quiz"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/teacher/quizzes")}
                className="flex-1 border rounded-xl px-4 py-3"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-indigo-600 text-white rounded-xl px-4 py-3"
              >
                {submitting ? "Creating..." : "Create Quiz"}
              </button>
            </div>
          </form>
        )}

        {/* QUESTIONS */}
        {quizId && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold">Add Questions</h2>

            <form onSubmit={handleAddQuestion} className="space-y-4 border p-6 rounded-xl">
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Enter question"
              />

              <input
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="Option A"
                className="w-full border p-2 rounded"
              />

              <input
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="Option B"
                className="w-full border p-2 rounded"
              />

              <input
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                placeholder="Option C"
                className="w-full border p-2 rounded"
              />

              <input
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                placeholder="Option D"
                className="w-full border p-2 rounded"
              />

              <input
                value={optionE}
                onChange={(e) => setOptionE(e.target.value)}
                placeholder="Option E"
                className="w-full border p-2 rounded"
              />

              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>

              <input
                type="number"
                value={timeLimit}
                onChange={(e) =>
                  setTimeLimit(parseInt(e.target.value) || 0)
                }
                className="w-full border p-2 rounded"
                placeholder="Time limit"
              />

              <button
                type="submit"
                disabled={questionSubmitting}
                className="w-full bg-indigo-600 text-white p-2 rounded"
              >
                Save & Add Question
              </button>

              <button
                type="button"
                onClick={handleSaveQuiz}
                className="w-full border p-2 rounded"
              >
                Save Quiz
              </button>
            </form>

            {/* LIST */}
            <ul className="space-y-2">
              {questions.map((q, idx) => (
                <li
                  key={q.id}
                  className="border p-2 rounded flex justify-between"
                >
                  {q.questionText || "(no text)"}
                  <button
                    onClick={() => handleDuplicate(q.id, idx)}
                    className="text-blue-600"
                  >
                    Duplicate
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}