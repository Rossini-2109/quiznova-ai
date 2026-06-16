"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Legacy route redirect for `/teacher/folders/live-session/[sessionId]`.
 * The live‑session page now lives at `/teacher/live-session/[sessionId]`.
 * This component redirects automatically to the new location using the client‑side `useParams` hook.
 */
export default function LegacyLiveSessionRedirect() {
  const router = useRouter();
  const { sessionId } = useParams();

  useEffect(() => {
    if (sessionId) {
      router.replace(`/teacher/live-session/${sessionId}`);
    }
  }, [router, sessionId]);

  return null;
}
