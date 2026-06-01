"use client";

import AuthGuard from "@/components/AuthGuard";

export default function AdminDashboard() {
  return (
    <AuthGuard>
      <div className="p-6">
        <h1 className="text-3xl font-bold">
          Admin Dashboard
        </h1>
      </div>
    </AuthGuard>
  );
}