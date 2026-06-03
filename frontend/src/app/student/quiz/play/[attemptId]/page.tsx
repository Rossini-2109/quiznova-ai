"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuizStore } from "@/store/quizStore";

type Question = {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type QuizData = {
  id: string;
  title: string;
  timeLimit: number;
  questions: Question[];
};

export default function QuizPlayerPage() {
  const params = useParams();
  const router = useRouter();

  const attemptId = params.attemptId as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [timeLeft, setTimeLeft] = useState(0);

  const [submitting, setSubmitting] =
    useState(false);

  const { answers, saveAnswer } =
    useQuizStore();

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5103/api/Attempts/${attemptId}`
        );

        console.log(response.data);

        setQuiz(response.data);

        setTimeLeft(
          response.data.timeLimit * 60
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [attemptId]);

  const submitQuiz = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const payload = {
        attemptId,
        answers,
      };

      console.log(
        "Submitting Quiz",
        payload
      );

      const response = await axios.post(
        "http://localhost:5103/api/Attempts/submit",
        payload
      );

      alert(
        `Quiz Submitted!\nScore: ${response.data.score}`
      );

      router.push(
        `/student/results/${attemptId}`
      );
    } catch (error) {
      console.error(error);

      alert("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!quiz) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          submitQuiz();

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz]);

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading Quiz...
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-10 text-center">
        Quiz not found
      </div>
    );
  }

  if (
    !quiz.questions ||
    quiz.questions.length === 0
  ) {
    return (
      <div className="p-10 text-center">
        No questions found
      </div>
    );
  }

  const question =
    quiz.questions[currentQuestionIndex];

  const selectedAnswer =
    answers[question.id];

  return (
    <div className="max-w-4xl mx-auto p-6">

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-3xl font-bold">
          {quiz.title}
        </h1>

        <div className="text-xl font-bold text-red-600">
          {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60)
            .toString()
            .padStart(2, "0")}
        </div>

      </div>

      <div className="mb-4 text-gray-600">
        Question {currentQuestionIndex + 1} of{" "}
        {quiz.questions.length}
      </div>

      <div className="border rounded-lg p-6 shadow bg-white">

        <h2 className="text-xl font-semibold mb-6">
          {question.questionText}
        </h2>

        <div className="space-y-3">

          <label className="block border p-3 rounded cursor-pointer">
            <input
              type="radio"
              name={question.id}
              checked={selectedAnswer === "A"}
              onChange={() =>
                saveAnswer(
                  question.id,
                  "A"
                )
              }
            />

            <span className="ml-2">
              {question.optionA}
            </span>
          </label>

          <label className="block border p-3 rounded cursor-pointer">
            <input
              type="radio"
              name={question.id}
              checked={selectedAnswer === "B"}
              onChange={() =>
                saveAnswer(
                  question.id,
                  "B"
                )
              }
            />

            <span className="ml-2">
              {question.optionB}
            </span>
          </label>

          <label className="block border p-3 rounded cursor-pointer">
            <input
              type="radio"
              name={question.id}
              checked={selectedAnswer === "C"}
              onChange={() =>
                saveAnswer(
                  question.id,
                  "C"
                )
              }
            />

            <span className="ml-2">
              {question.optionC}
            </span>
          </label>

          <label className="block border p-3 rounded cursor-pointer">
            <input
              type="radio"
              name={question.id}
              checked={selectedAnswer === "D"}
              onChange={() =>
                saveAnswer(
                  question.id,
                  "D"
                )
              }
            />

            <span className="ml-2">
              {question.optionD}
            </span>
          </label>

        </div>

      </div>

      <div className="flex justify-between mt-6">

        <button
          disabled={
            currentQuestionIndex === 0
          }
          onClick={() =>
            setCurrentQuestionIndex(
              currentQuestionIndex - 1
            )
          }
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>

        {currentQuestionIndex <
        quiz.questions.length - 1 ? (

          <button
            onClick={() =>
              setCurrentQuestionIndex(
                currentQuestionIndex + 1
              )
            }
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next
          </button>

        ) : (

          <button
            onClick={submitQuiz}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {submitting
              ? "Submitting..."
              : "Submit Quiz"}
          </button>

        )}

      </div>

    </div>
  );
}