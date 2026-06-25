"use client";

import React, { useState, useRef, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { supabase } from "@/lib/supabase";
import { ImagePlus, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AddQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const router = useRouter();

  // ---------- Question fields ----------
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [optionE, setOptionE] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [optionCount, setOptionCount] = useState(4);
  const [questionTimeLimit, setQuestionTimeLimit] = useState(30);

  // ---------- Image handling ----------
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [optionAImage, setOptionAImage] = useState<File | null>(null);
  const [optionBImage, setOptionBImage] = useState<File | null>(null);
  const [optionCImage, setOptionCImage] = useState<File | null>(null);
  const [optionDImage, setOptionDImage] = useState<File | null>(null);
  const [optionEImage, setOptionEImage] = useState<File | null>(null);

  const questionImageRef = useRef<HTMLInputElement>(null);
  const optionAImageRef = useRef<HTMLInputElement>(null);
  const optionBImageRef = useRef<HTMLInputElement>(null);
  const optionCImageRef = useRef<HTMLInputElement>(null);
  const optionDImageRef = useRef<HTMLInputElement>(null);
  const optionEImageRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Reset correct answer if an option is removed
  useEffect(() => {
    if (optionCount < 5 && correctAnswer === "E") setCorrectAnswer("");
    if (optionCount < 4 && correctAnswer === "D") setCorrectAnswer("");
    if (optionCount < 3 && correctAnswer === "C") setCorrectAnswer("");
  }, [optionCount, correctAnswer]);

  // Auto-clear messages after 3 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const clearForm = () => {
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setOptionE("");
    setCorrectAnswer("");
    setOptionCount(4);
    setQuestionTimeLimit(30);
    setQuestionImage(null);
    setOptionAImage(null);
    setOptionBImage(null);
    setOptionCImage(null);
    setOptionDImage(null);
    setOptionEImage(null);
  };

  const uploadFile = async (file: File | null): Promise<string> => {
    if (!file) return "";
    const fileName = `${Date.now()}-${Math.random()}-${file.name}`;
    const { error } = await supabase.storage.from("quiz-images").upload(fileName, file);
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("quiz-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const saveQuestion = async () => {
    // ---------- Validation ----------
    if (!questionText.trim()) { setErrorMessage("Please enter a question"); return; }
    if (!optionA.trim() || !optionB.trim()) { setErrorMessage("Option A and B are required"); return; }
    if (optionCount >= 3 && !optionC.trim()) { setErrorMessage("Option C is required"); return; }
    if (optionCount >= 4 && !optionD.trim()) { setErrorMessage("Option D is required"); return; }
    if (optionCount >= 5 && !optionE.trim()) { setErrorMessage("Option E is required"); return; }
    if (!correctAnswer) { setErrorMessage("Select correct answer"); return; }

    setIsSubmitting(true);
    try {
      const [questionImageUrl, optionAImageUrl, optionBImageUrl, optionCImageUrl, optionDImageUrl, optionEImageUrl] = await Promise.all([
        uploadFile(questionImage),
        uploadFile(optionAImage),
        uploadFile(optionBImage),
        uploadFile(optionCImage),
        uploadFile(optionDImage),
        uploadFile(optionEImage),
      ]);

      await api.post("/quiz/add-question", {
        quizId,
        questionText,
        optionA,
        optionB,
        optionC: optionCount >= 3 ? optionC : "",
        optionD: optionCount >= 4 ? optionD : "",
        optionE: optionCount >= 5 ? optionE : "",
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

      setSuccessMessage("Question added successfully");
      clearForm();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to add question");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Add Question</h1>
      <input className="w-full p-2 border rounded" placeholder="Question text" value={questionText} onChange={e => setQuestionText(e.target.value)} />
      <button type="button" onClick={() => questionImageRef?.current?.click()} className="flex items-center gap-2 p-2 border rounded">
        <ImagePlus size={16} /> Add Question Image
      </button>
      {/* Question image preview */}
{questionImage && (
  <div className="my-2">
    <img src={URL.createObjectURL(questionImage)} alt="Question" className="max-w-xs rounded shadow" />
  </div>
)}
      
      {['A', 'B', 'C', 'D', 'E'].slice(0, optionCount).map((letter) => {
        let optionValue = "", setOptionFn = (v: string) => {}, image: File | null = null, setImageFn = (f: File | null) => {}, imageRef: React.RefObject<HTMLInputElement | null> | null = null;
        switch (letter) {
          case 'A':
            optionValue = optionA;
            setOptionFn = setOptionA;
            image = optionAImage;
            setImageFn = setOptionAImage;
            imageRef = optionAImageRef;
            break;
          case 'B':
            optionValue = optionB;
            setOptionFn = setOptionB;
            image = optionBImage;
            setImageFn = setOptionBImage;
            imageRef = optionBImageRef;
            break;
          case 'C':
            optionValue = optionC;
            setOptionFn = setOptionC;
            image = optionCImage;
            setImageFn = setOptionCImage;
            imageRef = optionCImageRef;
            break;
          case 'D':
            optionValue = optionD;
            setOptionFn = setOptionD;
            image = optionDImage;
            setImageFn = setOptionDImage;
            imageRef = optionDImageRef;
            break;
          case 'E':
            optionValue = optionE;
            setOptionFn = setOptionE;
            image = optionEImage;
            setImageFn = setOptionEImage;
            imageRef = optionEImageRef;
            break;
        }
        return (
          <div key={letter} className="flex items-center gap-2">
            <input type="radio" name="correctAnswer" checked={correctAnswer === letter} onChange={() => setCorrectAnswer(letter)} />
            <input className="flex-1 p-2 border rounded" placeholder={`Option ${letter}`} value={optionValue} onChange={e => setOptionFn(e.target.value)} />
            <button type="button" onClick={() => imageRef?.current?.click()} className="p-2 border rounded hover:bg-gray-100">
              <ImagePlus size={16} />
            </button>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => setImageFn(e.target.files?.[0] ?? null)} />
            {image && (
              <img src={URL.createObjectURL(image)} alt={`Option ${letter}`} className="w-16 h-16 object-cover rounded" />
            )}
          </div>
        );
      })}
      {/* Option count controls */}
      <div className="flex gap-2">
        <button type="button" disabled={optionCount >= 5} onClick={() => setOptionCount(c => c + 1)} className="px-3 py-1 border rounded hover:bg-gray-100">+ Add Option</button>
        <button type="button" disabled={optionCount <= 2} onClick={() => setOptionCount(c => c - 1)} className="px-3 py-1 border rounded hover:bg-gray-100">- Remove Option</button>
      </div>
      {/* Time limit */}
      <select className="p-2 border rounded" value={questionTimeLimit} onChange={e => setQuestionTimeLimit(Number(e.target.value))}>
        {[10,15,20,30,45,60].map(v => (<option key={v} value={v}>{v} seconds</option>))}
      </select>
            {/* Actions */}
      <div className="flex flex-col gap-4">
        {successMessage && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={saveQuestion}
            disabled={isSubmitting}
            className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Save & Add Another"
            )}
          </button>

          <button
            onClick={() => router.push(`/teacher/quizzes/${quizId}`)}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Back to Quiz
          </button>
        </div>
      </div>

      {/* Hidden Question Image Input */}
      <input
        ref={questionImageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) =>
          setQuestionImage(e.target.files?.[0] ?? null)
        }
      />
    </div>
  );
}