"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";
import { supabase } from "@/lib/supabase";
import {
  Copy,
  Trash2,
  ImagePlus,
  Clock3,
  ArrowUp,
  ArrowDown,
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
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Track if the user has already attempted a save in this session (persist across refresh)
  useEffect(() => {
    const savedFlag = sessionStorage.getItem(`quiz_${id}_saved`);
    if (savedFlag) setIsSaved(true);
  }, [id]);

  // Prompt user on navigation if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSaved) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSaved]);

  const markDirty = () => {
    if (!isSaved) setIsDirty(true);
  };

  useEffect(() => {
    if (!id) return;
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    try {
      const res = await api.get(`/quiz/${id}`);
      const quiz = res.data;

      setTitle(quiz.title || "");
<<<<<<< HEAD
=======
      setShuffleQuestions(quiz.shuffleQuestions || false);
      setMaxAttempts(quiz.maxAttempts || 1);
      
>>>>>>> restore-version
      const formattedQuestions = (quiz.questions || []).map((q: any) => {
        let count = 4;
        if (q.optionE) count = 5;
        else if (q.optionD) count = 4;
        else if (q.optionC) count = 3;
        else count = 2;
        return { ...q, optionE: q.optionE || "", optionCount: count } as Question;
      });
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error(error);
      alert("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionField = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
    markDirty();
  };

<<<<<<< HEAD
  const duplicateQuestion = (index: number) => {
    const copied: Question = { ...questions[index], id: crypto.randomUUID() };
    const updated = [...questions];
    updated.splice(index + 1, 0, copied);
    setQuestions(updated);
    markDirty();
=======
  const duplicateQuestion = async (index: number) => {
    const original = questions[index];
    const copied: Question = {
      ...original,
      id: crypto.randomUUID(),
    };
    // Optimistically update UI
    const updated = [...questions];
    updated.splice(index + 1, 0, copied);
    setQuestions(updated);
    // Call backend to persist duplicate (if endpoint exists)
    try {
      await api.post(`/quiz/${id}/questions/${original.id}/duplicate`);
    } catch (err) {
      console.error(err);
      // Revert UI on failure
      setQuestions(questions);
      alert("Failed to duplicate question");
    }
>>>>>>> restore-version
  };

  const deleteQuestion = async (index: number) => {
    if (!confirm("Delete this question?")) return;
<<<<<<< HEAD
    setQuestions(questions.filter((_, i) => i !== index));
    markDirty();
=======
    const toDelete = questions[index];
    // Optimistically remove from UI
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    try {
      await api.delete(`/quiz/${id}/questions/${toDelete.id}`);
    } catch (err) {
      console.error(err);
      // Revert UI on failure
      setQuestions(questions);
      alert("Failed to delete question");
    }
>>>>>>> restore-version
  };

  const addNewQuestion = async () => {
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
<<<<<<< HEAD
    setQuestions([...questions, newQuestion]);
    markDirty();
=======
    // Optimistically add to UI
    setQuestions([...questions, newQuestion]);
    try {
      await api.post(`/quiz/${id}/questions`, newQuestion);
    } catch (err) {
      console.error(err);
      // Remove optimistic entry on failure
      setQuestions(questions);
      alert("Failed to add new question");
    }
>>>>>>> restore-version
  };

  const addOptionToQuestion = (index: number) => {
    const updated = [...questions];
    const q = updated[index];
    const currentCount = q.optionCount || 4;
    if (currentCount < 5) {
      q.optionCount = currentCount + 1;
      setQuestions(updated);
      markDirty();
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
        if (["C", "D", "E"].includes(q.correctAnswer)) q.correctAnswer = "";
      }
      setQuestions(updated);
      markDirty();
    }
  };

  const handleUploadImage = async (
    index: number,
    field: "questionImageUrl" | "optionAImageUrl" | "optionBImageUrl" | "optionCImageUrl" | "optionDImageUrl" | "optionEImageUrl",
    file: File
  ) => {
    try {
<<<<<<< HEAD
      const fileName = `${Date.now()}-${Math.random()}-${file.name}`;
      const { error } = await supabase.storage.from("quiz-images").upload(fileName, file);
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("quiz-images").getPublicUrl(fileName);
      updateQuestionField(index, field, data.publicUrl);
=======
      // Convert file to Base64 string for DB storage
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
      });
      // Directly store Base64 string in the appropriate field
      updateQuestionField(index, field, base64);
>>>>>>> restore-version
    } catch (error: any) {
      console.error(error);
      alert("Failed to read image: " + error.message);
    }
  };

  const handleRemoveImage = (index: number, field: "questionImageUrl" | "optionAImageUrl" | "optionBImageUrl" | "optionCImageUrl" | "optionDImageUrl" | "optionEImageUrl") => {
    updateQuestionField(index, field, "");
    markDirty();
  };

  const updateQuiz = async () => {
    // Prevent double save
    if (isSaved) return;
    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        alert(`Question ${i + 1} has empty text.`);
        return;
      }
      if (!q.correctAnswer) {
        alert(`Question ${i + 1} missing correct answer.`);
        return;
      }
    }
    try {
<<<<<<< HEAD
      await api.put(`/quiz/${id}`, { title, questions });
      alert("Quiz saved successfully");
      setIsSaved(true);
      setIsDirty(false);
      sessionStorage.setItem(`quiz_${id}_saved`, "true");
=======
      await api.put(`/quiz/${id}`, {
        title,
        questions,
        shuffleQuestions,
        maxAttempts,
      });

      alert("Quiz updated successfully");
      router.push("/teacher/quizzes");
>>>>>>> restore-version
    } catch (error) {
      console.error(error);
      alert("Failed to save quiz");
    }
  };

  const navigateBack = () => {
    if (isDirty && !isSaved) {
      const confirmLeave = confirm("You have unsaved changes. Leave without saving?");
      if (!confirmLeave) return;
    }
    router.push("/teacher/quizzes");
  };

  if (loading) return <div>Loading...</div>;

  return (
<<<<<<< HEAD
    <div className="p-4 max-w-4xl mx-auto">
      <button
        onClick={navigateBack}
        className="mb-4 flex items-center text-blue-500 hover:underline"
      >
        ← Back to Manage Quizzes
      </button>
      <h1 className="text-2xl font-bold mb-4">Edit Quiz</h1>
      <input
        type="text"
        placeholder="Quiz Title"
        value={title}
        onChange={(e) => { setTitle(e.target.value); markDirty(); }}
        className="w-full border p-2 mb-4"
      />
      {/* Render questions UI here (omitted for brevity) */}
      <div className="flex justify-between mt-6">
        <button
          onClick={addNewQuestion}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Add Question
        </button>
        <button
          onClick={updateQuiz}
          disabled={isSaved}
          className={`px-4 py-2 rounded ${isSaved ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-500"}`}
        >
          {isSaved ? "Saved" : "Save Changes"}
        </button>
=======
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

        {/* Quiz Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-zinc-50 p-5 rounded-2xl border">
          <div>
            <label className="block font-semibold mb-2 text-sm text-zinc-700">
              Maximum Attempts Per Student
            </label>
            <input
              type="number"
              min={1}
              className="w-full border rounded-xl p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between mt-6 md:mt-0">
            <div>
              <label className="block font-semibold text-sm text-zinc-700">
                Shuffle Questions
              </label>
              <span className="text-xs text-zinc-400">Randomize question order for participants</span>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-zinc-350 text-indigo-600 focus:ring-indigo-500"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
            />
          </div>
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
                className="border rounded-2xl p-6 bg-white bg-opacity-70 backdrop-blur-lg shadow-lg"
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
>>>>>>> restore-version
      </div>
    </div>
  );
}

