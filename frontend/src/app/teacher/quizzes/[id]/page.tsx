"use client";

import { useState, use } from "react";
import api from "@/services/api";
import { supabase } from "@/lib/supabase";
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
  const [optionCount, setOptionCount] = useState(4);
  const [explanation, setExplanation] = useState("");
  const [questionTimeLimit, setQuestionTimeLimit] = useState(30);
  const [questionImage, setQuestionImage] = useState<File | null>(null);

const [optionAImage, setOptionAImage] = useState<File | null>(null);
const [optionBImage, setOptionBImage] = useState<File | null>(null);
const [optionCImage, setOptionCImage] = useState<File | null>(null);
const [optionDImage, setOptionDImage] = useState<File | null>(null);

  const saveQuestion = async () => {
  if (!questionText.trim()) {
    alert("Please enter a question");
    return;
  }

  if (!optionA.trim() || !optionB.trim()) {
    alert("Option A and Option B are required");
    return;
  }

  if (optionCount >= 3 && !optionC.trim()) {
    alert("Option C is required");
    return;
  }

  if (optionCount >= 4 && !optionD.trim()) {
    alert("Option D is required");
    return;
  }

  if (!correctAnswer) {
    alert("Please select the correct answer");
    return;
  }

  let finalOptionC = optionC;
  let finalOptionD = optionD;

  if (optionCount < 4) finalOptionD = "";
  if (optionCount < 3) finalOptionC = "";

  try {
    let questionImageUrl = "";
    let optionAImageUrl = "";
    let optionBImageUrl = "";
    let optionCImageUrl = "";
    let optionDImageUrl = "";

    const uploadFile = async (file: File | null) => {
      if (!file) return "";

      const fileName =
        `${Date.now()}-${Math.random()}-${file.name}`;

      const { error } = await supabase.storage
        .from("quiz-images")
        .upload(fileName, file);

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from("quiz-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    };

    questionImageUrl = await uploadFile(questionImage);
    optionAImageUrl = await uploadFile(optionAImage);
    optionBImageUrl = await uploadFile(optionBImage);
    optionCImageUrl = await uploadFile(optionCImage);
    optionDImageUrl = await uploadFile(optionDImage);

    await api.post("/quiz/add-question", {
      quizId: id,
      questionText,
      optionA,
      optionB,
      optionC: finalOptionC,
      optionD: finalOptionD,
      correctAnswer,
      explanation,
      questionType: "MCQ",
      questionTimeLimit,

      questionImageUrl,
      optionAImageUrl,
      optionBImageUrl,
      optionCImageUrl,
      optionDImageUrl,
    });

    alert("Question Added Successfully");

    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("");
    setExplanation("");

    setQuestionTimeLimit(30);
    setOptionCount(4);

    setQuestionImage(null);
    setOptionAImage(null);
    setOptionBImage(null);
    setOptionCImage(null);
    setOptionDImage(null);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to add question"
    );
  }
};

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">
        Add Question
      </h1>

      <p className="text-gray-500 mb-6">
        Quiz ID: {id}
      </p>

      <div className="bg-white rounded-2xl shadow-md border p-6 space-y-5">

        <h2 className="text-xl font-semibold">
          Create Question
        </h2>

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Enter Question"
          value={questionText}
          onChange={(e) =>
            setQuestionText(e.target.value)
          }
        />
        <label className="block font-medium">
  Question Image (Optional)
</label>

<input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setQuestionImage(
      e.target.files?.[0] || null
    )
  }
/>
{questionImage && (
  <img
    src={URL.createObjectURL(questionImage)}
    alt="Question Preview"
    className="w-48 rounded-lg border mt-2"
  />
)}

        {/* OPTION A */}
        <div className="flex items-center gap-3">
          <input
            type="radio"
            name="correctAnswer"
            checked={correctAnswer === "A"}
            onChange={() => setCorrectAnswer("A")}
          />

          <input
            className="border rounded-lg p-3 flex-1"
            placeholder="Option A"
            value={optionA}
            onChange={(e) =>
              setOptionA(e.target.value)
            }
          />
          <input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setOptionAImage(
      e.target.files?.[0] || null
    )
  }
/>
{questionImage && (
  <img
    src={URL.createObjectURL(questionImage)}
    alt="Question Preview"
    className="w-48 rounded-lg border mt-2"
  />
)}
        </div>

        {/* OPTION B */}
        <div className="flex items-center gap-3">
          <input
            type="radio"
            name="correctAnswer"
            checked={correctAnswer === "B"}
            onChange={() => setCorrectAnswer("B")}
          />

          <input
            className="border rounded-lg p-3 flex-1"
            placeholder="Option B"
            value={optionB}
            onChange={(e) =>
              setOptionB(e.target.value)
            }
          />
          <input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setOptionBImage(
      e.target.files?.[0] || null
    )
  }
/>
        </div>

        {/* OPTION C */}
        {optionCount >= 3 && (
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="correctAnswer"
              checked={correctAnswer === "C"}
              onChange={() => setCorrectAnswer("C")}
            />

            <input
              className="border rounded-lg p-3 flex-1"
              placeholder="Option C"
              value={optionC}
              onChange={(e) =>
                setOptionC(e.target.value)
              }
            />
            <input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setOptionCImage(
      e.target.files?.[0] || null
    )
  }
/>
          </div>
        )}

        {/* OPTION D */}
        {optionCount >= 4 && (
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="correctAnswer"
              checked={correctAnswer === "D"}
              onChange={() => setCorrectAnswer("D")}
            />

            <input
              className="border rounded-lg p-3 flex-1"
              placeholder="Option D"
              value={optionD}
              onChange={(e) =>
                setOptionD(e.target.value)
              }
            />
            <input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setOptionDImage(
      e.target.files?.[0] || null
    )
  }
/>
          </div>
        )}

        <div className="flex gap-3">

          <button
            type="button"
            className="border px-4 py-2 rounded-lg hover:bg-gray-100"
            onClick={() => {
              if (optionCount < 4) {
                setOptionCount(optionCount + 1);
              }
            }}
          >
            + Add Option
          </button>

          <button
            type="button"
            className="border px-4 py-2 rounded-lg hover:bg-gray-100"
            onClick={() => {
              if (optionCount > 2) {
                const newCount = optionCount - 1;

                setOptionCount(newCount);

                if (
                  (newCount === 3 &&
                    correctAnswer === "D") ||
                  (newCount === 2 &&
                    (correctAnswer === "C" ||
                      correctAnswer === "D"))
                ) {
                  setCorrectAnswer("");
                }
              }
            }}
          >
            Remove Option
          </button>
        </div>

        <textarea
          className="border rounded-lg p-3 w-full min-h-[120px]"
          placeholder="Explanation"
          value={explanation}
          onChange={(e) =>
            setExplanation(e.target.value)
          }
        />

        <div>
          <label className="block mb-2 font-medium">
            Question Timer
          </label>

          <select
            className="border rounded-lg p-3 w-full"
            value={questionTimeLimit}
            onChange={(e) =>
              setQuestionTimeLimit(
                Number(e.target.value)
              )
            }
          >
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={20}>20 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={45}>45 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
        </div>

        <button
          onClick={saveQuestion}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Save Question
        </button>

      </div>
    </div>
  );
}