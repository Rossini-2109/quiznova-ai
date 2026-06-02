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
      console.log("Sending login request...");

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("Login success:");
      console.log(res.data);

      localStorage.setItem(
  "token",
  res.data.token
);

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

      if (
        res.data.role === "Student"||
  res.data.role === "User"
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
    } catch (error: any) {
      console.error(error);

      if (error.response) {
        console.log(error.response.data);

        alert(
          typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data)
        );
      } else {
        alert("Server not reachable");
      }
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