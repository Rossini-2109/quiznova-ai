"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherLiveConsolePage({ params }: { params: { sessionCode: string } }) {
  const router = useRouter();
  const { sessionCode } = params;

  useEffect(() => {
    // Redirect to the live-session page which handles the UI
    router.replace(`/teacher/live-session/${sessionCode}`);
  }, [router, sessionCode]);

  return null; // No UI needed as we are redirecting
}
