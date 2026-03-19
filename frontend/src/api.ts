const API_URL = import.meta.env.VITE_API_URL || "";

function getBaseUrl(): string {
  if (API_URL) return API_URL;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return "";
}

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${endpoint}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// Gold Rate
export const getGoldRate = () => fetchAPI("/api/gold-rate");
export const getGoldRateHistory = (days = 30) => fetchAPI(`/api/gold-rate/history?days=${days}`);

// Categories
export const getCategories = () => fetchAPI("/api/categories");
export const getCategory = (slug: string) => fetchAPI(`/api/categories/${slug}`);

// Designs
export const getDesigns = (page = 1, limit = 12, category?: string) => {
  let url = `/api/designs?page=${page}&limit=${limit}`;
  if (category) url += `&category=${category}`;
  return fetchAPI(url);
};
export const getFeaturedDesigns = () => fetchAPI("/api/designs/featured");
export const getPopularDesigns = () => fetchAPI("/api/designs/popular");
export const getDesign = (slug: string) => fetchAPI(`/api/designs/${slug}`);

// Blogs
export const getBlogs = (page = 1, limit = 10) => fetchAPI(`/api/blogs?page=${page}&limit=${limit}`);
export const getRecentBlogs = () => fetchAPI("/api/blogs/recent");
export const getBlog = (slug: string) => fetchAPI(`/api/blogs/${slug}`);

// Admin
export const adminLogin = (username: string, password: string) =>
  fetchAPI("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

export const getDashboard = (token: string) =>
  fetchAPI("/api/admin/dashboard", { headers: authHeaders(token) });

export const getSettings = () => fetchAPI("/api/admin/settings/public");

// Admin CRUD
export const adminCreateCategory = (token: string, data: Record<string, unknown>) =>
  fetchAPI("/api/categories", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });

export const adminUpdateCategory = (token: string, id: number, data: Record<string, unknown>) =>
  fetchAPI(`/api/categories/${id}`, { method: "PUT", headers: authHeaders(token), body: JSON.stringify(data) });

export const adminDeleteCategory = (token: string, id: number) =>
  fetchAPI(`/api/categories/${id}`, { method: "DELETE", headers: authHeaders(token) });

export const adminCreateDesign = (token: string, data: Record<string, unknown>) =>
  fetchAPI("/api/designs", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });

export const adminUpdateDesign = (token: string, id: number, data: Record<string, unknown>) =>
  fetchAPI(`/api/designs/${id}`, { method: "PUT", headers: authHeaders(token), body: JSON.stringify(data) });

export const adminDeleteDesign = (token: string, id: number) =>
  fetchAPI(`/api/designs/${id}`, { method: "DELETE", headers: authHeaders(token) });

export const adminCreateBlog = (token: string, data: Record<string, unknown>) =>
  fetchAPI("/api/blogs", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });

export const adminUpdateBlog = (token: string, id: number, data: Record<string, unknown>) =>
  fetchAPI(`/api/blogs/${id}`, { method: "PUT", headers: authHeaders(token), body: JSON.stringify(data) });

export const adminDeleteBlog = (token: string, id: number) =>
  fetchAPI(`/api/blogs/${id}`, { method: "DELETE", headers: authHeaders(token) });

export const adminGetCategories = (token: string) =>
  fetchAPI("/api/categories", { headers: authHeaders(token) });

export const adminGetDesigns = (token: string, page = 1, limit = 50) =>
  fetchAPI(`/api/designs?page=${page}&limit=${limit}`, { headers: authHeaders(token) });

export const adminGetBlogs = (token: string, page = 1, limit = 50) =>
  fetchAPI(`/api/blogs?page=${page}&limit=${limit}`, { headers: authHeaders(token) });
