"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, Users } from "lucide-react";
import api from "@/services/api";

interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  correctAnswer: string;
  accuracy: number;
  countA: number;
  countB: number;
  countC: number;
  countD: number;
  countE: number;
  countEmpty: number;
}

interface QuestionStatsListProps {
  sessionCode: string;
  liveStudents: number;
  refreshKey?: number;
}

function correctCountFor(q: QuestionAnalysis): number {
  switch ((q.correctAnswer || "").toUpperCase()) {
    case "A":
      return q.countA;
    case "B":
      return q.countB;
    case "C":
      return q.countC;
    case "D":
      return q.countD;
    case "E":
      return q.countE;
    default:
      return 0;
  }
}

export default function QuestionStatsList({
  sessionCode,
  liveStudents,
  refreshKey,
}: QuestionStatsListProps) {
  const [questions, setQuestions] = useState<QuestionAnalysis[]>([]);

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await api.get(`/LiveQuiz/${sessionCode}/question-analysis`);
      setQuestions(res.data || []);
    } catch (err) {
      console.error("Failed to load question analysis", err);
    }
  }, [sessionCode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 4000);
    return () => clearInterval(interval);
  }, [fetchAnalysis, refreshKey]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <h3 className="text-white/80 font-medium">Questions</h3>
        <span className="flex items-center gap-1.5 text-xs text-white/50">
          <Users size={14} /> {liveStudents} live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
        {questions.length === 0 ? (
          <p className="p-8 text-center text-white/40">No question data yet.</p>
        ) : (
          questions.map((q, idx) => {
            const correct = correctCountFor(q);
            const answered =
              q.countA + q.countB + q.countC + q.countD + q.countE;
            const incorrect = Math.max(0, answered - correct);
            return (
              <div key={q.questionId} className="p-4 flex items-start gap-3">
                <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-white/10 text-white/70 flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate" title={q.questionText}>
                    {q.questionText}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 size={14} /> {correct} correct
                    </span>
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle size={14} /> {incorrect} incorrect
                    </span>
                    <span className="text-white/40">{q.accuracy}% accuracy</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
