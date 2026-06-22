"use client";
import type { AxiosResponse } from "axios";
import { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
import {
  Folder as FolderIcon,
  FolderPlus,
  BookOpen,
  BarChart2,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Copy,
  MoveRight,
  Eye,
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
  parentFolderId?: string;
}

interface LibraryStats {
  totalQuizzes: number;
  draftQuizzes: number;
  publishedQuizzes: number;
  totalFolders: number;
  totalAttempts: number;
  recentQuizzes: { id: string; title: string; status: string; createdAt: string }[];
}

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

const FOLDER_ICONS = [
  { value: "folder", Icon: FolderIcon },
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
  return match?.Icon ?? FolderIcon;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  color: string;
  sub?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 rounded-2xl p-5 border shadow-sm ${
        active
          ? "bg-indigo-50 border-indigo-500 scale-[1.02] ring-2 ring-indigo-500/20"
          : "bg-white border-zinc-200/65 hover:border-zinc-350 hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          {label}
        </p>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon size={17} color={color} />
        </div>
      </div>
      <p className="text-3xl font-black text-zinc-900">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-zinc-400 mt-1">{sub}</p>
      )}
    </div>
  );
}

function FolderModal({
  editFolder,
  parentFolderId,
  onClose,
  onSuccess,
}: {
  editFolder?: FolderData;
  parentFolderId?: string;
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
        await api.post("/folders", { name, color, icon, parentFolderId });
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
      <div className="bg-white rounded-3xl border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-lg text-zinc-900">
            {editFolder ? "Edit Folder" : parentFolderId ? "New Subfolder" : "New Folder"}
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: color + "25", border: `2px solid ${color}40` }}
            >
              <IconComponent size={26} style={{ color }} />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">
                {name || "Folder Preview"}
              </p>
              <p className="text-xs text-zinc-400">Preview</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-505 uppercase block mb-1.5">
              Folder Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mid Exams, Semester 1..."
              className="w-full px-4 py-3 rounded-xl border bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-505 uppercase block mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={`h-8 w-8 rounded-xl transition-transform ${
                    color === c.value ? "scale-110 ring-2 ring-offset-2 ring-zinc-400" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-505 uppercase block mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_ICONS.map(({ value: iconVal, Icon: IconComp }) => (
                <button
                  key={iconVal}
                  onClick={() => setIcon(iconVal)}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                    icon === iconVal
                      ? "ring-2 ring-indigo-500 bg-indigo-50 text-indigo-600"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  <IconComp size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border text-sm font-semibold hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
          >
            {loading ? "Saving..." : editFolder ? "Save Changes" : parentFolderId ? "Create Subfolder" : "Create Folder"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['Library']);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [unassignedQuizzes, setUnassignedQuizzes] = useState<QuizInFolder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Draft" | "Published">("all");

  const [folderModal, setFolderModal] = useState<{ open: boolean; edit?: FolderData; parentFolderId?: string }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "folder" | "quiz"; id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, foldersRes, quizzesRes] = await Promise.all([
        api.get("/folders/library-stats"),
        api.get("/folders"),
        api.get("/folders/unassigned-quizzes"),
      ]);
      setStats(statsRes.data);
      setFolders(foldersRes.data);
      setUnassignedQuizzes(quizzesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const publishQuiz = async (quizId: string) => {
    await api.put(`/quiz/publish/${quizId}`);
    loadData();
  };

  // Filter root folders
  const rootFolders = folders.filter((f) => !f.parentFolderId);

  // Search quizzes
  const searchResults = search.length > 1
    ? unassignedQuizzes.filter((q) => q.title.toLowerCase().includes(search.toLowerCase()))
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-indigo-800 bg-clip-text text-transparent">
            Quiz Library
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Manage your folders and quizzes
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Quizzes"
            value={stats.totalQuizzes}
            icon={FileText}
            color="#6366f1"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <StatCard
            label="Draft Quizzes"
            value={stats.draftQuizzes}
            icon={Pencil}
            color="#f59e0b"
            active={statusFilter === "Draft"}
            onClick={() => setStatusFilter("Draft")}
            sub="Filter drafts"
          />
          <StatCard
            label="Published"
            value={stats.publishedQuizzes}
            icon={Globe}
            color="#10b981"
            active={statusFilter === "Published"}
            onClick={() => setStatusFilter("Published")}
            sub="Filter published"
          />
          <StatCard label="Folders" value={stats.totalFolders} icon={FolderIcon} color="#8b5cf6" />
          <StatCard label="Total Attempts" value={stats.totalAttempts} icon={BarChart2} color="#3b82f6" />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quizzes..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Search Results */}
      {search.length > 1 && (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="font-bold text-sm">Search Results</h3>
            <span className="text-xs text-zinc-400">{searchResults.length} found</span>
          </div>
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">No quizzes match your search</div>
          ) : (
            <div className="divide-y">
              {searchResults.map((q) => (
                <div key={q.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
                  <FileText size={14} className="text-zinc-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{q.title}</p>
                    <p className="text-xs text-zinc-400">{q.questionCount} questions</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    q.status === "Published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
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

      {/* Main Content */}
      {!search && (
        <div className="space-y-8">
          {/* Folders Section */}
          <div className="space-y-4">
            <h2 className="font-bold text-lg text-zinc-700">Folders</h2>
            {rootFolders.length === 0 ? (
              <div className="bg-white border border-dashed rounded-3xl p-8 text-center text-zinc-450">
                No folders in this directory
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rootFolders.map((folder) => {
                  const CurrentFolderIcon = getFolderIcon(folder.icon);
                  return (
                    <div
                      key={folder.id}
                      onClick={() => router.push(`/teacher/folders/${folder.id}`)}
                      className="cursor-pointer group bg-white/60 backdrop-blur-xl border rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center shadow-inner"
                          style={{ backgroundColor: folder.color + "20" }}
                        >
                          <CurrentFolderIcon size={20} style={{ color: folder.color }} />
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setFolderModal({ open: true, edit: folder })}
                            className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-650"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: "folder", id: folder.id, name: folder.name })}
                            className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-650"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="font-bold text-zinc-800 group-hover:text-indigo-600 transition-colors truncate">
                          {folder.name}
                        </h3>
                        <p className="text-[11px] text-zinc-450 mt-1">
                          {folder.quizCount || folder.quizzes?.length || 0} quizzes
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quizzes Section */}
          <div className="space-y-4">
            <h2 className="font-bold text-lg text-zinc-700">Unassigned Quizzes</h2>
            {unassignedQuizzes.filter(q => statusFilter === "all" || q.status === statusFilter).length === 0 ? (
              <div className="bg-white border border-dashed rounded-3xl p-8 text-center text-zinc-450">
                No unassigned quizzes match this filter
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {unassignedQuizzes.filter(q => statusFilter === "all" || q.status === statusFilter).map((quiz) => (
                  <div
                    key={quiz.id}
                    onClick={() => router.push(`/teacher/quizzes/edit/${quiz.id}`)}
                    className="cursor-pointer group bg-white/60 backdrop-blur-xl border rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="flex items-start justify-between w-full">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          quiz.status === "Published" ? "bg-emerald-100 text-emerald-850" : "bg-amber-100 text-amber-850"
                        }`}
                      >
                        {quiz.status}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDeleteConfirm({ type: "quiz", id: quiz.id, name: quiz.title })}
                          className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-650"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-zinc-800 group-hover:text-indigo-600 transition-colors truncate">
                        {quiz.title}
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">
                        {quiz.questionCount} questions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {folderModal.open && (
        <FolderModal
          editFolder={folderModal.edit}
          parentFolderId={folderModal.parentFolderId}
          onClose={() => setFolderModal({ open: false })}
          onSuccess={loadData}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border w-full max-w-sm shadow-2xl p-6">
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-red-500" />
            </div>
            <h3 className="text-center font-bold text-lg text-zinc-900">
              {deleteConfirm.type === "folder" ? "Delete Folder?" : "Delete Quiz?"}
            </h3>
            <p className="text-center text-zinc-500 text-sm mt-2">
              "{deleteConfirm.name}" will be permanently deleted.
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-zinc-50 transition-colors"
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