"use client";

import TeacherLiveSessionPage from "@/components/TeacherLiveSessionPage";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();

  return (
    <TeacherLiveSessionPage
      sessionId={params.sessionId as string}
    />
  );
}