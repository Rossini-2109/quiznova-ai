"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";

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

      setQuestions(formatted);
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

  const duplicateQuestion = async (index: number) => {
    const original = questions[index];

    const copied = {
      ...original,
      id: crypto.randomUUID(),
    };

    const updated = [...questions];
    updated.splice(index + 1, 0, copied);
    setQuestions(updated);

    try {
      await api.post(`/quiz/${id}/questions/${original.id}/duplicate`);
    } catch (err) {
      console.error(err);
      setQuestions(questions);
      alert("Failed to duplicate question");
    }
  };

  const deleteQuestion = async (index: number) => {
    if (!confirm("Delete this question?")) return;

    const target = questions[index];
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);

    try {
      await api.delete(`/quiz/${id}/questions/${target.id}`);
    } catch (err) {
      console.error(err);
      setQuestions(questions);
      alert("Failed to delete question");
    }
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

    setQuestions([...questions, newQuestion]);

    try {
      await api.post(`/quiz/${id}/questions`, newQuestion);
    } catch (err) {
      console.error(err);
      setQuestions(questions);
      alert("Failed to add question");
    }
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
        questions,
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

  const addOptionToQuestion = (index: number) => {
    const updated = [...questions];
    const q = updated[index];
    const count = q.optionCount || 4;

    if (count < 5) {
      q.optionCount = count + 1;
      setQuestions(updated);
    }
  };

  const removeOptionFromQuestion = (index: number) => {
    const updated = [...questions];
    const q = updated[index];
    const count = q.optionCount || 4;

    if (count > 2) {
      q.optionCount = count - 1;
      setQuestions(updated);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Edit Quiz</h1>

      <input
        className="border p-2 w-full mb-4"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quiz title"
      />

      <div className="flex gap-4 mb-4">
        <label>
          Shuffle:
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={(e) => setShuffleQuestions(e.target.checked)}
          />
        </label>

        <input
          type="number"
          value={maxAttempts}
          onChange={(e) => setMaxAttempts(Number(e.target.value))}
          className="border p-2 w-24"
        />
      </div>

      <button
        onClick={addNewQuestion}
        className="bg-green-600 text-white px-4 py-2 mb-4"
      >
        Add Question
      </button>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="border p-4 rounded">
            <input
              className="border p-2 w-full mb-2"
              value={q.questionText}
              onChange={(e) =>
                updateQuestionField(index, "questionText", e.target.value)
              }
            />

            <button onClick={() => deleteQuestion(index)} className="text-red-500">
              Delete
            </button>

            <button onClick={() => duplicateQuestion(index)} className="ml-2 text-blue-500">
              Duplicate
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={updateQuiz}
        className="mt-6 bg-blue-600 text-white px-6 py-2"
      >
        Save Quiz
      </button>
    </div>
  );
}