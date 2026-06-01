"use client";

import { useState } from "react";
import api from "@/services/api";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Student",
  });

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      await api.post("/auth/register", form);

      alert("Registration successful");
    } catch (error) {
      console.error(error);
      alert("Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">
        Sign Up
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          className="border p-2 w-full"
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
        />

        <input
          type="password"
          className="border p-2 w-full"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
        />

        <select
          className="border p-2 w-full"
          value={form.role}
          onChange={(e) =>
            setForm({
              ...form,
              role: e.target.value,
            })
          }
        >
          <option value="Student">
            Student
          </option>

          <option value="Teacher">
            Teacher
          </option>
        </select>

        <button
          type="submit"
          className="bg-black text-white px-4 py-2"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}