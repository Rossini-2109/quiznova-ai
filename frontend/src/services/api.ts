import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5103/api",
});

export default api;