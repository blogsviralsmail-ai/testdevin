import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/api/auth/login', data),
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => api.post('/api/auth/register', data),
  verifyEmail: (data: { email: string; otp: string }) => api.post('/api/auth/verify-email', data),
  forgotPassword: (data: { email: string }) => api.post('/api/auth/forgot-password', data),
  resetPassword: (data: { token: string; password: string }) => api.post('/api/auth/reset-password', data),
  getMe: () => api.get('/api/auth/me'),
  updatePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/api/auth/update-password', data),
  updateUsername: (data: { firstName?: string; lastName?: string }) => api.post('/api/auth/update-username', data),
  updateDetails: (data: { phone?: string; address?: Record<string, string> }) => api.put('/api/auth/update-user-details', data),
};

// Public
export const publicAPI = {
  getSettings: () => api.get('/api/public/settings'),
  getProducts: () => api.get('/api/public/products'),
  submitContact: (data: { name: string; email: string; message: string }) => api.post('/api/public/contact', data),
};

// Slots
export const slotsAPI = {
  getAll: () => api.get('/api/slots'),
  getOne: (id: string) => api.get(`/api/slots/${id}`),
  create: (data: { name: string; platform: string; streamKey: string; rtmpUrl?: string }) => api.post('/api/slots', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/slots/${id}`, data),
  delete: (id: string) => api.delete(`/api/slots/${id}`),
  startStream: (id: string) => api.post(`/api/slots/${id}/stream`),
  stopStream: (id: string) => api.post(`/api/slots/${id}/stop`),
  getStatus: (id: string) => api.get(`/api/slots/${id}/status`),
  uploadThumbnail: (id: string, formData: FormData) => api.post(`/api/slots/${id}/thumbnail`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Videos
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk (fast upload per chunk, smooth progress)

export const videosAPI = {
  getAll: () => api.get('/api/videos'),
  getOne: (id: string) => api.get(`/api/videos/${id}`),
  getUploadUrl: (fileName: string) => api.get(`/api/videos/upload-url?fileName=${fileName}`),
  confirmUpload: (data: { fileName: string; fileSize: number; s3Key: string }) => api.post('/api/videos/confirm-upload', data),
  uploadLocal: (formData: FormData, onProgress?: (progress: number) => void) => {
    return api.post('/api/videos/upload-local', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000, // 10 minutes for large files
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },
  uploadChunked: async (file: File, onProgress?: (progress: number) => void) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    let lastResponse = null;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const fd = new FormData();
      fd.append('file', chunk, `chunk_${i}`);
      fd.append('uploadId', uploadId);
      fd.append('chunkIndex', i.toString());
      fd.append('totalChunks', totalChunks.toString());
      fd.append('fileName', file.name);

      lastResponse = await api.post('/api/videos/upload-chunk', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 min per chunk
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            const chunkProgress = e.loaded / e.total;
            const overallProgress = ((i + chunkProgress) / totalChunks) * 100;
            onProgress(Math.round(overallProgress));
          }
        },
      });
    }
    return lastResponse;
  },
  update: (id: string, data: { name: string }) => api.patch(`/api/videos/${id}`, data),
  rename: (id: string, name: string) => api.patch(`/api/videos/${id}`, { name }),
  delete: (id: string) => api.delete(`/api/videos/${id}`),
};

// YouTube
export const youtubeAPI = {
  getAuthUrl: () => api.get('/api/youtube/auth-url'),
  getStatus: () => api.get('/api/youtube/status'),
  disconnect: () => api.post('/api/youtube/disconnect'),
};

// Orders
export const ordersAPI = {
  create: (data: Record<string, unknown>) => api.post('/api/orders', data),
  getAll: () => api.get('/api/orders'),
  getOne: (id: string) => api.get(`/api/orders/${id}`),
  verify: (id: string) => api.post(`/api/orders/${id}/verify`),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getUsers: (params?: Record<string, unknown>) => api.get('/api/admin/users', { params }),
  getUser: (id: string) => api.get(`/api/admin/users/${id}`),
  updateUser: (id: string, data: Record<string, unknown>) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),
  getSlots: (params?: Record<string, unknown>) => api.get('/api/admin/slots', { params }),
  deleteSlot: (id: string) => api.delete(`/api/admin/slots/${id}`),
  forceStopSlot: (id: string) => api.post(`/api/admin/slots/${id}/force-stop`),
  extendSlot: (id: string, days: number) => api.put(`/api/admin/slots/${id}/extend?days=${days}`),
  deleteVideo: (id: string) => api.delete(`/api/admin/videos/${id}`),
  getVideos: (params?: Record<string, unknown>) => api.get('/api/admin/videos', { params }),
  getOrders: (params?: Record<string, unknown>) => api.get('/api/admin/orders', { params }),
  updateOrderStatus: (id: string, status: string) => api.put(`/api/admin/orders/${id}/status?new_status=${status}`),
  getProducts: () => api.get('/api/admin/products'),
  createProduct: (data: Record<string, unknown>) => api.post('/api/admin/products', data),
  updateProduct: (id: string, data: Record<string, unknown>) => api.put(`/api/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/api/admin/products/${id}`),
  getSettings: () => api.get('/api/admin/settings'),
  updateSettings: (data: Record<string, unknown>) => api.put('/api/admin/settings', data),
  getContacts: (params?: Record<string, unknown>) => api.get('/api/admin/contacts', { params }),
  deleteContact: (id: string) => api.delete(`/api/admin/contacts/${id}`),
  updateContactStatus: (id: string, status: string) => api.put(`/api/admin/contacts/${id}/status?new_status=${status}`),
  getAnalytics: (period?: string) => api.get('/api/admin/analytics', { params: { period } }),
};

export default api;
