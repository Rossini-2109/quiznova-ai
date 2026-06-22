"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";
import {
  Folder as FolderIcon,
  FolderPlus,
  BookOpen,
  BookMarked,
  Star,
  Archive,
  Globe,
  Layers,
  Zap,
  Hash,
  Layout,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  ArrowLeft,
  Plus
} from "lucide-react";
import QuizDetailsModal, { type QuizDetail } from "@/components/library/QuizDetailsModal";
import AddQuizToFolderModal from "@/components/library/AddQuizToFolderModal";

interface QuizInFolder {
  id: string;
  title: string;
  description: string;
  status: string;
  difficulty: string;
  questionCount: number;
  createdAt: string;
}

interface FolderData {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  lastModifiedAt: string;
  quizCount?: number;
  quizzes?: QuizInFolder[];
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
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200">
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
              <p className="font-semibold text-zinc-900">{name || "Folder Preview"}</p>
              <p className="text-xs text-zinc-400">Preview</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-505 uppercase block mb-1.5">Folder Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mid Exams, Semester 1..."
              className="w-full px-4 py-3 rounded-xl border bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-505 uppercase block mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`h-8 w-8 rounded-xl transition-transform ${color === c.value ? "scale-110 ring-2 ring-offset-2 ring-zinc-400" : "hover:scale-105"}`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-505 uppercase block mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_ICONS.map(({ value: iconVal, Icon: IconComp }) => (
                <button
                  key={iconVal}
                  onClick={() => setIcon(iconVal)}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${icon === iconVal ? "ring-2 ring-indigo-500 bg-indigo-50 text-indigo-600" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
                >
                  <IconComp size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border text-sm font-semibold hover:bg-zinc-50">Cancel</button>
          <button
            onClick={submit}
            disabled={!name.trim() || loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700"
          >
            {loading ? "Saving..." : editFolder ? "Save Changes" : "Create Folder"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FolderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [folder, setFolder] = useState<FolderData | null>(null);
  const [subFolders, setSubFolders] = useState<FolderData[]>([]);
  const [quizzes, setQuizzes] = useState<QuizInFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const [folderModal, setFolderModal] = useState<{ open: boolean; edit?: FolderData; parentFolderId?: string }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "folder" | "quiz"; id: string; name: string } | null>(null);
  const [addQuizOpen, setAddQuizOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDetail | null>(null);

  const loadFolder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/folder/${id}`);
      setFolder(res.data.folder);
      setSubFolders(res.data.subFolders || []);
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadFolder();
  }, [id, loadFolder]);

  const deleteFolder = async (folderId: string) => {
    await api.delete(`/folders/${folderId}`);
    setDeleteConfirm(null);
    loadFolder();
  };

  const deleteQuiz = async (quizId: string) => {
    await api.delete(`/quiz/${quizId}`);
    setDeleteConfirm(null);
    loadFolder();
  };

  const removeQuizFromFolder = async (quizId: string) => {
    await api.post(`/folders/${id}/remove-quiz/${quizId}`);
    setSelectedQuiz(null);
    loadFolder();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 animate-pulse" />
          <p className="text-zinc-400 text-sm">Loading folder...</p>
        </div>
      </div>
    );
  }

  if (!folder) return <div>Folder not found</div>;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 w-10 bg-white border rounded-full flex items-center justify-center hover:bg-zinc-50 shadow-sm">
            <ArrowLeft size={16} className="text-zinc-500" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2">
              {folder.name}
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">
              {subFolders.length} Subfolders • {quizzes.length} Quizzes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFolderModal({ open: true, parentFolderId: folder.id })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border text-zinc-700 text-sm font-semibold hover:bg-zinc-50 active:scale-95 transition-all shadow-sm"
          >
            <FolderPlus size={16} />
            New Subfolder
          </button>
          <button
            onClick={() => setAddQuizOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-500/20"
          >
            <Plus size={16} />
            Add Quiz
          </button>
        </div>
      </div>

      {/* Subfolders Section */}
      <div className="space-y-4 mt-8">
        <h2 className="font-bold text-lg text-zinc-700">Subfolders</h2>
        {subFolders.length === 0 ? (
          <div className="bg-white border border-dashed rounded-3xl p-8 text-center text-zinc-450 text-sm">
            No subfolders
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {subFolders.map((subF) => {
              const CurrentFolderIcon = getFolderIcon(subF.icon || "folder");
              const fColor = subF.color || "#6366f1";
              return (
                <div
                  key={subF.id}
                  onClick={() => router.push(`/teacher/folders/${subF.id}`)}
                  className="cursor-pointer group bg-white/60 backdrop-blur-xl border rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[140px]"
                >
                  <div className="flex items-start justify-between w-full">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shadow-inner"
                      style={{ backgroundColor: fColor + "20" }}
                    >
                      <CurrentFolderIcon size={20} style={{ color: fColor }} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setFolderModal({ open: true, edit: subF })}
                        className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-650"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: "folder", id: subF.id, name: subF.name })}
                        className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-650"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-bold text-zinc-800 group-hover:text-indigo-600 transition-colors truncate">
                      {subF.name}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quizzes Section */}
      <div className="space-y-4">
        <h2 className="font-bold text-lg text-zinc-700">Quizzes</h2>
        {quizzes.length === 0 ? (
          <div className="bg-white border border-dashed rounded-3xl p-8 text-center text-zinc-450 text-sm">
            No quizzes in this folder
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => setSelectedQuiz({ ...quiz, folderId: folder.id })}
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
                    {quiz.questionCount || 0} questions
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Quiz Modal */}
      {addQuizOpen && (
        <AddQuizToFolderModal
          folderId={folder.id}
          folderName={folder.name}
          onClose={() => setAddQuizOpen(false)}
          onSuccess={loadFolder}
        />
      )}

      {/* Quiz Details Modal */}
      {selectedQuiz && (
        <QuizDetailsModal
          quiz={selectedQuiz}
          folderName={folder.name}
          onClose={() => setSelectedQuiz(null)}
          onEdit={(qid) => router.push(`/teacher/quizzes/edit/${qid}`)}
          onHost={(qid) => router.push(`/teacher/quizzes/lobby/${qid}/host`)}
          onRemoveFromFolder={removeQuizFromFolder}
        />
      )}

      {/* Folder Modal */}
      {folderModal.open && (
        <FolderModal
          editFolder={folderModal.edit}
          parentFolderId={folderModal.parentFolderId}
          onClose={() => setFolderModal({ open: false })}
          onSuccess={loadFolder}
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
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-zinc-50">Cancel</button>
              <button
                onClick={() => deleteConfirm.type === "folder" ? deleteFolder(deleteConfirm.id) : deleteQuiz(deleteConfirm.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
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