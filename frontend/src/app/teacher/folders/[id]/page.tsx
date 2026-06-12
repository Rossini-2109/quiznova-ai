"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";

export default function FolderPage() {
  const { id } = useParams();

  const router = useRouter();

  const [folder, setFolder] = useState<any>();
  const [subFolders, setSubFolders] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [newFolder, setNewFolder] = useState("");

  const loadFolder = async () => {
    const res = await api.get(`/folder/${id}`);

    setFolder(res.data.folder);
    setSubFolders(res.data.subFolders);
    setQuizzes(res.data.quizzes);
  };

  useEffect(() => {
    if (id) {
      loadFolder();
    }
  }, [id]);

  const createSubFolder = async () => {
    if (!newFolder.trim()) return;

    const user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    await api.post("/folder", {
      name: newFolder,
      teacherId: user.id,
      parentFolderId: id,
    });

    setNewFolder("");

    loadFolder();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        {folder?.name}
      </h1>
      <div className="grid md:grid-cols-4 gap-5 mb-8">

  <div className="bg-white border rounded-2xl p-5">
    <p>Total Quizzes</p>
    <h2 className="text-3xl font-bold">
      {quizzes.length}
    </h2>
  </div>

  <div className="bg-white border rounded-2xl p-5">
    <p>Subfolders</p>
    <h2 className="text-3xl font-bold">
      {subFolders.length}
    </h2>
  </div>

  <div className="bg-white border rounded-2xl p-5">
    <p>Drafts</p>
    <h2 className="text-3xl font-bold">
      {
        quizzes.filter(
          (q) => q.status === "Draft"
        ).length
      }
    </h2>
  </div>

  <div className="bg-white border rounded-2xl p-5">
    <p>Published</p>
    <h2 className="text-3xl font-bold">
      {
        quizzes.filter(
          (q) => q.status === "Published"
        ).length
      }
    </h2>
  </div>

</div>

      <div className="flex gap-3 mb-8">
        <input
          value={newFolder}
          onChange={(e) =>
            setNewFolder(e.target.value)
          }
          placeholder="Create Subfolder"
          className="border rounded-xl px-4 py-3 flex-1"
        />

        <button
          onClick={createSubFolder}
          className="bg-indigo-600 text-white px-5 rounded-xl"
        >
          Create
        </button>

        <button
          onClick={() =>
            router.push(
              `/teacher/quizzes/create?folderId=${id}`
            )
          }
          className="bg-green-600 text-white px-5 rounded-xl"
        >
          + New Quiz
        </button>
      </div>

      <h2 className="font-bold text-xl mb-4">
        Subfolders
      </h2>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {subFolders.map((folder) => (
          <div
            key={folder.id}
            onClick={() =>
              router.push(
                `/teacher/folders/${folder.id}`
              )
            }
            className="border rounded-xl p-4 cursor-pointer"
          >
            📁 {folder.name}
          </div>
        ))}
      </div>

      <h2 className="font-bold text-xl mb-4">
        Quizzes
      </h2>

      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            onClick={() =>
              router.push(
                `/teacher/quizzes/edit/${quiz.id}`
              )
            }
            className="border rounded-xl p-4 cursor-pointer hover:bg-gray-50"
          >
            📝 {quiz.title}
          </div>
        ))}
      </div>
    </div>
  );
}