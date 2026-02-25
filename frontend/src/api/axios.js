import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Automatically attach JWT
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const orgId = localStorage.getItem("org_id") || "1";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Multi-tenancy context header
  config.headers["X-Organization-ID"] = orgId;

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
