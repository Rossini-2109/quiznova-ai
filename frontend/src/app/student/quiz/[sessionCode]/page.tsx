// app/student/quiz/[sessionCode]/page.tsx
// Student Quiz Page - Real‑time live quiz experience
// -------------------------------------------------
"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import Image from "next/image";
import api from "@/services/api";

// Types for quiz data
interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionType: string;
  questionTimeLimit: number; // seconds
  questionImageUrl?: string;
  optionAImageUrl?: string;
  optionBImageUrl?: string;
  optionCImageUrl?: string;
  optionDImageUrl?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
  timeLimit?: number;
  defaultQuestionTimeSeconds?: number;
  questions: Question[];
}

export default function StudentQuizPage({ params }: { params: Promise<{ sessionCode: string }> }) {
  const router = useRouter();
  const { sessionCode } = use(params);
const [hub, setHub] = useState<signalR.HubConnection | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const questionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------
  // Fetch quiz data once we have a valid session code.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!sessionCode) return;
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/quiz/code/${sessionCode}`);
        const data = res.data;
        const defaultTime = data.defaultQuestionTimeSeconds || data.timeLimit || 10;
        const loadedQuiz: Quiz = {
          id: data.id,
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          timeLimit: data.timeLimit,
          defaultQuestionTimeSeconds: defaultTime,
          questions: data.questions.map((q: Question) => ({
            ...q,
            questionTimeLimit: q.questionTimeLimit || defaultTime
          })),
        } as Quiz;
        setQuiz(loadedQuiz);
      } catch (e) {
        console.error(e);
        // Redirect back to lobby on error
        router.push(`/student/lobby/${sessionCode}`);
      }
    };
    fetchQuiz();
  }, [sessionCode, router]);

  // ---------------------------------------------------------------------
  // SignalR connection – receives live commands from the teacher.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!sessionCode) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000"}/quizHub`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection
      .start()
      .then(() => console.log("SignalR connected (student quiz)"))
      .catch((err) => console.error("SignalR connection error:", err));

    // Teacher can force a question change or end the quiz
    connection.on("NextQuestion", () => {
      moveToNextQuestion();
    });
    connection.on("QuizEnded", () => {
      router.push(`/student/results/${sessionCode}`);
    });
    setHub(connection);
    return () => {
      connection.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionCode, router]);

  // ---------------------------------------------------------------------
  // Helper to advance question
  // ---------------------------------------------------------------------
  const moveToNextQuestion = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= (quiz?.questions?.length || 0)) {
        // Automatically go to results if no more questions
        router.push(`/student/results/${sessionCode}`);
        return prev;
      }
      setSelectedOption(""); // clear selection for next question
      return nextIndex;
    });
  };

  // ---------------------------------------------------------------------
  // Per‑question countdown timer.
  // ---------------------------------------------------------------------
  useEffect(() => {
    // Clear any previous timer
    if (timerRef.current) clearInterval(timerRef.current);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return;
    
    const q = quiz.questions[currentIndex];
    const limit = q.questionTimeLimit || quiz.defaultQuestionTimeSeconds || 10;
    
    setTimeLeft(limit);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up – auto‑submit empty answer and move on
          submitAnswer("");
          moveToNextQuestion();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, quiz]);

  // ---------------------------------------------------------------------
  // Answer submission – tells the backend the chosen option.
  // ---------------------------------------------------------------------
  const submitAnswer = async (option: string) => {
    if (!hub || !quiz) return;
    const currentQuestion = quiz.questions[currentIndex];
    try {
      await hub.invoke("SubmitAnswer", sessionCode, currentQuestion.id, option, Date.now() - (questionStartRef.current ?? Date.now()));
    } catch (e) {
      console.error("Answer submit error", e);
    }
  };

  const handleOptionClick = (opt: string) => {
    if (selectedOption) return; // Prevent multiple clicks
    setSelectedOption(opt);
    submitAnswer(opt);
    // Optimistically move to next question after short delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 1000);
  };

  // ---------------------------------------------------------------------
  // Render UI – dark mode & glassmorphism.
  // ---------------------------------------------------------------------
  if (!quiz) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading your live quiz…</p>
        </div>
      </div>
    );
  }

  if (!quiz.questions || quiz.questions.length === 0) {
     return <div className="p-10 text-center text-white">No questions available.</div>;
  }

  const question = quiz.questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-900 p-4 text-white flex flex-col justify-center items-center">
      <div className="w-full max-w-4xl relative">
        
        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentIndex) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 mb-6 relative overflow-hidden">
          {/* Header row: Q Number & Timer */}
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <div className="text-sm font-semibold tracking-wider text-indigo-300 uppercase">
              Question {currentIndex + 1} of {quiz.questions.length}
            </div>
            <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-1.5 rounded-full ${timeLeft <= 5 ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}>
              ⏳ {timeLeft}s
            </div>
          </div>

          {/* Question Text & Media */}
          <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed">
            {question.questionText}
          </h2>

          {question.questionImageUrl && (
            <div className="my-6 flex justify-center">
              <Image
                src={question.questionImageUrl}
                alt="question image"
                width={500}
                height={350}
                className="rounded-2xl border border-white/10 shadow-lg object-contain bg-black/40"
              />
            </div>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "A", label: question.optionA, img: question.optionAImageUrl },
              { key: "B", label: question.optionB, img: question.optionBImageUrl },
              { key: "C", label: question.optionC, img: question.optionCImageUrl },
              { key: "D", label: question.optionD, img: question.optionDImageUrl },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleOptionClick(opt.key)}
                disabled={!!selectedOption}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 focus:outline-none overflow-hidden text-left
                  ${selectedOption === opt.key 
                    ? "bg-indigo-600/80 border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[0.98]" 
                    : selectedOption 
                      ? "bg-white/5 border-white/5 opacity-50 cursor-not-allowed" 
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 hover:-translate-y-1"
                  }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg
                    ${selectedOption === opt.key ? "bg-white text-indigo-600" : "bg-white/10 text-white/70 group-hover:bg-white/20"}
                  `}>
                    {opt.key}
                  </div>
                  <span className="font-semibold text-lg flex-1">{opt.label}</span>
                </div>
                {opt.img && (
                  <div className="mt-4 relative z-10 flex justify-center">
                    <Image src={opt.img} alt={`option ${opt.key}`} width={200} height={120} className="rounded-xl border border-white/10" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-zinc-500 text-sm font-medium">Please wait for the teacher to advance or timer to run out.</p>
        </div>
      </div>
    </div>
  );
}