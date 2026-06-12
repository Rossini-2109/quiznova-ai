"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";
import {
  Copy,
  Trash2,
  ImagePlus,
  Clock3,
  Star,
} from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  questionTimeLimit: number;
  questionImageUrl?: string;
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
      setQuestions(quiz.questions || []);
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
      correctAnswer: "",
      questionTimeLimit: 10,
      questionImageUrl: "",
    };

    setQuestions([...questions, newQuestion]);
  };

  const updateQuiz = async () => {
    try {
      await api.put(`/quiz/${id}`, {
        title,
        questions,
      });

      alert("Quiz updated successfully");
      router.push(
  `/teacher/quizzes/edit/${quiz.id}`
);
    } catch (error) {
      console.error(error);
      alert("Failed to update quiz");
    }
  };

  const renderOption = (
    index: number,
    option: "A" | "B" | "C" | "D",
    value: string,
    field: keyof Question,
    correctAnswer: string
  ) => (
    <div
      className={`flex items-center gap-3 border rounded-xl p-3 transition ${
        correctAnswer === option
          ? "border-indigo-600 bg-indigo-50"
          : ""
      }`}
    >
      <input
        type="radio"
        name={`correct-${index}`}
        checked={correctAnswer === option}
        onChange={() =>
          updateQuestionField(
            index,
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
            index,
            field,
            e.target.value
          )
        }
      />
    </div>
  );

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
          {questions.map((q, index) => (
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
                    className="p-2 rounded-lg border hover:bg-yellow-50"
                  >
                    <Star size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteQuestion(index)
                    }
                    className="p-2 rounded-lg border text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Question */}
              <input
                className="border rounded-lg p-3 w-full mb-4"
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

              {/* Options */}
              <div className="grid gap-3">
                {renderOption(
                  index,
                  "A",
                  q.optionA,
                  "optionA",
                  q.correctAnswer
                )}

                {renderOption(
                  index,
                  "B",
                  q.optionB,
                  "optionB",
                  q.correctAnswer
                )}

                {renderOption(
                  index,
                  "C",
                  q.optionC,
                  "optionC",
                  q.correctAnswer
                )}

                {renderOption(
                  index,
                  "D",
                  q.optionD,
                  "optionD",
                  q.correctAnswer
                )}
              </div>

              {/* Timer */}
              <div className="mt-5">
                <label className="font-medium flex items-center gap-2 mb-2">
                  <Clock3 size={18} />
                  Timer
                </label>

                <select
                  className="border rounded-xl p-3 w-full"
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

              {/* Image Upload */}
              <div className="mt-4">
                <button
                  type="button"
                  className="p-2 border rounded-lg hover:bg-gray-100"
                >
                  <ImagePlus size={20} />
                </button>
              </div>
            </div>
          ))}
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