import axios from "axios";

const base = process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, "") : "https://quiznova-ai-grdq.onrender.com";
const api = axios.create({
  baseURL: `${base}/api`,
});

if (process.env.NODE_ENV !== "production") {
  console.log("[api] baseURL:", api.defaults.baseURL);
}

api.interceptors.response.use((response) => response, (error) => {
  if (error.response) {
    console.error('[api] Error', error.response.status, 'on', error.config?.url);
  } else {
    console.error('[api] Network error', error);
  }
  return Promise.reject(error);
});

export default api;