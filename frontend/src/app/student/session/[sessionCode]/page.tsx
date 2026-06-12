// app/student/quiz/[sessionCode]/page.tsx
// Student Quiz Page - Real‑time live quiz experience
// -------------------------------------------------
// This page fetches the published quiz using the session code (quiz code),
// connects to the SignalR hub for live updates (question navigation, timer,
// and quiz termination), and renders an interactive UI with dark‑mode, glassmorphism
// styling. It is built with Next.js (app router) and React.

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import Image from "next/image";

// Types for quiz data
interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionType: string; // e.g., "single"
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
  questions: Question[];
}

import { use } from "react";

export default function StudentQuizPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const router = useRouter();

  const { attemptId } = use(params);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hub, setHub] = useState<signalR.HubConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------
  // Fetch quiz data once we have a valid session code.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!attemptId) return;
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/code/${attemptId}`);
        if (!res.ok) throw new Error("Failed to load quiz");
        const data = await res.json();
        // The backend returns { quiz: {...}, questions: [...] } – flatten for convenience
        const loadedQuiz: Quiz = {
          id: data.id,
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          timeLimit: data.timeLimit,
          questions: data.questions,
        } as Quiz;
        setQuiz(loadedQuiz);
        // Initialise timer for the first question if it has a limit
        if (loadedQuiz.questions?.[0]?.questionTimeLimit) {
          setTimeLeft(loadedQuiz.questions[0].questionTimeLimit);
        }
      } catch (e) {
        console.error(e);
        // Redirect back to lobby on error
        router.push(`/student/lobby/${attemptId}`);
      }
    };
    fetchQuiz();
  }, [attemptId, router]);

  // ---------------------------------------------------------------------
  // SignalR connection – receives live commands from the teacher.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!attemptId) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL.replace("/api", "")}/quizhub`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection
      .start()
      .then(() => console.log("SignalR connected (student quiz)"))
      .catch((err) => console.error("SignalR connection error:", err));

    // Teacher can force a question change or end the quiz
    connection.on("NextQuestion", () => {
      setCurrentIndex((prev) => Math.min(prev + 1, (quiz?.questions?.length ?? 1) - 1));
    });
    connection.on("QuizEnded", () => {
      router.push(`/student/results/${attemptId}`);
    });
    setHub(connection);
    return () => {
      connection.stop();
    };
  }, [attemptId, quiz?.questions?.length, router]);

  // ---------------------------------------------------------------------
  // Per‑question countdown timer.
  // ---------------------------------------------------------------------
  useEffect(() => {
    // Clear any previous timer
    if (timerRef.current) clearInterval(timerRef.current);
    const q = quiz?.questions?.[currentIndex];
    if (!q?.questionTimeLimit) return; // No timer for this question
    setTimeLeft(q.questionTimeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up – auto‑submit empty answer and move on
          submitAnswer("");
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
      await hub.invoke("SubmitAnswer", {
        quizId: quiz.id,
        questionId: currentQuestion.id,
        selectedOption: option,
      });
    } catch (e) {
      console.error("Answer submit error", e);
    }
  };

  const handleOptionClick = (opt: string) => {
    setSelectedOption(opt);
    submitAnswer(opt);
    // Optimistically move to next question (teacher can also push via SignalR)
    if (currentIndex < (quiz?.questions?.length ?? 1) - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  // ---------------------------------------------------------------------
  // Render UI – dark mode & glassmorphism.
  // ---------------------------------------------------------------------
  if (!quiz) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Loading quiz…
      </div>
    );
  }

  const question = quiz.questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 p-4 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="bg-black/40 backdrop-blur-lg rounded-xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
          {question.questionImageUrl && (
            <div className="my-4 flex justify-center">
              <Image
                src={question.questionImageUrl}
                alt="question image"
                width={400}
                height={300}
                className="rounded-md"
              />
            </div>
          )}
          <p className="text-xl mb-4">{question.questionText}</p>
          <div className="grid grid-cols-2 gap-4">
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
                className={`p-4 rounded-lg border transition-colors focus:outline-none 
                  ${selectedOption === opt.key ? "bg-indigo-600 text-white" : "bg-white/10 hover:bg-white/20"}`}
              >
                <div className="flex items-center">
                  <span className="font-bold mr-2">{opt.key}.</span>
                  <span>{opt.label}</span>
                </div>
                {opt.img && (
                  <div className="mt-2">
                    <Image src={opt.img} alt={`option ${opt.key}`} width={150} height={100} className="rounded" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {question.questionTimeLimit && (
            <div className="mt-4 text-center text-lg">
              Time left: <span className="font-mono">{timeLeft}s</span>
            </div>
          )}
        </div>
        <div className="text-center text-sm opacity-70">
          Question {currentIndex + 1} of {quiz.questions.length}
        </div>
      </div>
    </div>
  );
}
