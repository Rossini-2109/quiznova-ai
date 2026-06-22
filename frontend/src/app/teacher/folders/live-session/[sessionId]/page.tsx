"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";

/**
 * Legacy route: resolves session UUID and redirects to the live host dashboard.
 */
export default function LegacyLiveSessionRedirect() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const resolveSession = async () => {
      try {
        const res = await api.get(`/LiveQuiz/by-id/${sessionId}`);
        const sessionCode =
          res.data?.session?.sessionCode ?? res.data?.state?.sessionCode;

        if (!sessionCode) {
          setError("Session not found.");
          return;
        }

        router.replace(`/teacher/live/${sessionCode}`);
      } catch (err) {
        console.error("Failed to load session:", err);
        setError("Could not load live session.");
      }
    };

    resolveSession();
  }, [router, sessionId]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-center text-zinc-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-zinc-500">Redirecting to live session...</p>
    </div>
  );
}
