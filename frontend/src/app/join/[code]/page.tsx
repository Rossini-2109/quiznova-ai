"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  useEffect(() => {
    if (code) {
      router.replace(`/student/lobby/${code}`);
    }
  }, [code, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09041a] to-[#04020a] text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-semibold animate-pulse text-indigo-400">
          Redirecting to your student lobby...
        </p>
      </div>
    </div>
  );
}