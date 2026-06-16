"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherLiveConsolePage({
  params,
}: {
  params: { sessionId: string };
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/teacher/folders/live-session/${params.sessionId}`);
  }, [router, params.sessionId]);

  return null;
}