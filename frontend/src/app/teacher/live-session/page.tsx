"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Base route `/teacher/live-session`.
 * If a `code` query param is present, redirect to the dynamic page
 * that displays the QR code, join link and quiz code.
 */
export default function TeacherLiveSessionRedirect() {
  const router = useRouter();
  const search = useSearchParams();
  const code = search?.get("code");

  useEffect(() => {
    if (code) {
      router.replace(`/teacher/live-session/${code}`);
    }
  }, [code, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#09041a] to-[#04020a] text-white p-6">
      <p className="text-center">
        {code ? "Redirecting to session..." : "No session code provided. Append ?code=YOUR_SESSION_CODE to the URL."}
      </p>
    </div>
  );
}
