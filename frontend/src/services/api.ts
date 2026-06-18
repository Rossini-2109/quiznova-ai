import axios from "axios";

const apiBase =
  (process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://quiznova-ai-grdq.onrender.com")
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

const api = axios.create({
  baseURL: `${apiBase}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers = config.headers || {};
        // @ts-ignore
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

if (process.env.NODE_ENV !== "production") {
  console.log("[api] baseURL:", api.defaults.baseURL);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        "[api] Error",
        error.response.status,
        "on",
        error.config?.url
      );
    } else {
      console.error("[api] Network error", error);
    }

    return Promise.reject(error);
  }
);

export default api;