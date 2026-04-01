import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

// Use separate localStorage keys for admin and student so both can be logged in simultaneously
function getTokenKey(): string {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/student")) {
    return "student_token";
  }
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/center")) {
    return "center_token";
  }
  return "admin_token";
}

function getUserKey(): string {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/student")) {
    return "student_user";
  }
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/center")) {
    return "center_user";
  }
  return "admin_user";
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const isStudentContext = typeof window !== "undefined" && window.location.pathname.startsWith("/student");
  const isCenterContext = typeof window !== "undefined" && window.location.pathname.startsWith("/center");
  const tokenKey = isStudentContext ? "student_token" : isCenterContext ? "center_token" : "admin_token";
  const token = localStorage.getItem(tokenKey);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isStudentPage = window.location.pathname.startsWith("/student");
      const isCenterPage = window.location.pathname.startsWith("/center");
      if (isStudentPage) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("student_user");
      } else if (isCenterPage) {
        localStorage.removeItem("center_token");
        localStorage.removeItem("center_user");
      } else if (window.location.pathname.startsWith("/admin")) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
      }
      if (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/student") || window.location.pathname.startsWith("/center")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export function getToken() {
  return localStorage.getItem(getTokenKey());
}

export function getUser() {
  const u = localStorage.getItem(getUserKey());
  return u ? JSON.parse(u) : null;
}

export function setAuth(token: string, user: Record<string, unknown>) {
  // Store based on role so admin, student, and center sessions don't conflict
  const role = user.role as string;
  if (role === "student") {
    localStorage.setItem("student_token", token);
    localStorage.setItem("student_user", JSON.stringify(user));
  } else if (role === "center") {
    localStorage.setItem("center_token", token);
    localStorage.setItem("center_user", JSON.stringify(user));
  } else {
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_user", JSON.stringify(user));
  }
}

export function logout() {
  const key = getTokenKey();
  const userKey = getUserKey();
  localStorage.removeItem(key);
  localStorage.removeItem(userKey);
  // Also remove legacy keys
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

export function isAdmin() {
  const user = getUser();
  return user && (user.role === "super_admin" || user.role === "admin" || user.role === "branch_admin");
}

export function isStudent() {
  const user = getUser();
  return user && user.role === "student";
}

export function isCenter() {
  const user = getUser();
  return user && user.role === "center";
}
