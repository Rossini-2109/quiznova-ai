"use client";

import { useState, use } from "react";
import api from "@/services/api";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Copy,
  Trash2
} from "lucide-react";
import { useRef } from "react";

export default function QuizDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [optionE, setOptionE] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [optionCount, setOptionCount] = useState(4);
  const [questionTimeLimit, setQuestionTimeLimit] = useState(30);
  const [questionImage, setQuestionImage] = useState<File | null>(null);

const [optionAImage, setOptionAImage] = useState<File | null>(null);
const [optionBImage, setOptionBImage] = useState<File | null>(null);
const [optionCImage, setOptionCImage] = useState<File | null>(null);
const [optionDImage, setOptionDImage] = useState<File | null>(null);
const [optionEImage, setOptionEImage] =
  useState<File | null>(null);
const [questionNumber, setQuestionNumber] = useState(1);

const questionImageRef = useRef<HTMLInputElement>(null);
const optionAImageRef = useRef<HTMLInputElement>(null);
const optionBImageRef = useRef<HTMLInputElement>(null);
const optionCImageRef = useRef<HTMLInputElement>(null);
const optionDImageRef = useRef<HTMLInputElement>(null);
const optionEImageRef =
  useRef<HTMLInputElement>(null);

const clearForm = () => {
  setQuestionText("");
  setOptionA("");
  setOptionB("");
  setOptionC("");
  setOptionD("");
  setOptionE("");
  setCorrectAnswer("");

  setQuestionTimeLimit(30);
  setOptionCount(4);

  setQuestionImage(null);
  setOptionAImage(null);
  setOptionBImage(null);
  setOptionCImage(null);
  setOptionDImage(null);
  setOptionEImage(null);
};
const saveQuiz = () => {
  alert("Quiz Saved Successfully");
  router.push("/teacher/quizzes");
};
  const saveQuestion = async (): Promise<boolean> => {
  if (!questionText.trim()) {
    alert("Please enter a question");
    return false;
  }

  if (!optionA.trim() || !optionB.trim()) {
    alert("Option A and Option B are required");
    return false;
  }

  if (optionCount >= 3 && !optionC.trim()) {
    alert("Option C is required");
    return false;
  }

  if (optionCount >= 4 && !optionD.trim()) {
    alert("Option D is required");
    return false;
  }

  if (optionCount >= 5 && !optionE.trim()) {
  alert("Option E is required");
  return false;
}

  if (!correctAnswer) {
    alert("Please select the correct answer");
    return false;
  }
  

  let finalOptionC = optionC;
  let finalOptionD = optionD;
  let finalOptionE = optionE;


  if (optionCount < 4) finalOptionD = "";
  if (optionCount < 3) finalOptionC = "";
  if (optionCount < 5) finalOptionE = "";

  try {
    let questionImageUrl = "";
    let optionAImageUrl = "";
    let optionBImageUrl = "";
    let optionCImageUrl = "";
    let optionDImageUrl = "";
    let optionEImageUrl = "";

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
    optionEImageUrl =
  await uploadFile(optionEImage);

    await api.post("/quiz/add-question", {
      quizId: id,
      questionText,
      optionA,
      optionB,
      optionC: finalOptionC,
      optionD: finalOptionD,
      optionE: finalOptionE,
      correctAnswer,
      questionType: "MCQ",
      questionTimeLimit,

      questionImageUrl,
      optionAImageUrl,
      optionBImageUrl,
      optionCImageUrl,
      optionDImageUrl,
      optionEImageUrl,
    });

    alert("Question Added Successfully");
        
    setQuestionImage(null);
    setOptionAImage(null);
    setOptionBImage(null);
    setOptionCImage(null);
    setOptionDImage(null);

    return true;
  } catch (error: any) {
  console.error(error);

  alert(
    error?.response?.data?.message ||
    error?.message ||
    "Failed to add question"
  );

  return false;
}
};
  const duplicateCurrentQuestion = async () => {
    // Duplicate the current question by saving it and then clearing the form for a new entry
    const success = await saveQuestion();
    if (success) {
      alert('Question duplicated and saved');
      // Increment question number for the new duplicate
      setQuestionNumber(prev => prev + 1);
      clearForm();
    } else {
      alert('Failed to duplicate the question');
    }
  };
const saveAndNext = async () => {
  const success = await saveQuestion();

  if (success) {
    setQuestionNumber((prev) => prev + 1);
    clearForm();
  }
};

const deleteCurrentQuestion = () => {

  if (
    confirm(
      "Clear current question?"
    )
  ) {
    clearForm();
  }
};
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">
        Add Question
      </h1>

      <p className="text-gray-500 mb-6">
  Add questions to your quiz
</p>

      <div className="bg-white rounded-2xl shadow-md border p-6 space-y-5">

       <div className="flex justify-between items-center">

  <h2 className="text-xl font-semibold">
    Question {questionNumber}
  </h2>

  <div className="flex gap-3">

    <button
      type="button"
      onClick={duplicateCurrentQuestion}
      className="p-2 rounded-lg border hover:bg-gray-100"
      title="Copy Question"
    >
      <Copy size={18} />
    </button>

    <button
      type="button"
      onClick={deleteCurrentQuestion}
      className="p-2 rounded-lg border hover:bg-red-50 text-red-600"
      title="Clear Question"
    >
      <Trash2 size={18} />
    </button>

  </div>

</div>

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Enter Question"
          value={questionText}
          onChange={e => setOption?.(e.target.value)}
        />
        <div className="flex items-center gap-3">

  <button
    type="button"
    onClick={() => questionImageRef.current?.click()}
    className="p-2 rounded-lg border hover:bg-gray-100"
    title="Upload Question Image"
  >
    <ImagePlus size={20} />
  </button>

  <input
    ref={questionImageRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) =>
      setQuestionImage(
        e.target.files?.[0] || null
      )
    }
  />

</div>
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
          <button
  type="button"
  onClick={() => optionAImageRef.current?.click()}
  className="p-2 border rounded-lg hover:bg-gray-100"
>
  <ImagePlus size={18} />
</button>

<input
  ref={optionAImageRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) =>
    setOptionAImage(
      e.target.files?.[0] || null
    )
  }
/>
{optionAImage && (
  <img
    src={URL.createObjectURL(optionAImage)}
    alt="Option A Preview"
    className="w-24 rounded-lg border mt-2"
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
          <button
  type="button"
  onClick={() => optionBImageRef.current?.click()}
  className="p-2 border rounded-lg hover:bg-gray-100"
>
  <ImagePlus size={18} />
</button>

<input
  ref={optionBImageRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) =>
    setOptionBImage(
      e.target.files?.[0] || null
    )
  }
/>
{optionBImage && (
  <img
    src={URL.createObjectURL(optionBImage)}
    alt="Option B Preview"
    className="w-24 rounded-lg border mt-2"
  />
)}
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
            <button
  type="button"
  onClick={() => optionCImageRef.current?.click()}
  className="p-2 border rounded-lg hover:bg-gray-100"
>
  <ImagePlus size={18} />
</button>

<input
  ref={optionCImageRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) =>
    setOptionCImage(
      e.target.files?.[0] || null
    )
  }
/>
{optionCImage && (
  <img
    src={URL.createObjectURL(optionCImage)}
    alt="Option C Preview"
    className="w-24 rounded-lg border mt-2"
  />
)}
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
           <button
  type="button"
  onClick={() => optionDImageRef.current?.click()}
  className="p-2 border rounded-lg hover:bg-gray-100"
>
  <ImagePlus size={18} />
</button>

<input
  ref={optionDImageRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) =>
    setOptionDImage(
      e.target.files?.[0] || null
    )
  }
/>
{optionDImage && (
  <img
    src={URL.createObjectURL(optionDImage)}
    alt="Option D Preview"
    className="w-24 rounded-lg border mt-2"
  />
)}
          </div>
        )}
{optionCount >= 5 && (
  <div className="flex items-center gap-3">

    <input
      type="radio"
      name="correctAnswer"
      checked={correctAnswer === "E"}
      onChange={() => setCorrectAnswer("E")}
    />

    <input
      className="border rounded-lg p-3 flex-1"
      placeholder="Option E"
      value={optionE}
      onChange={(e) =>
        setOptionE(e.target.value)
      }
    />

    <button
      type="button"
      onClick={() =>
        optionEImageRef.current?.click()
      }
      className="p-2 border rounded-lg hover:bg-gray-100"
    >
      <ImagePlus size={18} />
    </button>

    <input
      ref={optionEImageRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) =>
        setOptionEImage(
          e.target.files?.[0] || null
        )
      }
    />

  </div>
)}
        <div className="flex gap-3">

          <button
  type="button"
  disabled={optionCount >= 5}
  className={`
    border px-4 py-2 rounded-lg
    ${
      optionCount >= 5
        ? "opacity-50 cursor-not-allowed"
        : "hover:bg-gray-100"
    }
  `}
  onClick={() => {
    if (optionCount < 5) {
      setOptionCount(optionCount + 1);
    }
  }}
>
  + Add Option
</button>

          <button
  type="button"
  disabled={optionCount <= 2}
  className={`
    border px-4 py-2 rounded-lg
    ${
      optionCount <= 2
        ? "opacity-50 cursor-not-allowed"
        : "hover:bg-gray-100"
    }
  `}
  onClick={() => {
    if (optionCount > 2) {
      const newCount = optionCount - 1;

      setOptionCount(newCount);

      if (
        (newCount === 4 &&
          correctAnswer === "E") ||
        (newCount === 3 &&
          correctAnswer === "D") ||
        (newCount === 2 &&
          (correctAnswer === "C" ||
            correctAnswer === "D" ||
            correctAnswer === "E"))
      ) {
        setCorrectAnswer("");
      }
    }
  }}
>
  Remove Option
</button>
        </div>

        

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

        <div className="flex gap-3">

  <button
    onClick={saveAndNext}
    className="bg-indigo-600 text-white px-6 py-3 rounded-xl"
  >
    Save & Add New Question
  </button>

  <button
    onClick={saveQuiz}
    className="bg-green-600 text-white px-6 py-3 rounded-xl"
  >
    Save Quiz
  </button>

</div>

      </div>
    </div>
  );
}