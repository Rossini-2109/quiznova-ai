"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";
import {
  ArrowLeft,
  Plus,
  Copy,
  Trash2,
  ImagePlus,
  X,
  Save,
  Shuffle,
  Minus,
} from "lucide-react";

const inputBase =
  "w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors";

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswer: string;
  questionTimeLimit: number;
  questionImageUrl?: string;
  optionAImageUrl?: string;
  optionBImageUrl?: string;
  optionCImageUrl?: string;
  optionDImageUrl?: string;
  optionEImageUrl?: string;
  optionCount?: number;
}

const generateUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

function makeBlankQuestion(): Question {
  return {
    id: generateUUID(),
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    optionE: "",
    correctAnswer: "A",
    questionTimeLimit: 10,
    questionImageUrl: "",
    optionAImageUrl: "",
    optionBImageUrl: "",
    optionCImageUrl: "",
    optionDImageUrl: "",
    optionEImageUrl: "",
    optionCount: 4,
  };
}

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    try {
      const res = await api.get(`/quiz/${id}`);
      const quiz = res.data;

      setTitle(quiz.title || "");
      setShuffleQuestions(quiz.shuffleQuestions || false);
      setMaxAttempts(quiz.maxAttempts || 1);

      const formatted = (quiz.questions || []).map((q: any) => {
        let count = 4;
        if (q.optionE) count = 5;
        else if (q.optionD) count = 4;
        else if (q.optionC) count = 3;
        else count = 2;

        return {
          ...q,
          optionE: q.optionE || "",
          optionCount: count,
        };
      });

      // If no questions exist yet, show one blank question in the editor
      if (formatted.length === 0) {
        setQuestions([makeBlankQuestion()]);
      } else {
        setQuestions(formatted);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionField = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const duplicateQuestion = (index: number) => {
    const original = questions[index];

    const cloned: Question = {
      ...original,
      id: generateUUID(),
      questionText: original.questionText,
      optionA: original.optionA,
      optionB: original.optionB,
      optionC: original.optionC,
      optionD: original.optionD,
      optionE: original.optionE || "",
      correctAnswer: original.correctAnswer,
      questionTimeLimit: original.questionTimeLimit,
      questionImageUrl: original.questionImageUrl,
      optionAImageUrl: original.optionAImageUrl,
      optionBImageUrl: original.optionBImageUrl,
      optionCImageUrl: original.optionCImageUrl,
      optionDImageUrl: original.optionDImageUrl,
      optionEImageUrl: original.optionEImageUrl,
      optionCount: original.optionCount || 4,
    };

    const updated = [...questions];
    updated.splice(index + 1, 0, cloned);
    setQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    if (!confirm("Delete this question?")) return;

    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const addNewQuestion = () => {
    setQuestions((prev) => [...prev, makeBlankQuestion()]);
  };

  const handleUploadImage = async (
    index: number,
    field: keyof Question,
    file: File
  ) => {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

    updateQuestionField(index, field, base64);
  } catch (err: any) {
    console.error(err);
    alert("Image upload failed: " + err.message);
  }
};

  // Add a new option field to a question (up to 5)
  const addOptionToQuestion = (qIndex: number) => {
    const q = questions[qIndex];
    const currentCount = q.optionCount || 4;
    if (currentCount >= 5) return; // max 5 options
    const newCount = currentCount + 1;
    const field = (`option${String.fromCharCode(64 + newCount)}`) as keyof Question;
    const imgField = (`option${String.fromCharCode(64 + newCount)}ImageUrl`) as keyof Question;
    const updatedQuestion = {
      ...q,
      optionCount: newCount,
      [field]: "",
      [imgField]: "",
    } as Question;
    const updated = [...questions];
    updated[qIndex] = updatedQuestion;
    setQuestions(updated);
  };

  // Remove the last option field from a question (minimum 2)
  const removeOptionFromQuestion = (qIndex: number) => {
    const q = questions[qIndex];
    const currentCount = q.optionCount || 4;
    if (currentCount <= 2) return; // min 2 options
    const newCount = currentCount - 1;
    const field = (`option${String.fromCharCode(64 + newCount + 1)}`) as keyof Question;
    const imgField = (`option${String.fromCharCode(64 + newCount + 1)}ImageUrl`) as keyof Question;
    // Clear the removed option fields
    updateQuestionField(qIndex, field, "");
    updateQuestionField(qIndex, imgField, "");
    updateQuestionField(qIndex, "optionCount", newCount);
  };

  const updateQuiz = async () => {
    if (isSaved) return;

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        alert(`Question ${i + 1} is empty`);
        return;
      }
      if (!questions[i].correctAnswer) {
        alert(`Question ${i + 1} missing correct answer`);
        return;
      }
    }

    try {
      await api.put(`/quiz/${id}`, {
        title,
        questions: questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE ?? "",
          correctAnswer: q.correctAnswer,
          questionTimeLimit: q.questionTimeLimit,
          questionImageUrl: q.questionImageUrl,
          optionAImageUrl: q.optionAImageUrl,
          optionBImageUrl: q.optionBImageUrl,
          optionCImageUrl: q.optionCImageUrl,
          optionDImageUrl: q.optionDImageUrl,
          optionEImageUrl: q.optionEImageUrl,
        })),
        shuffleQuestions,
        maxAttempts,
      });

      alert("Quiz updated successfully");
      setIsSaved(true);
      router.push("/teacher/quizzes");
    } catch (err) {
      console.error(err);
      alert("Failed to save quiz");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/teacher/quizzes")}
            className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={16} className="text-zinc-500" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-indigo-800 dark:from-zinc-100 dark:to-indigo-300 bg-clip-text text-transparent">
              Edit Quiz
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <button
          onClick={updateQuiz}
          className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-colors"
        >
          <Save size={16} /> Save Quiz
        </button>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 mb-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
            Quiz Title
          </label>
          <input
            className={inputBase}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quiz title"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              <Shuffle size={15} className="text-indigo-500" />
              Shuffle questions &amp; options
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
            />
          </label>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
              Max Attempts
            </label>
            <input
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className={inputBase}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {questions.map((q, index) => {
          const count = q.optionCount || 4;
          return (
            <div
              key={q.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6"
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2.5 font-bold text-zinc-800 dark:text-zinc-100">
                  <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  Question {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateQuestion(index)}
                    title="Duplicate question"
                    className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-600 transition-colors"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => deleteQuestion(index)}
                    title="Delete question"
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Question text */}
              <textarea
                className={inputBase}
                rows={2}
                placeholder="Enter question..."
                value={q.questionText}
                onChange={(e) =>
                  updateQuestionField(index, "questionText", e.target.value)
                }
              />

              {/* Question image */}
              <div className="mt-3 flex items-center gap-3">
                {q.questionImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={q.questionImageUrl}
                    alt="Question"
                    className="w-16 h-16 object-contain rounded-lg border border-zinc-200 dark:border-zinc-700"
                  />
                )}
                <button
                  type="button"
                  title="Upload image"
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => {
                    const el = document.getElementById(
                      `file-question-${index}`
                    ) as HTMLInputElement;
                    if (el) el.click();
                  }}
                >
                  <ImagePlus size={14} />
                  {q.questionImageUrl ? "Change image" : "Add image"}
                </button>
                {q.questionImageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      updateQuestionField(index, "questionImageUrl", "")
                    }
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                )}
                <input
                  id={`file-question-${index}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUploadImage(
                        index,
                        "questionImageUrl",
                        e.target.files[0]
                      );
                    }
                  }}
                />
              </div>

              {/* Options */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Options
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => removeOptionFromQuestion(index)}
                      disabled={count <= 2}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Remove last option"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => addOptionToQuestion(index)}
                      disabled={count >= 5}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Add option"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {["A", "B", "C", "D", "E"].slice(0, count).map((letter) => {
                    const field = `option${letter}` as keyof Question;
                    const imgField = `option${letter}ImageUrl` as keyof Question;
                    const isCorrect = q.correctAnswer === letter;
                    return (
                      <div key={letter} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestionField(index, "correctAnswer", letter)
                          }
                          title={isCorrect ? "Correct answer" : "Mark as correct"}
                          className={`h-9 w-9 flex-shrink-0 rounded-lg font-bold text-sm flex items-center justify-center transition-colors ${
                            isCorrect
                              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          }`}
                        >
                          {letter}
                        </button>
                        <input
                          className={`${inputBase} flex-1`}
                          placeholder={`Option ${letter}`}
                          value={(q[field] as string) ?? ""}
                          onChange={(e) =>
                            updateQuestionField(index, field, e.target.value)
                          }
                        />
                        {q[imgField] ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={q[imgField] as string}
                              alt={`Option ${letter}`}
                              className="w-9 h-9 object-contain rounded-lg border border-zinc-200 dark:border-zinc-700"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuestionField(index, imgField, "")}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              title="Remove image"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            title="Upload image"
                            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            onClick={() => {
                              const el = document.getElementById(
                                `file-${index}-${letter}`
                              );
                              if (el) (el as HTMLInputElement).click();
                            }}
                          >
                            <ImagePlus size={14} />
                          </button>
                        )}
                        <input
                          id={`file-${index}-${letter}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadImage(index, imgField, e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Tap a letter to mark the correct answer.
                </p>
              </div>

              {/* Correct answer + time limit */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
                    Correct Answer
                  </label>
                  <select
                    className={inputBase}
                    value={q.correctAnswer}
                    onChange={(e) =>
                      updateQuestionField(index, "correctAnswer", e.target.value)
                    }
                  >
                    {["A", "B", "C", "D", "E"].slice(0, count).map((letter) => (
                      <option key={letter} value={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
                    Time Limit (seconds)
                  </label>
                  <input
                    type="number"
                    className={inputBase}
                    min={5}
                    value={q.questionTimeLimit}
                    onChange={(e) =>
                      updateQuestionField(
                        index,
                        "questionTimeLimit",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add question */}
      <button
        type="button"
        onClick={addNewQuestion}
        className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 py-4 text-sm font-semibold text-zinc-500 hover:text-indigo-600 hover:border-indigo-400 transition-colors"
      >
        <Plus size={16} /> Add New Question
      </button>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-500">
            {questions.length} question{questions.length === 1 ? "" : "s"}
          </span>
          <button
            onClick={updateQuiz}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-colors"
          >
            <Save size={16} /> Save Quiz
          </button>
        </div>
      </div>
    </div>
  );
}