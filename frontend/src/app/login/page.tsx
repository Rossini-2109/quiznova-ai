"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();

  const login = useAuthStore(
    (state) => state.login
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      const res = await api.post(
        "/auth/login",
        {
          email,
          password,
        }
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

      if (
        res.data.role === "Student"
      ) {
        router.push(
          "/student/dashboard"
        );
      } else if (
        res.data.role === "Teacher"
      ) {
        router.push(
          "/teacher/dashboard"
        );
      } else if (
        res.data.role === "Admin"
      ) {
        router.push(
          "/admin/dashboard"
        );
      }
    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">
        Login
      </h1>

      <form
        onSubmit={handleLogin}
        className="space-y-4"
      >
        <input
          className="border p-2 w-full"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          className="border p-2 w-full"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          type="submit"
          className="bg-black text-white px-4 py-2"
        >
          Login
        </button>
      </form>
    </div>
  );
}