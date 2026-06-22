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

      // After loading quiz, if no questions, create a default one
      if (formatted.length === 0) {
        // Add a blank question automatically
        addNewQuestion();
      }
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
    // Create a blank question with all fields initialized
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
      questionImageUrl: "",
      optionAImageUrl: "",
      optionBImageUrl: "",
      optionCImageUrl: "",
      optionDImageUrl: "",
      optionEImageUrl: "",
    } as any;

    // Optimistically add to UI
    setQuestions(prev => [...prev, { ...newQuestion }]);

    // Build payload matching backend schema
    const payload = {
      questionText: newQuestion.questionText,
      options: [newQuestion.optionA, newQuestion.optionB, newQuestion.optionC, newQuestion.optionD, newQuestion.optionE].filter(Boolean),
      correctAnswer: newQuestion.correctAnswer,
      timeLimit: newQuestion.questionTimeLimit,
      imageUrl: newQuestion.questionImageUrl,
      optionImages: {
        A: newQuestion.optionAImageUrl,
        B: newQuestion.optionBImageUrl,
        C: newQuestion.optionCImageUrl,
        D: newQuestion.optionDImageUrl,
        E: newQuestion.optionEImageUrl,
      },
    };

    try {
      await api.post(`/quiz/${id}/questions`, payload);
    } catch (err: any) {
      console.error(err);
      // Revert UI on failure
      setQuestions(prev => prev.filter(q => q.id !== newQuestion.id));
      alert(err?.response?.data?.message || "Failed to add question");
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

  // Add a new option field to a question (up to 5)
  const addOptionToQuestion = (qIndex: number) => {
    const q = questions[qIndex];
    const currentCount = q.optionCount || 4;
    if (currentCount >= 5) return; // max 5 options
    const newCount = currentCount + 1;
    const field = (`option${String.fromCharCode(64 + newCount)}`) as keyof Question;
    const imgField = (`option${String.fromCharCode(64 + newCount)}ImageUrl`) as keyof Question;
    updateQuestionField(qIndex, "optionCount", newCount);
    updateQuestionField(qIndex, field, "");
    updateQuestionField(qIndex, imgField, "");
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
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

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="bg-white bg-opacity-70 backdrop-blur-lg rounded-xl shadow-lg p-6 space-y-4"
            >
              {/* Question Text */}
              <textarea
                className="w-full border rounded p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                placeholder="Enter question..."
                value={q.questionText}
                onChange={(e) =>
                  updateQuestionField(index, "questionText", e.target.value)
                }
              />
                            {/* Question Image Inline Upload */}
                    <div className="flex items-center space-x-2 mb-2">
                      {q.questionImageUrl && (
                        <img
                          src={q.questionImageUrl}
                          alt="Question"
                          className="w-16 h-16 object-contain rounded"
                        />
                      )}
                      <button
                        type="button"
                        title="Upload image"
                        className="text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
                        onClick={() => {
                          const el = document.getElementById(`file-question-${index}`) as HTMLInputElement;
                          if (el) el.click();
                        }}
                      >
                        📷
                      </button>
                      {q.questionImageUrl && (
                        <button
                          type="button"
                          onClick={() => updateQuestionField(index, "questionImageUrl", "")}
                          className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      )}
                      <input
                        id={`file-question-${index}`}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleUploadImage(index, "questionImageUrl", e.target.files[0]);
                          }
                        }}
                      />
                    </div>

              {/* Options */}
              {['A', 'B', 'C', 'D', 'E']
                .slice(0, q.optionCount || 4)
                .map((letter) => {
                  const field = (`option${letter}`) as keyof Question;
                  const imgField = (`option${letter}ImageUrl`) as keyof Question;
                  return (
                    <div key={letter} className="flex flex-col mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          className="w-8 text-center border rounded p-1"
                          maxLength={1}
                          value={letter}
                          readOnly
                        />
                        <input
                          className="flex-1 border p-2 rounded"
                          placeholder={`Option ${letter}`}
                          value={q[field] ?? ''}
                          onChange={(e) =>
                            updateQuestionField(index, field, e.target.value)
                          }
                        />
                      </div>
                      {/* Option Image */}
                      <div className="flex items-center space-x-2 mb-2">
                        {q[imgField] && (
                          <>
                            <img
                              src={q[imgField] as string}
                              alt={`Option ${letter}`}
                              className="w-12 h-12 object-contain rounded"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuestionField(index, imgField, "")}
                              className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </>
                        )}
                        {/* Option Image Upload Icon */}
                        <button
                          type="button"
                          title="Upload image"
                          className="text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
                          onClick={() => {
                            const el = document.getElementById(`file-${index}-${letter}`);
                            if (el) (el as HTMLInputElement).click();
                          }}
                        >
                          📷
                        </button>
                        <input
                          id={`file-${index}-${letter}`}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadImage(index, imgField, e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

              {/* Correct Answer */}
              <select
                className="border p-2 rounded w-full"
                value={q.correctAnswer}
                onChange={(e) =>
                  updateQuestionField(index, "correctAnswer", e.target.value)
                }
              >
                {['A', 'B', 'C', 'D', 'E']
                  .slice(0, q.optionCount || 4)
                  .map((letter) => (
                    <option key={letter} value={letter}>
                      {letter}
                    </option>
                  ))}
              </select>

              {/* Time Limit */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Time Limit:</label>
                <input
                  type="number"
                  className="border p-2 w-24 rounded"
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
                <span className="text-sm">seconds</span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-2">
                <button
                  onClick={() => deleteQuestion(index)}
                  className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() => duplicateQuestion(index)}
                  className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                  title="Duplicate question"
                >
                  📋
                </button>
                <button
                  onClick={() => addOptionToQuestion(index)}
                  className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                >
                  + Option
                </button>
                <button
                  onClick={() => removeOptionFromQuestion(index)}
                  className="text-white bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded ml-2"
                >
                  - Option
                </button>
              </div>
            </div>
          ))}
        </div>

          {/* Add New Question Button */}
          <button
            type="button"
            onClick={addNewQuestion}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
          >
            + Add New Question
          </button>

      <button
        onClick={updateQuiz}
        className="mt-6 bg-blue-600 text-white px-6 py-2"
      >
        Save Quiz
      </button>
    </div>
  );
}