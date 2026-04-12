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

// Coupons
export const couponsAPI = {
  validate: (code: string, orderAmount: number) => api.post(`/api/coupons/validate?code=${code}&order_amount=${orderAmount}`),
  apply: (code: string, orderId: string) => api.post(`/api/coupons/apply?code=${code}&order_id=${orderId}`),
  adminList: (params?: Record<string, unknown>) => api.get('/api/coupons/admin', { params }),
  adminCreate: (data: Record<string, unknown>) => api.post('/api/coupons/admin', data),
  adminUpdate: (id: string, data: Record<string, unknown>) => api.put(`/api/coupons/admin/${id}`, data),
  adminDelete: (id: string) => api.delete(`/api/coupons/admin/${id}`),
};

// Invoices
export const invoicesAPI = {
  get: (orderId: string) => api.get(`/api/invoices/${orderId}`),
  download: (orderId: string) => api.get(`/api/invoices/${orderId}/download`, { responseType: 'blob' }),
};

// Affiliates
export const affiliatesAPI = {
  getMyReferral: () => api.get('/api/affiliates/my-referral'),
  getMyEarnings: () => api.get('/api/affiliates/my-earnings'),
  getMyReferrals: () => api.get('/api/affiliates/my-referrals'),
  adminStats: () => api.get('/api/affiliates/admin/stats'),
  adminEarnings: () => api.get('/api/affiliates/admin/earnings'),
  adminMarkPaid: (id: string) => api.post(`/api/affiliates/admin/earnings/${id}/pay`),
  adminUpdateSettings: (data: Record<string, unknown>) => api.put('/api/affiliates/admin/settings', data),
};

// Webhooks
export const webhooksAPI = {
  getAll: () => api.get('/api/webhooks'),
  create: (data: Record<string, unknown>) => api.post('/api/webhooks', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/webhooks/${id}`, data),
  delete: (id: string) => api.delete(`/api/webhooks/${id}`),
  getLogs: (params?: Record<string, unknown>) => api.get('/api/webhooks/logs', { params }),
};

// Notifications
export const notificationsAPI = {
  getSettings: () => api.get('/api/notifications/settings'),
  updateSettings: (data: Record<string, unknown>) => api.put('/api/notifications/settings', data),
  getHistory: (params?: Record<string, unknown>) => api.get('/api/notifications/history', { params }),
  markRead: (id: string) => api.put(`/api/notifications/read/${id}`),
  markAllRead: () => api.put('/api/notifications/read-all'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
};

// Analytics
export const analyticsAPI = {
  getStreamStats: () => api.get('/api/analytics/stream-stats'),
  getStreamHealth: (slotId: string) => api.get(`/api/analytics/stream-health/${slotId}`),
  getActivityLogs: (params?: Record<string, unknown>) => api.get('/api/analytics/activity-logs', { params }),
  adminOverview: (period?: string) => api.get('/api/analytics/admin/overview', { params: { period } }),
};

// Advanced Streaming
export const streamingAPI = {
  youtubeUrl: (data: { slotId: string; url: string; loop?: boolean }) => api.post('/api/streaming/youtube-url', data),
  extractYoutubeInfo: (url: string) => api.post(`/api/streaming/youtube-url/extract?url=${encodeURIComponent(url)}`),
  multiStream: (data: Record<string, unknown>) => api.post('/api/streaming/multi-stream', data),
  stopMultiStream: (streamIds: string[]) => api.post('/api/streaming/multi-stream/stop', streamIds),
  playlistQueue: (data: { slotId: string; videoIds: string[] }) => api.post('/api/streaming/playlist-queue', data),
  scheduledPlaylist: (data: Record<string, unknown>) => api.post('/api/streaming/scheduled-playlist', data),
  uploadOverlay: (slotId: string, formData: FormData) => api.post(`/api/streaming/overlay/${slotId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeOverlay: (slotId: string) => api.delete(`/api/streaming/overlay/${slotId}`),
  startRecording: (slotId: string) => api.post(`/api/streaming/record/${slotId}/start`),
  stopRecording: (slotId: string) => api.post(`/api/streaming/record/${slotId}/stop`),
  multiBitrate: (data: Record<string, unknown>) => api.post('/api/streaming/multi-bitrate', data),
  getPreview: (slotId: string) => api.get(`/api/streaming/preview/${slotId}`),
  restream: (data: Record<string, unknown>) => api.post('/api/streaming/restream', data),
  cloudStream: (data: Record<string, unknown>) => api.post('/api/streaming/cloud-stream', data),
};

// Social Platforms
export const socialAPI = {
  facebookAuthUrl: () => api.get('/api/social/facebook/auth-url'),
  facebookCallback: (code: string) => api.post(`/api/social/facebook/callback?code=${code}`),
  facebookStatus: () => api.get('/api/social/facebook/status'),
  facebookDisconnect: () => api.post('/api/social/facebook/disconnect'),
  facebookGoLive: (pageId: string, title: string) => api.post(`/api/social/facebook/go-live?page_id=${pageId}&title=${encodeURIComponent(title)}`),
  instagramAuthUrl: () => api.get('/api/social/instagram/auth-url'),
  instagramStatus: () => api.get('/api/social/instagram/status'),
  instagramDisconnect: () => api.post('/api/social/instagram/disconnect'),
  adminGetConfig: () => api.get('/api/social/admin/config'),
  adminUpdateConfig: (data: Record<string, unknown>) => api.put('/api/social/admin/config', data),
};

// Reseller
export const resellerAPI = {
  getDashboard: () => api.get('/api/reseller/dashboard'),
  getClients: (params?: Record<string, unknown>) => api.get('/api/reseller/clients', { params }),
  createClient: (data: Record<string, unknown>) => api.post('/api/reseller/clients', data),
  updateClientStatus: (id: string, status: string) => api.put(`/api/reseller/clients/${id}/status?status=${status}`),
  deleteClient: (id: string) => api.delete(`/api/reseller/clients/${id}`),
  adminCreateReseller: (data: Record<string, unknown>) => api.post('/api/reseller/admin/create', data),
  adminListResellers: () => api.get('/api/reseller/admin/list'),
  adminRemoveReseller: (id: string) => api.delete(`/api/reseller/admin/${id}`),
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
