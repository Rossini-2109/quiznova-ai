"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { Lock, Mail, ArrowRight, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      setLoading(true);
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        })
      );

      login(
        {
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        },
        res.data.token
      );

      if (res.data.role === "Student") {
        router.push("/student/join");
      } else if (res.data.role === "Teacher") {
        router.push("/teacher/dashboard");
      } else {
        alert("Invalid role");
      }
    } catch (error: any) {
      console.error(error);
      if (error.response) {
        alert(
          typeof error.response.data === "string"
            ? error.response.data
            : error.response.data?.message || "Login failed"
        );
      } else {
        alert("Server not reachable");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      alert("Please enter your email address");
      return;
    }

    try {
      setForgotLoading(true);
      setForgotMessage("");
      
      const normalizedEmail = forgotEmail.trim().toLowerCase();
      const user = await api.get(`/auth/user-by-email?email=${encodeURIComponent(normalizedEmail)}`);
      
      if (user.data) {
        alert("If an account exists with this email, a password reset link has been sent. Please check your inbox.");
      } else {
        alert("If an account exists with this email, a password reset link has been sent. Please check your inbox.");
      }
      
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (error: any) {
      console.error(error);
      alert("If an account exists with this email, a password reset link has been sent.");
      setShowForgotPassword(false);
      setForgotEmail("");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-950/20 via-zinc-950 to-zinc-950 -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[100px] -z-10" />

      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative">
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-cyan-500 flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-violet-500/20 mb-4">
            Q
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Access your QuizNova AI platform dashboard
          </p>
        </div>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-zinc-500" size={18} />
              <input
                type="email"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-600 text-sm"
                placeholder="Enter your email address"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>

            {forgotMessage && (
              <p className="text-sm text-emerald-400 text-center">{forgotMessage}</p>
            )}

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2 group cursor-pointer"
            >
              {forgotLoading ? <LoadingSpinner /> : "Send Reset Link"}
              {!forgotLoading && <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-zinc-500" size={18} />
              <input
                type="email"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-600 text-sm"
                placeholder="name@institution.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-zinc-500" size={18} />
              <input
                type="password"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-600 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors flex items-center gap-1"
              >
                <KeyRound size={12} />
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? <LoadingSpinner /> : "Sign In"}
              {!loading && <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-zinc-500 border-t border-zinc-800/60 pt-6">
          New to QuizNova?{" "}
          <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-semibold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
