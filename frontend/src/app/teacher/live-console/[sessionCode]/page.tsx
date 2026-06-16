"use client";

import TeacherLiveSessionPage from "@/app/teacher/live-session/[sessionId]/page";

export default function TeacherLiveConsolePage({ params }: { params: { sessionCode: string } }) {
  const { sessionCode } = params;
  return <TeacherLiveSessionPage sessionId={sessionCode} />;
}
