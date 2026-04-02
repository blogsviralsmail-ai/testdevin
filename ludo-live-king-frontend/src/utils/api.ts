const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
  baseUrl: API_URL,

  getHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  },

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  },

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  },
};
