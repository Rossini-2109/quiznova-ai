"use client";

import React from "react";
import { useState, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { supabase } from "@/lib/supabase";
import { ImagePlus } from "lucide-react";

export default function AddQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();

  // Question fields
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [optionE, setOptionE] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [optionCount, setOptionCount] = useState(4);
  const [questionTimeLimit, setQuestionTimeLimit] = useState(30);

  // Image states
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

  const uploadFile = async (file: File | null) => {
    if (!file) return "";
    const fileName = `${Date.now()}-${Math.random()}-${file.name}`;
    const { error } = await supabase.storage.from("quiz-images").upload(fileName, file);
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("quiz-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const saveQuestion = async () => {
    // Validation
    if (!questionText.trim()) { alert("Please enter a question"); return; }
    if (!optionA.trim() || !optionB.trim()) { alert("Option A and B are required"); return; }
    if (optionCount >= 3 && !optionC.trim()) { alert("Option C is required"); return; }
    if (optionCount >= 4 && !optionD.trim()) { alert("Option D is required"); return; }
    if (optionCount >= 5 && !optionE.trim()) { alert("Option E is required"); return; }
    if (!correctAnswer) { alert("Select correct answer"); return; }

    const finalOptionC = optionCount >= 3 ? optionC : "";
    const finalOptionD = optionCount >= 4 ? optionD : "";
    const finalOptionE = optionCount >= 5 ? optionE : "";

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

      alert("Question added successfully");
      clearForm();
      router.refresh(); // stay on same page for next question
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || "Failed to add question");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Add Question</h1>
      <textarea
        className="w-full p-2 border rounded"
        placeholder="Question text"
        value={questionText}
        onChange={e => setQuestionText(e.target.value)}
      />
      {/* Question Image */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => questionImageRef.current?.click()}
          className="p-2 border rounded hover:bg-gray-100"
        >
          <ImagePlus size={18} /> Upload Image
        </button>
        <input
          ref={questionImageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => setQuestionImage(e.target.files?.[0] ?? null)}
        />
        {questionImage && (
          <img src={URL.createObjectURL(questionImage)} alt="Preview" className="w-24 h-24 object-cover rounded" />
        )}
      </div>
      {/* Options */}
      {["A", "B", "C", "D", "E"].slice(0, optionCount).map(letter => {
        let optionValue: string = '';
        let setOptionFn: (v: string) => void = () => {};
        let image: File | null = null;
        let setImageFn: (f: File | null) => void = () => {};
                let imageRef: React.RefObject<HTMLInputElement | null> | null = null;
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
      <div className="flex gap-4">
        <button onClick={saveQuestion} className="bg-indigo-600 text-white px-4 py-2 rounded">Save & Add Another</button>
        <button onClick={() => router.push(`/teacher/quizzes/${quizId}`)} className="bg-gray-200 px-4 py-2 rounded">Back to Quiz</button>
      </div>
    </div>
  );
}
