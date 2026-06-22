"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { X, Search, Check, FileText, FolderInput, Loader2 } from "lucide-react";

interface QuizLite {
  id: string;
  title: string;
  status: string;
  difficulty?: string;
  folderId?: string | null;
}

interface AddQuizToFolderModalProps {
  folderId: string;
  folderName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddQuizToFolderModal({
  folderId,
  folderName,
  onClose,
  onSuccess,
}: AddQuizToFolderModalProps) {
  const [quizzes, setQuizzes] = useState<QuizLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    api
      .get("/quiz/all")
      .then((res) => {
        if (cancelled) return;
        const all: QuizLite[] = (res.data as QuizLite[]).filter(
          (q) => q.folderId !== folderId
        );
        setQuizzes(all);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const assign = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      await api.post(`/folders/${folderId}/assign`, {
        quizIds: Array.from(selected),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add quizzes to the folder.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = quizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="font-bold text-lg text-zinc-900">Add Quizzes</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select quizzes to add to “{folderName}”
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <Loader2 className="animate-spin" size={22} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm">
              No quizzes available to add.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((q) => {
                const isSel = selected.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggle(q.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors ${
                      isSel
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 border ${
                        isSel ? "bg-indigo-600 border-indigo-600 text-white" : "border-zinc-300"
                      }`}
                    >
                      {isSel && <Check size={13} />}
                    </span>
                    <FileText size={15} className="text-zinc-400 flex-shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold truncate text-zinc-800">
                        {q.title}
                      </span>
                    </span>
                    {q.folderId && (
                      <span className="text-[10px] text-zinc-400 flex-shrink-0">already filed</span>
                    )}
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0 ${
                        q.status === "Published"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {q.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex items-center gap-2 justify-between">
          <span className="text-sm text-zinc-500">{selected.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border text-sm font-semibold hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={assign}
              disabled={selected.size === 0 || saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              <FolderInput size={15} />
              {saving ? "Adding..." : "Add to Folder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
