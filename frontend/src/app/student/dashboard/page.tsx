"use client";

import AuthGuard from "@/components/AuthGuard";

export default function StudentDashboard() {
  return (
    <AuthGuard>
      <div className="p-6">
        <h1 className="text-3xl font-bold">
          Student Dashboard
        </h1>
      </div>
    </AuthGuard>
  );
}