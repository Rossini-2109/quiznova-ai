"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { Sparkles, FileText, Upload, Save, Trash2, Edit2, AlertCircle, RefreshCw, Eye } from "lucide-react";

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

  const handleGenerate = async () => {
    if (!file) {
      alert("Please select a file to parse (JSON, TXT, PDF, DOCX, PPTX)");
      return;
    }

    try {
      setLoading(true);
      setQuestions([]);

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/ai/generate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // The response.data should now be list of GeneratedQuestion from parsed JSON
      if (Array.isArray(response.data)) {
        setQuestions(response.data);
        setQuizTitle(`${file.name.split(".")[0]} Quiz`);
        setQuizDescription(`Parsed assessment based on ${file.name}`);
      } else {
        alert("Received invalid data structure from file parser.");
      }
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        error.response?.data?.Error ||
        "File parsing failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
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

    try {
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

      const res = await api.post("/ai/save-quiz", payload);
      alert("Quiz saved successfully!");
      router.push("/teacher/quizzes");
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to save generated quiz"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent flex items-center gap-2">
          <FileText className="text-indigo-500 fill-indigo-500/25" size={28} />
          Quiz File Importer
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5">
          Import quizzes instantly from JSON and TXT files
        </p>
      </div>

      {questions.length === 0 ? (
        /* Setup / Upload Card */
        <div className="max-w-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl shadow-indigo-500/5">
          <h2 className="text-xl font-bold mb-6">Quiz parameters</h2>

          <div className="space-y-6">
            {/* File Upload Zone */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2.5">
                Upload Quiz File (.json, .txt, .pdf, .docx, .pptx)
              </label>
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all text-center relative flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept=".json,.txt,.pdf,.docx,.pptx"
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
                    <p className="text-xs text-zinc-400 mt-0.5">JSON, TXT, PDF, Word, or PPT files</p>
                  </div>
                )}
              </div>
            </div>



            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Parsing Questions...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Parse Quiz File
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