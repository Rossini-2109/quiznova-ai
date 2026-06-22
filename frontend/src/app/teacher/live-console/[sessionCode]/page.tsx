"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";

export default function TeacherLiveConsolePage({
  params,
}: {
  params: Promise<{ sessionCode: string }>;
}) {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSessionCode(p.sessionCode));
  }, [params]);

  useEffect(() => {
    if (!sessionCode) return;
    router.replace(`/teacher/live/${sessionCode.split("?")[0]}`);
  }, [router, sessionCode]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-zinc-500">Redirecting to live session...</p>
    </div>
  );
}
