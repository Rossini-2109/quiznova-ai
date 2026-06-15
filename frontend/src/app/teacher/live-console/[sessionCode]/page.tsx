"use client";

import TeacherLiveSessionPage from "@/app/teacher/live-session/[sessionId]/page";
import { use } from "react";

export default function TeacherLiveConsolePage({ params }: { params: Promise<{ sessionCode: string }> }) {
  const { sessionCode } = use(params);
  // Forward the sessionCode as sessionId to the existing live session component
  return <TeacherLiveSessionPage params={Promise.resolve({ sessionId: sessionCode })} />;
}
