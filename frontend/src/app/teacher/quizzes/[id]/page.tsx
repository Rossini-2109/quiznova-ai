"use client";

import { useState, use } from "react";
import api from "@/services/api";

export default function QuizDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");

  const saveQuestion = async () => {
    try {
      await api.post("/quiz/add-question", {
        quizId: id,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation,
        questionType: "MCQ",
      });

      alert("Question Added Successfully");

      setQuestionText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectAnswer("");
      setExplanation("");
    } catch (error: any) {
      console.error(error);

      if (error.response) {
        alert(
          `Error: ${
            error.response.data.message ||
            error.response.data ||
            "Failed to add question"
          }`
        );
      } else {
        alert("Failed to add question");
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">
        Add Question
      </h1>

      <p className="text-gray-500 mb-6">
        Quiz ID: {id}
      </p>

      <div className="space-y-3">
        <input
          className="border p-2 w-full"
          placeholder="Question"
          value={questionText}
          onChange={(e) =>
            setQuestionText(e.target.value)
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Option A"
          value={optionA}
          onChange={(e) =>
            setOptionA(e.target.value)
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Option B"
          value={optionB}
          onChange={(e) =>
            setOptionB(e.target.value)
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Option C"
          value={optionC}
          onChange={(e) =>
            setOptionC(e.target.value)
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Option D"
          value={optionD}
          onChange={(e) =>
            setOptionD(e.target.value)
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Correct Answer"
          value={correctAnswer}
          onChange={(e) =>
            setCorrectAnswer(e.target.value)
          }
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Explanation"
          value={explanation}
          onChange={(e) =>
            setExplanation(e.target.value)
          }
        />

        <button
          onClick={saveQuestion}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Save Question
        </button>
      </div>
    </div>
  );
}