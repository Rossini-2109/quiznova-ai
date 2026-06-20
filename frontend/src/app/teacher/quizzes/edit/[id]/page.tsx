"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";
import { supabase } from "@/lib/supabase";
import { Copy, Trash2, ImagePlus, Clock3 } from "lucide-react";

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

  const duplicateQuestion = (index: number) => {
    const copied: Question = { ...questions[index], id: crypto.randomUUID() };
    const updated = [...questions];
    updated.splice(index + 1, 0, copied);
    setQuestions(updated);
    markDirty();
  };

  const deleteQuestion = (index: number) => {
    if (!confirm("Delete this question?")) return;
    setQuestions(questions.filter((_, i) => i !== index));
    markDirty();
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
    markDirty();
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
      const fileName = `${Date.now()}-${Math.random()}-${file.name}`;
      const { error } = await supabase.storage.from("quiz-images").upload(fileName, file);
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("quiz-images").getPublicUrl(fileName);
      updateQuestionField(index, field, data.publicUrl);
    } catch (error: any) {
      console.error(error);
      alert("Failed to upload image: " + error.message);
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
      await api.put(`/quiz/${id}`, { title, questions });
      alert("Quiz saved successfully");
      setIsSaved(true);
      setIsDirty(false);
      sessionStorage.setItem(`quiz_${id}_saved`, "true");
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
      </div>
    </div>
  );
}

