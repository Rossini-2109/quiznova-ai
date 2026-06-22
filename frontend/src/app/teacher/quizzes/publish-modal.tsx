"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import api from "@/services/api";

interface PublishModalProps {
  quizId: string;
  onClose: () => void;
}

export default function PublishModal({ quizId, onClose }: PublishModalProps) {
  const router = useRouter();
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishSubmit = async () => {
    try {
      setIsPublishing(true);

      const res = await api.put(`/quiz/publish/${quizId}`, {
        maxAttempts,
        shuffleQuestions,
      });

      const sessionCode = res.data.quizCode;

      if (!sessionCode) {
        alert("Session code missing from API response");
        return;
      }

      onClose();
      router.push(`/teacher/live/${sessionCode}`);
    } catch (error) {
      console.error("Error publishing quiz:", error);
      alert("Failed to publish quiz");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold dark:text-white">Publish Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Number of Attempts
            </label>
            <input
              type="number"
              min="1"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-zinc-500 mt-1">
              How many times can a student take this quiz?
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <div>
              <h4 className="text-sm font-semibold dark:text-white">
                Shuffle Questions &amp; Options
              </h4>
              <p className="text-xs text-zinc-500">
                Randomize the order for each student
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>

          <button
            onClick={handlePublishSubmit}
            disabled={isPublishing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : "Publish & Host Live"}
          </button>
        </div>
      </div>
    </div>
  );
}
