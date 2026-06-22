"use client";

import {
  X,
  Pencil,
  Play,
  FileText,
  Calendar,
  BarChart3,
  Hash,
  FolderMinus,
} from "lucide-react";

export interface QuizDetail {
  id: string;
  title: string;
  description?: string;
  status: string;
  difficulty?: string;
  questionCount?: number;
  createdAt?: string;
  folderId?: string;
}

interface QuizDetailsModalProps {
  quiz: QuizDetail;
  folderName?: string;
  onClose: () => void;
  onEdit: (id: string) => void;
  onHost: (id: string) => void;
  onRemoveFromFolder?: (id: string) => void;
}

function fmtDate(d?: string): string {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function QuizDetailsModal({
  quiz,
  folderName,
  onClose,
  onEdit,
  onHost,
  onRemoveFromFolder,
}: QuizDetailsModalProps) {
  const published = quiz.status === "Published";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <X size={15} />
          </button>
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
              published ? "bg-emerald-400/90 text-emerald-950" : "bg-amber-300/90 text-amber-950"
            }`}
          >
            {quiz.status}
          </span>
          <h2 className="text-2xl font-black mt-3 leading-tight">{quiz.title}</h2>
          {folderName && (
            <p className="text-white/70 text-xs mt-1">In folder · {folderName}</p>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {quiz.description && (
            <p className="text-sm text-zinc-600 leading-relaxed">{quiz.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-200/70 p-4 flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Hash size={16} />
              </span>
              <div>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Questions</p>
                <p className="font-bold text-zinc-900">{quiz.questionCount ?? 0}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 p-4 flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BarChart3 size={16} />
              </span>
              <div>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Difficulty</p>
                <p className="font-bold text-zinc-900 capitalize">{quiz.difficulty || "—"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 p-4 flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText size={16} />
              </span>
              <div>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Status</p>
                <p className="font-bold text-zinc-900">{quiz.status}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 p-4 flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar size={16} />
              </span>
              <div>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wide">Created</p>
                <p className="font-bold text-zinc-900 text-sm">{fmtDate(quiz.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t flex flex-wrap gap-2 justify-end">
          {onRemoveFromFolder && quiz.folderId && (
            <button
              onClick={() => onRemoveFromFolder(quiz.id)}
              className="mr-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <FolderMinus size={15} /> Remove from folder
            </button>
          )}
          <button
            onClick={() => onEdit(quiz.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold hover:bg-zinc-50 transition-colors"
          >
            <Pencil size={15} /> Edit
          </button>
          <button
            onClick={() => onHost(quiz.id)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
          >
            <Play size={15} /> Host Live
          </button>
        </div>
      </div>
    </div>
  );
}
