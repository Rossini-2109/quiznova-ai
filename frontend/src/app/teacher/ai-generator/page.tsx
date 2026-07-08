"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { Sparkles, Upload, Save, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

type GeneratedQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export default function AIGeneratorPage() {
  const router = useRouter();

  // Generation parameters
  const [file, setFile] = useState<File | null>(null);
  const [requirements, setRequirements] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [loading, setLoading] = useState(false);

  // Generated questions & state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(15);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setTeacherId(parsed.id);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const extractError = (error: unknown): string => {
    const e = error as { response?: { data?: { message?: string; Error?: string } } };
    return (
      e?.response?.data?.message ||
      e?.response?.data?.Error ||
      "Generation failed. Please try again."
    );
  };

  const applyQuestions = (data: unknown, title: string, description: string) => {
    if (Array.isArray(data) && data.length > 0) {
      setQuestions(data as GeneratedQuestion[]);
      setQuizTitle(title);
      setQuizDescription(description);
    } else {
      alert("No questions could be generated. Try refining your requirements or source.");
    }
  };

  const handleGenerate = async () => {
    if (!file && !requirements.trim()) {
      alert("Add teacher requirements or upload a file (document, image, audio, or video).");
      return;
    }

    const generatePromise = (async () => {
      setLoading(true);
      setQuestions([]);

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("requirements", requirements);
        formData.append("questionCount", String(questionCount));
        formData.append("difficulty", difficulty);

        const response = await api.post("/ai/generate", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        applyQuestions(
          response.data,
          `${file.name.split(".")[0]} Quiz`,
          `Generated from ${file.name}`
        );
      } else {
        const response = await api.post("/ai/generate-from-requirements", {
          requirements,
          questionCount,
          difficulty,
        });
        applyQuestions(
          response.data,
          "AI Generated Quiz",
          requirements.slice(0, 120)
        );
      }
    })();

    await toast.promise(generatePromise, {
      loading: "Generating quiz…",
      success: "Quiz generated successfully!",
      error: (err) => extractError(err) || "Generation failed",
    });
    setLoading(false);
  };

  const handleUpdateQuestionText = (index: number, val: string) => {
    const updated = [...questions];
    updated[index].question = val;
    setQuestions(updated);
  };

  const handleUpdateOption = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = val;
    setQuestions(updated);
  };

  const handleUpdateCorrectAnswer = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].correctAnswer = val;
    setQuestions(updated);
  };

  const handleUpdateExplanation = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].explanation = val;
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle.trim()) {
      alert("Please provide a quiz title");
      return;
    }
    if (questions.length === 0) {
      alert("No questions to save");
      return;
    }

    const savePromise = (async () => {
      setSaving(true);

      const payload = {
        title: quizTitle,
        description: quizDescription,
        timeLimit,
        teacherId: teacherId || "00000000-0000-0000-0000-000000000000",
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      };

      await api.post("/ai/save-quiz", payload);
    })();

    await toast.promise(savePromise, {
      loading: "Saving quiz…",
      success: "Quiz saved successfully!",
      error: (err) => extractError(err) || "Save failed",
    });
    setSaving(false);
    router.push("/teacher/quizzes");
  };

  return (
    <div className="relative min-h-screen">
      {/* Overlay for loading/saving */}
      {(loading || saving) && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-3">
            <RefreshCw className="animate-spin text-white" size={32} />
            <p className="text-white text-sm">
              {loading ? "Generating quiz..." : "Saving quiz..."}
            </p>
          </div>
        </div>
      )}
      <div className="space-y-8">
        {/* Top Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="text-indigo-500 fill-indigo-500/25" size={28} />
            AI Quiz Generator
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5">
            Describe what you need, or generate from a document, image, audio, or video
          </p>
        </div>

      {questions.length === 0 ? (
        /* Setup / Upload Card */
        <div className="max-w-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl shadow-indigo-500/5">
          <h2 className="text-xl font-bold mb-6">Quiz parameters</h2>

          <div className="space-y-6">
            {/* Teacher requirements */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2.5">
                Teacher Requirements
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g. Generate questions on photosynthesis for grade 9, focus on the light-dependent reactions, include one application question."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-indigo-500 text-sm resize-none"
              />
            </div>

            {/* Count + difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2.5">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2.5">
                Source File (optional) — document, image, audio, or video
              </label>
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all text-center relative flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept=".json,.txt,.pdf,.docx,.pptx,image/*,audio/*,video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-zinc-850 flex items-center justify-center text-indigo-500 mb-3">
                  <Upload size={22} />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{file.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Choose file or drag here</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Documents, images, audio, or video</p>
                  </div>
                )}
              </div>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="mt-2 text-xs text-zinc-500 hover:text-red-500 font-semibold"
                >
                  Remove file
                </button>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-3">
              <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                Images use vision and require the OpenAI provider. Audio/video need a transcription service (e.g. Whisper) which isn&apos;t configured yet — use a document, image, or text requirements instead.
              </span>
            </div>


            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Quiz
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Review & Customization view */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Questions review panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Imported {questions.length} Quiz Questions
              </span>
              <button
                onClick={() => setQuestions([])}
                className="text-xs text-zinc-500 hover:text-red-500 font-semibold flex items-center gap-1"
              >
                Clear & Re-import
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm space-y-4 hover:border-indigo-500/20 transition-all"
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="h-6 w-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold flex items-center justify-center">
                    {qIdx + 1}
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full font-semibold bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:outline-none pb-1"
                      value={q.question}
                      onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(qIdx)}
                    className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* MCQ Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-400">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <input
                        type="text"
                        className="flex-1 text-sm bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:outline-none py-0.5"
                        value={opt}
                        onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {/* Correct answer and explanation */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 pl-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Correct Option</label>
                    <select
                      value={q.correctAnswer}
                      onChange={(e) => handleUpdateCorrectAnswer(qIdx, e.target.value)}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Explanation</label>
                    <input
                      type="text"
                      placeholder="Why is this correct?"
                      className="w-full text-xs bg-transparent border-b border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 focus:border-indigo-500 focus:outline-none py-1"
                      value={q.explanation}
                      onChange={(e) => handleUpdateExplanation(qIdx, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right settings sidecard */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm space-y-5 sticky top-6">
              <h3 className="text-lg font-bold border-b border-zinc-100 dark:border-zinc-800 pb-3">Quiz Settings</h3>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Quiz Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-indigo-500 text-sm"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Description</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-indigo-500 text-sm h-24 resize-none"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Time Limit (Minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-indigo-500 text-sm"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveQuiz}
                  disabled={saving}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <Save size={16} />
                  {saving ? "Saving Quiz..." : "Save & Publish Quiz"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}