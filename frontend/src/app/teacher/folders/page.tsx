"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
import {
  Folder,
  FolderPlus,
  BookOpen,
  BarChart2,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Copy,
  MoveRight,
  Eye,
  ToggleLeft,
  X,
  Check,
  FileText,
  BookMarked,
  Star,
  Archive,
  Globe,
  Layers,
  Zap,
  Hash,
  Layout,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface QuizInFolder {
  id: string;
  title: string;
  description: string;
  status: string;
  difficulty: string;
  questionCount: number;
  createdAt: string;
  folderId?: string;
}

interface FolderData {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  lastModifiedAt: string;
  quizCount: number;
  quizzes: QuizInFolder[];
  subFolders: FolderData[];
}

interface LibraryStats {
  totalQuizzes: number;
  draftQuizzes: number;
  publishedQuizzes: number;
  totalFolders: number;
  totalAttempts: number;
  recentQuizzes: { id: string; title: string; status: string; createdAt: string }[];
}

// ─── Color & Icon Options ────────────────────────────────────────────────────
const FOLDER_COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#10b981", label: "Emerald" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#f97316", label: "Orange" },
  { value: "#84cc16", label: "Lime" },
];

const FOLDER_ICONS: { value: string; Icon: React.FC<{ size?: number }> }[] = [
  { value: "folder", Icon: Folder },
  { value: "book", Icon: BookOpen },
  { value: "bookmark", Icon: BookMarked },
  { value: "star", Icon: Star },
  { value: "archive", Icon: Archive },
  { value: "globe", Icon: Globe },
  { value: "layers", Icon: Layers },
  { value: "zap", Icon: Zap },
  { value: "hash", Icon: Hash },
  { value: "layout", Icon: Layout },
];

function getFolderIcon(iconValue: string) {
  const match = FOLDER_ICONS.find((i) => i.value === iconValue);
  return match?.Icon ?? Folder;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
          {label}
        </p>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon size={17} className="" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>
      )}
    </div>
  );
}

// ─── Add Quiz Modal ───────────────────────────────────────────────────────────
function AddQuizModal({
  folderId,
  onClose,
  onSuccess,
}: {
  folderId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [allQuizzes, setAllQuizzes] = useState<QuizInFolder[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/folders/unassigned-quizzes").then((r) => setAllQuizzes(r.data));
  }, []);

  const filtered = allQuizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    if (!selected.length) return;
    setLoading(true);
    try {
      await api.post(`/folders/${folderId}/add-quiz`, { quizIds: selected });
      onSuccess();
      onClose();
    } catch {
      /* handle */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              Add Quizzes to Folder
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select quizzes from your library
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-4 max-h-72 overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-sm">
              No quizzes available
            </div>
          ) : (
            filtered.map((q) => (
              <label
                key={q.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  selected.includes(q.id)
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                    : "bg-zinc-50 dark:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected.includes(q.id)
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {selected.includes(q.id) && (
                    <Check size={11} className="text-white" />
                  )}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selected.includes(q.id)}
                  onChange={() => toggle(q.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {q.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        q.status === "Published"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {q.status}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {q.questionCount} questions
                    </span>
                    {q.folderId && (
                      <span className="text-[10px] text-zinc-400">
                        (already in a folder)
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            {selected.length} selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!selected.length || loading}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              {loading ? "Adding..." : `Add ${selected.length || ""} Quiz${selected.length !== 1 ? "zes" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create/Edit Folder Modal ─────────────────────────────────────────────────
function FolderModal({
  editFolder,
  onClose,
  onSuccess,
}: {
  editFolder?: FolderData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(editFolder?.name ?? "");
  const [color, setColor] = useState(editFolder?.color ?? "#6366f1");
  const [icon, setIcon] = useState(editFolder?.icon ?? "folder");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (editFolder) {
        await api.put(`/folders/${editFolder.id}`, { name, color, icon });
      } else {
        await api.post("/folders", { name, color, icon });
      }
      onSuccess();
      onClose();
    } catch {
      /* handle */
    } finally {
      setLoading(false);
    }
  };

  const IconComponent = getFolderIcon(icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
            {editFolder ? "Edit Folder" : "New Folder"}
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: color + "25", border: `2px solid ${color}40` }}
            >
              <IconComponent size={26} style={{ color }} />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {name || "Folder Preview"}
              </p>
              <p className="text-xs text-zinc-400">Preview</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
              Folder Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Semester 1, Mid Exams..."
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={`h-8 w-8 rounded-xl transition-transform ${
                    color === c.value ? "scale-110 ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-600" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_ICONS.map(({ value: iconVal, Icon: IconComp }) => (
                <button
                  key={iconVal}
                  onClick={() => setIcon(iconVal)}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                    icon === iconVal
                      ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <IconComp size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
          >
            {loading ? "Saving..." : editFolder ? "Save Changes" : "Create Folder"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const router = useRouter();
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [quizMenuOpen, setQuizMenuOpen] = useState<string | null>(null);
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);
  const [addQuizModal, setAddQuizModal] = useState<string | null>(null);
  const [folderModal, setFolderModal] = useState<{ open: boolean; edit?: FolderData }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "folder" | "quiz"; id: string; folderId?: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, foldersRes] = await Promise.all([
        api.get("/folders/library-stats"),
        api.get("/folders"),
      ]);
      setStats(statsRes.data);
      setFolders(foldersRes.data);
    } catch {
      /* handle */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => {
      setQuizMenuOpen(null);
      setFolderMenuOpen(null);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const deleteFolder = async (id: string) => {
    await api.delete(`/folders/${id}`);
    setDeleteConfirm(null);
    loadData();
  };

  const deleteQuiz = async (quizId: string) => {
    await api.delete(`/quiz/${quizId}`);
    setDeleteConfirm(null);
    loadData();
  };

  const removeQuizFromFolder = async (folderId: string, quizId: string) => {
    await api.delete(`/folders/${folderId}/remove-quiz/${quizId}`);
    loadData();
  };

  const publishQuiz = async (quizId: string) => {
    await api.put(`/quiz/publish/${quizId}`);
    loadData();
  };

  // Flat list of all quizzes for search
  const allQuizzes = folders.flatMap((f) =>
    f.quizzes.map((q) => ({ ...q, folderName: f.name, folderId: f.id }))
  );

  const searchResults = search.length > 1
    ? allQuizzes.filter(
        (q) =>
          q.title.toLowerCase().includes(search.toLowerCase()) ||
          (q.folderName || "").toLowerCase().includes(search.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 animate-pulse" />
          <p className="text-zinc-400 text-sm">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-indigo-800 dark:from-zinc-100 dark:to-indigo-300 bg-clip-text text-transparent">
            Quiz Library
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Organize your quizzes into folders and collections
          </p>
        </div>
        <button
          onClick={() => setFolderModal({ open: true })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-500/20"
        >
          <FolderPlus size={16} />
          New Folder
        </button>
      </div>

      {/* ─── Stats ──────────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total Quizzes" value={stats.totalQuizzes} icon={FileText} color="#6366f1" />
          <StatCard label="Draft Quizzes" value={stats.draftQuizzes} icon={Pencil} color="#f59e0b" />
          <StatCard label="Published" value={stats.publishedQuizzes} icon={Globe} color="#10b981" />
          <StatCard label="Folders" value={stats.totalFolders} icon={Folder} color="#8b5cf6" />
          <StatCard label="Total Attempts" value={stats.totalAttempts} icon={BarChart2} color="#3b82f6" />
        </div>
      )}

      {/* ─── Search ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quizzes across all folders..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ─── Search Results ─────────────────────────────────────────────────── */}
      {search.length > 1 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-sm">
              Search Results
            </h3>
            <span className="text-xs text-zinc-400">{searchResults.length} found</span>
          </div>
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">
              No quizzes match your search
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {searchResults.map((q) => (
                <div key={q.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <FileText size={14} className="text-zinc-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{q.title}</p>
                    <p className="text-xs text-zinc-400">
                      in {(q as any).folderName} · {q.questionCount} questions
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    q.status === "Published"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {q.status}
                  </span>
                  <Link
                    href={`/teacher/quizzes/edit/${q.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Pencil size={12} /> Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Folders ────────────────────────────────────────────────────────── */}
      {!search && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-zinc-700 dark:text-zinc-300">
              All Folders ({folders.length})
            </h2>
          </div>

          {folders.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl p-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                <FolderPlus size={24} className="text-indigo-400" />
              </div>
              <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-300">
                No folders yet
              </h3>
              <p className="text-zinc-400 text-sm mt-1 mb-4">
                Create folders to organize your quizzes by subject, semester, or topic
              </p>
              <button
                onClick={() => setFolderModal({ open: true })}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Create Your First Folder
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {folders.map((folder) => {
                const FolderIcon = getFolderIcon(folder.icon);
                const isExpanded = expanded.includes(folder.id);

                return (
                  <div
                    key={folder.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Folder Header */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                      onClick={() => toggleExpand(folder.id)}
                    >
                      {/* Icon */}
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: folder.color + "20" }}
                      >
                        <FolderIcon size={20} style={{ color: folder.color }} />
                      </div>

                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {folder.name}
                          </span>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {folder.quizzes.length} quiz{folder.quizzes.length !== 1 ? "zes" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          Modified {new Date(folder.lastModifiedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddQuizModal(folder.id);
                          }}
                          title="Add Quiz"
                          className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                        >
                          <Plus size={14} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderMenuOpen(
                                folderMenuOpen === folder.id ? null : folder.id
                              );
                            }}
                            className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {folderMenuOpen === folder.id && (
                            <div
                              className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl w-44 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setFolderModal({ open: true, edit: folder });
                                  setFolderMenuOpen(null);
                                }}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <Pencil size={13} className="text-zinc-400" />
                                Rename
                              </button>
                              <Link
                                href={`/teacher/results`}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <BarChart2 size={13} className="text-zinc-400" />
                                Analytics
                              </Link>
                              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                              <button
                                onClick={() => {
                                  setDeleteConfirm({ type: "folder", id: folder.id, name: folder.name });
                                  setFolderMenuOpen(null);
                                }}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 size={13} />
                                Delete Folder
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chevron */}
                      <div className="text-zinc-400 ml-1">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>

                    {/* Folder Contents */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800">
                        {folder.quizzes.length === 0 ? (
                          <div className="p-6 text-center">
                            <p className="text-zinc-400 text-sm mb-3">
                              No quizzes in this folder
                            </p>
                            <button
                              onClick={() => setAddQuizModal(folder.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                            >
                              <Plus size={13} />
                              Add Quizzes
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {folder.quizzes.map((quiz) => (
                              <div
                                key={quiz.id}
                                className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group/quiz"
                              >
                                <FileText
                                  size={14}
                                  className="text-zinc-400 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                    {quiz.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        quiz.status === "Published"
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                      }`}
                                    >
                                      {quiz.status}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                      {quiz.questionCount} questions
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                      {quiz.difficulty}
                                    </span>
                                  </div>
                                </div>

                                {/* Quiz Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover/quiz:opacity-100 transition-opacity">
                                  <Link
                                    href={`/teacher/quizzes/edit/${quiz.id}`}
                                    className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 text-zinc-500 transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil size={12} />
                                  </Link>
                                  <Link
                                    href={`/teacher/results/${quiz.id}`}
                                    className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 text-zinc-500 transition-colors"
                                    title="Analytics"
                                  >
                                    <BarChart2 size={12} />
                                  </Link>

                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setQuizMenuOpen(quizMenuOpen === quiz.id ? null : quiz.id);
                                      }}
                                      className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                                    >
                                      <MoreVertical size={12} />
                                    </button>

                                    {quizMenuOpen === quiz.id && (
                                      <div
                                        className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl w-48 overflow-hidden"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Link
                                          href={`/teacher/quizzes/edit/${quiz.id}`}
                                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        >
                                          <Pencil size={13} className="text-zinc-400" />
                                          Edit Quiz
                                        </Link>
                                        <button
                                          onClick={() => {
                                            publishQuiz(quiz.id);
                                            setQuizMenuOpen(null);
                                          }}
                                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        >
                                          <Globe size={13} className="text-zinc-400" />
                                          {quiz.status === "Published" ? "Unpublish" : "Publish"}
                                        </button>
                                        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                        <button
                                          onClick={() => {
                                            removeQuizFromFolder(folder.id, quiz.id);
                                            setQuizMenuOpen(null);
                                          }}
                                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                        >
                                          <MoveRight size={13} />
                                          Remove from Folder
                                        </button>
                                        <button
                                          onClick={() => {
                                            setDeleteConfirm({
                                              type: "quiz",
                                              id: quiz.id,
                                              folderId: folder.id,
                                              name: quiz.title,
                                            });
                                            setQuizMenuOpen(null);
                                          }}
                                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          <Trash2 size={13} />
                                          Delete Quiz
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Add more quizzes button */}
                            <button
                              onClick={() => setAddQuizModal(folder.id)}
                              className="flex items-center gap-2 w-full px-5 py-3 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                              <Plus size={14} />
                              Add more quizzes
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent Quizzes (not in any folder) */}
      {!search && stats && stats.recentQuizzes.length > 0 && (
        <div>
          <h2 className="font-bold text-base text-zinc-700 dark:text-zinc-300 mb-3">
            Recently Modified Quizzes
          </h2>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {stats.recentQuizzes.map((q) => (
                <div key={q.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <FileText size={14} className="text-zinc-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {q.title}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    q.status === "Published"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {q.status}
                  </span>
                  <Link
                    href={`/teacher/quizzes/edit/${q.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modals ──────────────────────────────────────────────────────────── */}

      {/* Add Quiz Modal */}
      {addQuizModal && (
        <AddQuizModal
          folderId={addQuizModal}
          onClose={() => setAddQuizModal(null)}
          onSuccess={loadData}
        />
      )}

      {/* Create/Edit Folder Modal */}
      {folderModal.open && (
        <FolderModal
          editFolder={folderModal.edit}
          onClose={() => setFolderModal({ open: false })}
          onSuccess={loadData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 w-full max-w-sm shadow-2xl p-6">
            <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-red-500" />
            </div>
            <h3 className="text-center font-bold text-lg text-zinc-900 dark:text-zinc-100">
              {deleteConfirm.type === "folder"
                ? "Delete Folder?"
                : "Delete Quiz?"}
            </h3>
            <p className="text-center text-zinc-400 text-sm mt-2">
              {deleteConfirm.type === "folder"
                ? `"${deleteConfirm.name}" and all its contents will be permanently deleted.`
                : `"${deleteConfirm.name}" will be permanently deleted from your library.`}
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteConfirm.type === "folder"
                    ? deleteFolder(deleteConfirm.id)
                    : deleteQuiz(deleteConfirm.id)
                }
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}