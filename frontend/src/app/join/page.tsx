"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/services/api";
import { Compass, KeyRound, AlertCircle, RefreshCw } from "lucide-react";

function JoinContent() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qp = searchParams.get("quizCode");

    if (qp) {
      setCode(qp);
    }
  }, [searchParams]);

  const handleJoin = async () => {
    const joinCode = code.trim();

    if (!joinCode) {
      setError("Please enter a valid quiz join code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/quiz/code/${joinCode}`);

      const sessionCode = res.data.sessionCode ?? joinCode;

      router.push(`/student/lobby/${sessionCode}`);
    } catch (err) {
      console.error(err);
      setError("Quiz not found. Double-check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      {/* Keep your existing JSX here */}
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinContent />
    </Suspense>
  );
}