"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { User, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Student",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;

    try {
      setLoading(true);
      await api.post("/auth/register", form);
      alert("Registration successful! Please login.");
      router.push("/login");
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        error.response?.data ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-zinc-950 to-zinc-950 -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px] -z-10" />

      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative">
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-indigo-500/20 mb-4">
            Q
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Get started with AI-driven learning
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-zinc-500" size={18} />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-600 text-sm"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-zinc-500" size={18} />
            <input
              type="email"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-600 text-sm"
              placeholder="name@institution.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-zinc-500" size={18} />
            <input
              type="password"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-600 text-sm"
              placeholder="Create Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Sparkles className="absolute left-4 top-3.5 text-zinc-500" size={18} />
            <select
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="Student">Student account</option>
              <option value="Teacher">Teacher account</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2 group cursor-pointer"
          >
            {loading ? <LoadingSpinner /> : "Register"}
            {!loading && <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-500 border-t border-zinc-800/60 pt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}