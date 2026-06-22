"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import OptionInput from "./components/OptionInput";

interface Option {
  id: string;
  text: string;
  imageUrl: string;
}

const LETTERS = ["A", "B", "C", "D", "E"] as const;

function makeOption(id: string): Option {
  return { id, text: "", imageUrl: "" };
}

export default function CreateQuizPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);

  const [questionText, setQuestionText] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [timeLimit, setTimeLimit] = useState(10);
  const [optionCount, setOptionCount] = useState(4);
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionImageUrl, setQuestionImageUrl] = useState("");

  const [options, setOptions] = useState<Option[]>([
    makeOption("A"),
    makeOption("B"),
    makeOption("C"),
    makeOption("D"),
    makeOption("E"),
  ]);

  const [questions, setQuestions] = useState<
    Array<{ id: string; questionText: string }>
  >([]);

  const updateOption = (index: number, fields: Partial<Option>) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...fields };
      return next;
    });
  };

  const resetQuestionForm = () => {
    setQuestionText("");
    setCorrectAnswer("A");
    setTimeLimit(10);
    setOptionCount(4);
    setQuestionImageUrl("");
    setOptions([
      makeOption("A"),
      makeOption("B"),
      makeOption("C"),
      makeOption("D"),
      makeOption("E"),
    ]);
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
      router.push(`/teacher/quizzes/lobby/${res.data.id}/host`);
    } catch (error: unknown) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(
        err?.response?.data?.message || "Failed to create quiz"
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

    if (!options[0].text.trim() || !options[1].text.trim()) {
      alert("Options A and B are required");
      return;
    }

    if (optionCount >= 3 && !options[2].text.trim()) {
      alert("Option C is required");
      return;
    }

    if (optionCount >= 4 && !options[3].text.trim()) {
      alert("Option D is required");
      return;
    }

    if (optionCount >= 5 && !options[4].text.trim()) {
      alert("Option E is required");
      return;
    }

    if (!correctAnswer) {
      alert("Please select the correct answer");
      return;
    }

    if (!quizId) {
      alert("Quiz ID missing");
      return;
    }

    try {
      setQuestionSubmitting(true);

      const res = await api.post("/quiz/add-question", {
        quizId,
        questionText,
        optionA: options[0].text,
        optionB: options[1].text,
        optionC: optionCount >= 3 ? options[2].text : "",
        optionD: optionCount >= 4 ? options[3].text : "",
        optionE: optionCount >= 5 ? options[4].text : "",
        correctAnswer,
        questionType: "MCQ",
        questionTimeLimit: timeLimit,
        questionImageUrl: questionImageUrl || undefined,
        optionAImageUrl: options[0].imageUrl || undefined,
        optionBImageUrl: options[1].imageUrl || undefined,
        optionCImageUrl: optionCount >= 3 ? options[2].imageUrl || undefined : undefined,
        optionDImageUrl: optionCount >= 4 ? options[3].imageUrl || undefined : undefined,
        optionEImageUrl: optionCount >= 5 ? options[4].imageUrl || undefined : undefined,
      });

      setQuestions((prev) => [
        ...prev,
        { id: res.data.id, questionText },
      ]);
      resetQuestionForm();
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || "Failed to add question");
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleDuplicate = async (questionId: string, idx: number) => {
    if (!quizId) return;

    try {
      const res = await api.post(
        `/quiz/${quizId}/questions/${questionId}/duplicate`
      );

      setQuestions((prev) => {
        const copy = [...prev];
        copy.splice(idx + 1, 0, {
          id: res.data.id,
          questionText: res.data.questionText,
        });
        return copy;
      });
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to duplicate question");
    }
  };

  const handleQuestionImage = async (file: File) => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setQuestionImageUrl(base64);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/teacher/quizzes")}
          className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={16} className="text-zinc-500" />
        </button>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-indigo-800 dark:from-zinc-100 dark:to-indigo-300 bg-clip-text text-transparent">
          Create New Quiz
        </h1>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 md:p-8">
        <p className="text-zinc-500 mb-8">
          Enter a quiz title and start adding questions.
        </p>

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
                className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. DBMS Quiz"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/teacher/quizzes")}
                className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-3 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Creating..." : "Create Quiz"}
              </button>
            </div>
          </form>
        )}

        {quizId && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Add Questions</h2>

            <form
              onSubmit={handleAddQuestion}
              className="space-y-4 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30"
            >
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Question
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter question text"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3">
                {questionImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={questionImageUrl}
                    alt="Question"
                    className="w-16 h-16 object-contain rounded-lg border border-zinc-200 dark:border-zinc-700"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(
                      "create-question-image"
                    ) as HTMLInputElement;
                    if (el) el.click();
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ImagePlus size={14} />
                  {questionImageUrl ? "Change image" : "Add image"}
                </button>
                {questionImageUrl && (
                  <button
                    type="button"
                    onClick={() => setQuestionImageUrl("")}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                )}
                <input
                  id="create-question-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleQuestionImage(file);
                  }}
                />
              </div>

              <div className="space-y-3">
                {LETTERS.slice(0, optionCount).map((letter, index) => (
                  <OptionInput
                    key={letter}
                    label={letter}
                    option={options[index]}
                    onChange={(fields) => updateOption(index, fields)}
                    onRemove={() =>
                      setOptionCount((c) => Math.max(2, c - 1))
                    }
                    canRemove={optionCount > 2 && index === optionCount - 1}
                  />
                ))}
              </div>

              {optionCount < 5 && (
                <button
                  type="button"
                  onClick={() => setOptionCount((c) => Math.min(5, c + 1))}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  + Add option
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Correct Answer
                  </label>
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-white dark:bg-zinc-900"
                  >
                    {LETTERS.slice(0, optionCount).map((letter) => (
                      <option key={letter} value={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Time Limit (seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={timeLimit}
                    onChange={(e) =>
                      setTimeLimit(parseInt(e.target.value) || 10)
                    }
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={questionSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 disabled:opacity-50 transition-colors"
                >
                  {questionSubmitting ? "Saving..." : "Save & Add Question"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuiz}
                  className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Done — Back to Quizzes
                </button>
              </div>
            </form>

            {questions.length > 0 && (
              <ul className="space-y-2">
                {questions.map((q, idx) => (
                  <li
                    key={q.id}
                    className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-4 bg-white dark:bg-zinc-900"
                  >
                    <span className="flex-1 truncate">
                      {idx + 1}. {q.questionText}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(q.id, idx)}
                      className="text-sm text-indigo-600 hover:underline shrink-0"
                    >
                      Duplicate
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
