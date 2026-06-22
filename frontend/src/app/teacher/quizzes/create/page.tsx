"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function CreateQuizPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [optionE, setOptionE] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [timeLimit, setTimeLimit] = useState(10);
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Array<{id: string; questionText: string}>>([]);
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
      alert("Quiz created successfully! You can now add questions.");
      setQuizId(res.data.id);
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
      const newQuestion = { id: res.data.id, questionText };
      setQuestions(prev => [...prev, newQuestion]);
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
      const res = await api.post(`/quiz/${quizId}/questions/${questionId}/duplicate`);
      const newDup = { id: res.data.id, questionText: res.data.questionText };
      setQuestions(prev => {
        const newArr = [...prev];
        newArr.splice(idx + 1, 0, newDup);
        return newArr;
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
        <p className="text-gray-500 mb-8">Enter a quiz title and start adding questions.</p>
        {/* Quiz title form */}
        {!quizId && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Quiz Title</label>
              <input
                type="text"
                placeholder="e.g. DBMS Quiz"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/teacher/quizzes")}
                className="flex-1 px-6 py-3 rounded-xl border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white"
              >
                {submitting ? "Creating..." : "Create Quiz"}
              </button>
            </div>
          </form>
        )}
        {/* Question addition UI */}
        {quizId && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Add Questions</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4 border p-6 rounded-xl">
              <div>
                <label className="block text-sm font-semibold mb-2">Question Text</label>
                <textarea
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-xl"
                />
              </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Option A */}
                  <div className="flex flex-col space-y-2">
                    <label className="block text-sm font-semibold mb-2">Option A</label>
                    <input
                      type="text"
                      value={optionA}
                      onChange={e => setOptionA(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                    {/* Image preview */}
                    {optionAImageUrl && (
                      <div className="flex items-center space-x-2">
                        <img src={optionAImageUrl} alt="Option A" className="w-12 h-12 object-contain rounded" />
                        <button
                          type="button"
                          onClick={() => setOptionAImageUrl("")}
                          className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                          title="Remove image"
                        >✕</button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="file-optionA"
                      onChange={async e => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0];
                          const base64 = await new Promise<string>((res, rej) => {
                            const reader = new FileReader();
                            reader.onload = () => res(reader.result as string);
                            reader.onerror = () => rej(reader.error);
                            reader.readAsDataURL(file);
                          });
                          setOptionAImageUrl(base64);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
                      onClick={() => document.getElementById('file-optionA')?.click()}
                      title="Upload image"
                    >📷</button>
                  </div>

                  {/* Option B */}
                  <div className="flex flex-col space-y-2">
                    <label className="block text-sm font-semibold mb-2">Option B</label>
                    <input
                      type="text"
                      value={optionB}
                      onChange={e => setOptionB(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                    {optionBImageUrl && (
                      <div className="flex items-center space-x-2">
                        <img src={optionBImageUrl} alt="Option B" className="w-12 h-12 object-contain rounded" />
                        <button
                          type="button"
                          onClick={() => setOptionBImageUrl("")}
                          className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                          title="Remove image"
                        >✕</button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="file-optionB"
                      onChange={async e => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0];
                          const base64 = await new Promise<string>((res, rej) => {
                            const reader = new FileReader();
                            reader.onload = () => res(reader.result as string);
                            reader.onerror = () => rej(reader.error);
                            reader.readAsDataURL(file);
                          });
                          setOptionBImageUrl(base64);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
                      onClick={() => document.getElementById('file-optionB')?.click()}
                      title="Upload image"
                    >📷</button>
                  </div>

                  {/* Option C */}
                  <div className="flex flex-col space-y-2">
                    <label className="block text-sm font-semibold mb-2">Option C (optional)</label>
                    <input
                      type="text"
                      value={optionC}
                      onChange={e => setOptionC(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                    {optionCImageUrl && (
                      <div className="flex items-center space-x-2">
                        <img src={optionCImageUrl} alt="Option C" className="w-12 h-12 object-contain rounded" />
                        <button
                          type="button"
                          onClick={() => setOptionCImageUrl("")}
                          className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                          title="Remove image"
                        >✕</button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="file-optionC"
                      onChange={async e => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0];
                          const base64 = await new Promise<string>((res, rej) => {
                            const reader = new FileReader();
                            reader.onload = () => res(reader.result as string);
                            reader.onerror = () => rej(reader.error);
                            reader.readAsDataURL(file);
                          });
                          setOptionCImageUrl(base64);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
                      onClick={() => document.getElementById('file-optionC')?.click()}
                      title="Upload image"
                    >📷</button>
                  </div>

                  {/* Option D */}
                  <div className="flex flex-col space-y-2">
                    <label className="block text-sm font-semibold mb-2">Option D (optional)</label>
                    <input
                      type="text"
                      value={optionD}
                      onChange={e => setOptionD(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                    {optionDImageUrl && (
                      <div className="flex items-center space-x-2">
                        <img src={optionDImageUrl} alt="Option D" className="w-12 h-12 object-contain rounded" />
                        <button
                          type="button"
                          onClick={() => setOptionDImageUrl("")}
                          className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                          title="Remove image"
                        >✕</button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="file-optionD"
                      onChange={async e => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0];
                          const base64 = await new Promise<string>((res, rej) => {
                            const reader = new FileReader();
                            reader.onload = () => res(reader.result as string);
                            reader.onerror = () => rej(reader.error);
                            reader.readAsDataURL(file);
                          });
                          setOptionDImageUrl(base64);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
                      onClick={() => document.getElementById('file-optionD')?.click()}
                      title="Upload image"
                    >📷</button>
                  </div>

                  {/* Option E */}
                  <div className="flex flex-col space-y-2">
                    <label className="block text-sm font-semibold mb-2">Option E (optional)</label>
                    <input
                      type="text"
                      value={optionE}
                      onChange={e => setOptionE(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                    {optionEImageUrl && (
                      <div className="flex items-center space-x-2">
                        <img src={optionEImageUrl} alt="Option E" className="w-12 h-12 object-contain rounded" />
                        <button
                          type="button"
                          onClick={() => setOptionEImageUrl("")}
                          className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                          title="Remove image"
                        >✕</button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="file-optionE"
                      onChange={async e => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0];
                          const base64 = await new Promise<string>((res, rej) => {
                            const reader = new FileReader();
                            reader.onload = () => res(reader.result as string);
                            reader.onerror = () => rej(reader.error);
                            reader.readAsDataURL(file);
                          });
                          setOptionEImageUrl(base64);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
                      onClick={() => document.getElementById('file-optionE')?.click()}
                      title="Upload image"
                    >📷</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Correct Answer</label>
                  <select value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)} className="w-full px-3 py-2 border rounded">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
</div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Time Limit (seconds)</label>
                  <input type="number" min={5} value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
</div>
              
              {/* Image uploads */}
              {/* Question Image */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Question Image</label>
                  <input type="file" accept="image/*" onChange={async e => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      const base64 = await new Promise<string>((res, rej) => {
                        const reader = new FileReader();
                        reader.onload = () => res(reader.result as string);
                        reader.onerror = () => rej(reader.error);
                        reader.readAsDataURL(file);
                      });
                      setQuestionImageUrl(base64);
                    }
                  }} className="w-full" />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="submit" disabled={questionSubmitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded">
                  Save & Add New Question
                </button>
                <button type="button" onClick={handleSaveQuiz} className="flex-1 px-4 py-2 border rounded">
                  Save Quiz
                </button>
              </div>
            </form>
            {questions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">Added Questions</h3>
                <ul className="space-y-2">
                  {questions.map((q, idx) => (
                    <li key={q.id} className="border p-2 rounded flex justify-between items-center">
                      <span>{idx + 1}. {q.questionText || "(no text)"}</span>
                      <button type="button" onClick={() => handleDuplicate(q.id, idx)} className="text-sm text-indigo-600 underline">
                        Duplicate
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}