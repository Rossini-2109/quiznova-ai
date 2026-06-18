"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";
import { supabase } from "@/lib/supabase";
import {
  Copy,
  Trash2,
  ImagePlus,
  Clock3,
} from "lucide-react";

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

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    try {
      const res = await api.get(`/quiz/${id}`);
      const quiz = res.data;

      setTitle(quiz.title || "");
      
      const formattedQuestions = (quiz.questions || []).map((q: any) => {
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

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error(error);
      alert("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionField = (
    index: number,
    field: keyof Question,
    value: any
  ) => {
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setQuestions(updated);
  };

  const duplicateQuestion = (index: number) => {
    const copied: Question = {
      ...questions[index],
      id: crypto.randomUUID(),
    };

    const updated = [...questions];
    updated.splice(index + 1, 0, copied);
    setQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    if (!confirm("Delete this question?")) return;

    setQuestions(
      questions.filter((_, i) => i !== index)
    );
  };

  const addNewQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      optionE: "",
      correctAnswer: "",
      questionTimeLimit: 10,
      optionCount: 4,
    };

    setQuestions([...questions, newQuestion]);
  };

  const addOptionToQuestion = (index: number) => {
    const updated = [...questions];
    const q = updated[index];
    const currentCount = q.optionCount || 4;
    if (currentCount < 5) {
      q.optionCount = currentCount + 1;
      setQuestions(updated);
    }
  };

  const removeOptionFromQuestion = (index: number) => {
    const updated = [...questions];
    const q = updated[index];
    const currentCount = q.optionCount || 4;
    if (currentCount > 2) {
      const newCount = currentCount - 1;
      q.optionCount = newCount;
      if (newCount === 4) {
        q.optionE = "";
        q.optionEImageUrl = "";
        if (q.correctAnswer === "E") q.correctAnswer = "";
      } else if (newCount === 3) {
        q.optionD = "";
        q.optionDImageUrl = "";
        if (q.correctAnswer === "D") q.correctAnswer = "";
      } else if (newCount === 2) {
        q.optionC = "";
        q.optionCImageUrl = "";
        if (q.correctAnswer === "C" || q.correctAnswer === "D" || q.correctAnswer === "E") {
          q.correctAnswer = "";
        }
      }
      setQuestions(updated);
    }
  };

  const handleUploadImage = async (
    index: number,
    field: "questionImageUrl" | "optionAImageUrl" | "optionBImageUrl" | "optionCImageUrl" | "optionDImageUrl" | "optionEImageUrl",
    file: File
  ) => {
    try {
      const fileName = `${Date.now()}-${Math.random()}-${file.name}`;
      const { error } = await supabase.storage
        .from("quiz-images")
        .upload(fileName, file);

      if (error) throw new Error(error.message);

      const { data } = supabase.storage
        .from("quiz-images")
        .getPublicUrl(fileName);

      updateQuestionField(index, field, data.publicUrl);
    } catch (error: any) {
      console.error(error);
      alert("Failed to upload image: " + error.message);
    }
  };

  const handleRemoveImage = (
    index: number,
    field: "questionImageUrl" | "optionAImageUrl" | "optionBImageUrl" | "optionCImageUrl" | "optionDImageUrl" | "optionEImageUrl"
  ) => {
    updateQuestionField(index, field, "");
  };

  const updateQuiz = async () => {
    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        alert(`Question ${i + 1} has empty text.`);
        return;
      }
      if (!q.optionA.trim() || !q.optionB.trim()) {
        alert(`Question ${i + 1} requires Option A and Option B.`);
        return;
      }
      const count = q.optionCount || 4;
      if (count >= 3 && !q.optionC.trim()) {
        alert(`Question ${i + 1} requires Option C.`);
        return;
      }
      if (count >= 4 && !q.optionD.trim()) {
        alert(`Question ${i + 1} requires Option D.`);
        return;
      }
      if (count >= 5 && (!q.optionE || !q.optionE.trim())) {
        alert(`Question ${i + 1} requires Option E.`);
        return;
      }
      if (!q.correctAnswer) {
        alert(`Question ${i + 1} has no correct answer selected.`);
        return;
      }
    }

    try {
      await api.put(`/quiz/${id}`, {
        title,
        questions,
      });

      alert("Quiz updated successfully");
      router.push("/teacher/quizzes");
    } catch (error) {
      console.error(error);
      alert("Failed to update quiz");
    }
  };

  const renderOption = (
    qIndex: number,
    option: "A" | "B" | "C" | "D" | "E",
    value: string,
    field: keyof Question,
    imageUrlField: keyof Question,
    correctAnswer: string
  ) => {
    const q = questions[qIndex];
    const imageUrl = q[imageUrlField] as string;
    return (
      <div className="space-y-2">
        <div
          className={`flex items-center gap-3 border rounded-xl p-3 transition ${
            correctAnswer === option
              ? "border-indigo-600 bg-indigo-50"
              : ""
          }`}
        >
          <input
            type="radio"
            name={`correct-${qIndex}`}
            checked={correctAnswer === option}
            onChange={() =>
              updateQuestionField(
                qIndex,
                "correctAnswer",
                option
              )
            }
          />

          <input
            className="flex-1 outline-none bg-transparent"
            placeholder={`Option ${option}`}
            value={value || ""}
            onChange={(e) =>
              updateQuestionField(
                qIndex,
                field,
                e.target.value
              )
            }
          />

          {/* Option Image Controls */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id={`upload-opt-${qIndex}-${option}`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadImage(qIndex, imageUrlField as any, file);
                }
              }}
            />
            <label
              htmlFor={`upload-opt-${qIndex}-${option}`}
              className="p-2 border rounded-lg hover:bg-gray-100 cursor-pointer text-zinc-500 hover:text-zinc-700"
              title="Upload Option Image"
            >
              <ImagePlus size={16} />
            </label>
            {imageUrl && (
              <button
                type="button"
                onClick={() => handleRemoveImage(qIndex, imageUrlField as any)}
                className="p-2 border border-red-200 text-red-650 hover:bg-red-50 rounded-lg"
                title="Remove Option Image"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Option Image Preview */}
        {imageUrl && (
          <div className="relative w-24 h-24 border rounded-xl overflow-hidden group ml-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={`Option ${option}`} className="object-cover w-full h-full" />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-lg">
        Loading quiz...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-lg border p-8">
        <h1 className="text-4xl font-bold mb-8">
          Edit Quiz
        </h1>

        {/* Quiz Name */}
        <div className="mb-8">
          <label className="block font-semibold mb-2">
            Quiz Name
          </label>

          <input
            className="w-full border rounded-xl p-4"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />
        </div>

        {/* Questions Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Questions
          </h2>

          <button
            type="button"
            onClick={addNewQuestion}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
          >
            Add Question
          </button>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, index) => {
            const count = q.optionCount || 4;
            return (
              <div
                key={q.id}
                className="border rounded-2xl p-6 bg-gray-50"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm">
                      Q{index + 1}
                    </span>

                    <h3 className="font-semibold text-lg">
                      Question {index + 1}
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        duplicateQuestion(index)
                      }
                      className="p-2 rounded-lg border hover:bg-gray-100"
                    >
                      <Copy size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteQuestion(index)
                      }
                      className="p-2 rounded-lg border text-red-650 hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <input
                  className="border rounded-lg p-3 w-full mb-3"
                  placeholder="Enter question"
                  value={q.questionText}
                  onChange={(e) =>
                    updateQuestionField(
                      index,
                      "questionText",
                      e.target.value
                    )
                  }
                />

                {/* Question Image Controls */}
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`upload-q-${index}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadImage(index, "questionImageUrl", file);
                      }
                    }}
                  />
                  <label
                    htmlFor={`upload-q-${index}`}
                    className="px-3 py-1.5 border rounded-xl hover:bg-gray-100 cursor-pointer flex items-center gap-1.5 text-xs text-zinc-650 bg-white"
                  >
                    <ImagePlus size={16} />
                    Upload Question Image
                  </label>

                  {q.questionImageUrl && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, "questionImageUrl")}
                      className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1.5 text-xs bg-white"
                    >
                      <Trash2 size={16} />
                      Remove Question Image
                    </button>
                  )}
                </div>

                {q.questionImageUrl && (
                  <div className="mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={q.questionImageUrl} alt="Question" className="max-w-xs rounded-xl border bg-white p-1" />
                  </div>
                )}

                {/* Options */}
                <div className="grid gap-3">
                  {renderOption(
                    index,
                    "A",
                    q.optionA,
                    "optionA",
                    "optionAImageUrl",
                    q.correctAnswer
                  )}

                  {renderOption(
                    index,
                    "B",
                    q.optionB,
                    "optionB",
                    "optionBImageUrl",
                    q.correctAnswer
                  )}

                  {count >= 3 && renderOption(
                    index,
                    "C",
                    q.optionC,
                    "optionC",
                    "optionCImageUrl",
                    q.correctAnswer
                  )}

                  {count >= 4 && renderOption(
                    index,
                    "D",
                    q.optionD,
                    "optionD",
                    "optionDImageUrl",
                    q.correctAnswer
                  )}

                  {count >= 5 && renderOption(
                    index,
                    "E",
                    q.optionE || "",
                    "optionE",
                    "optionEImageUrl",
                    q.correctAnswer
                  )}
                </div>

                {/* Add/Remove Option buttons */}
                <div className="flex gap-2.5 mt-4">
                  <button
                    type="button"
                    disabled={count >= 5}
                    className={`border bg-white px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                      count >= 5
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-zinc-100"
                    }`}
                    onClick={() => addOptionToQuestion(index)}
                  >
                    + Add Option
                  </button>
                  <button
                    type="button"
                    disabled={count <= 2}
                    className={`border bg-white px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                      count <= 2
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-zinc-100"
                    }`}
                    onClick={() => removeOptionFromQuestion(index)}
                  >
                    Remove Option
                  </button>
                </div>

                {/* Timer */}
                <div className="mt-5">
                  <label className="font-medium flex items-center gap-2 mb-2">
                    <Clock3 size={18} />
                    Timer
                  </label>

                  <select
                    className="border rounded-xl p-3 w-full bg-white"
                    value={q.questionTimeLimit}
                    onChange={(e) =>
                      updateQuestionField(
                        index,
                        "questionTimeLimit",
                        Number(e.target.value)
                      )
                    }
                  >
                    <option value={10}>10 Seconds</option>
                    <option value={15}>15 Seconds</option>
                    <option value={20}>20 Seconds</option>
                    <option value={30}>30 Seconds</option>
                    <option value={45}>45 Seconds</option>
                    <option value={60}>60 Seconds</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={addNewQuestion}
            className="w-full border-2 border-dashed border-indigo-400 rounded-2xl p-6 text-indigo-600 font-semibold hover:bg-indigo-50 transition"
          >
            ➕ Add Another Question
          </button>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={updateQuiz}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold"
            >
              💾 Save Quiz Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}