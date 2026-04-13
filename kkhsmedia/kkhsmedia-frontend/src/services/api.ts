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
  create: (data: { name: string; platform: string; streamKey: string; rtmpUrl?: string; resolution?: string; sourceType?: string; sourceUrl?: string; videoId?: string; scheduledStart?: string; scheduledEnd?: string; streamUrl?: string }) => api.post('/api/slots', data),
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
  adminList: (params?: Record<string, unknown>) => api.get('/api/coupons/admin/list', { params }),
  adminCreate: (data: Record<string, unknown>) => api.post('/api/coupons/admin/create', data),
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
  adminMarkPaid: (id: string) => api.put(`/api/affiliates/admin/earnings/${id}/pay`),
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

// Bulk Operations
export const bulkAPI = {
  start: (slotIds: string[]) => api.post('/api/bulk/start', { slotIds }),
  stop: (slotIds: string[]) => api.post('/api/bulk/stop', { slotIds }),
  assignVideo: (slotIds: string[], videoId: string) => api.post('/api/bulk/assign-video', { slotIds, videoId }),
  delete: (slotIds: string[]) => api.post('/api/bulk/delete', { slotIds }),
  getApiKey: () => api.get('/api/bulk/api-key'),
  regenerateApiKey: () => api.post('/api/bulk/api-key/regenerate'),
  getApiDocs: () => api.get('/api/bulk/api-docs'),
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
  uploadLogo: (formData: FormData) => api.post('/api/admin/upload-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getContacts: (params?: Record<string, unknown>) => api.get('/api/admin/contacts', { params }),
  deleteContact: (id: string) => api.delete(`/api/admin/contacts/${id}`),
  updateContactStatus: (id: string, status: string) => api.put(`/api/admin/contacts/${id}/status?new_status=${status}`),
  getAnalytics: (period?: string) => api.get('/api/admin/analytics', { params: { period } }),
  assignPlan: (data: Record<string, unknown>) => api.post('/api/admin/assign-plan', data),
  getUserPlan: (userId: string) => api.get(`/api/admin/users/${userId}/plan`),
  createUser: (data: Record<string, unknown>) => api.post('/api/admin/create-user', data),
  getRoles: () => api.get('/api/admin/roles'),
  updateUserRole: (userId: string, role: string) => api.put(`/api/admin/users/${userId}/role?role=${role}`),
  resetUserPassword: (userId: string, newPassword: string) => api.put(`/api/admin/users/${userId}/reset-password?new_password=${newPassword}`),
};

// Stream Health
export const healthAPI = {
  getSystem: () => api.get('/api/health/system'),
  getStreamHealth: (slotId: string) => api.get(`/api/health/stream/${slotId}`),
  adminOverview: () => api.get('/api/health/admin/overview'),
  saveSnapshot: (slotId: string, data: Record<string, number>) => api.post(`/api/health/snapshot/${slotId}`, null, { params: data }),
};

// 2FA
export const twoFactorAPI = {
  setup: () => api.post('/api/2fa/setup'),
  verifySetup: (data: { code: string }) => api.post('/api/2fa/verify-setup', data),
  verify: (data: { code: string }) => api.post('/api/2fa/verify', data),
  disable: (data: { code: string }) => api.post('/api/2fa/disable', data),
  getStatus: () => api.get('/api/2fa/status'),
};

// i18n
export const i18nAPI = {
  getTranslations: (lang: string) => api.get(`/api/i18n/translations/${lang}`),
  getLanguages: () => api.get('/api/i18n/languages'),
  setUserLanguage: (lang: string) => api.put(`/api/i18n/user/language?language=${lang}`),
};

// Thumbnails
export const thumbnailsAPI = {
  generate: (data: Record<string, unknown>) => api.post('/api/thumbnails/generate', data),
  generateGrid: (data: Record<string, unknown>) => api.post('/api/thumbnails/generate-grid', data),
  textOverlay: (data: Record<string, unknown>) => api.post('/api/thumbnails/text-overlay', data),
  getAll: () => api.get('/api/thumbnails'),
  delete: (id: string) => api.delete(`/api/thumbnails/${id}`),
};

// Chat Overlay & Watermark
export const overlayAPI = {
  getChatConfig: (slotId: string) => api.get(`/api/overlay/chat/${slotId}`),
  updateChatConfig: (data: Record<string, unknown>) => api.put('/api/overlay/chat', data),
  addChatMessage: (data: Record<string, unknown>) => api.post('/api/overlay/chat/message', data),
  getChatMessages: (slotId: string, limit?: number) => api.get(`/api/overlay/chat/messages/${slotId}`, { params: { limit } }),
  getWatermarkConfig: (slotId: string) => api.get(`/api/overlay/watermark/${slotId}`),
  updateWatermarkConfig: (data: Record<string, unknown>) => api.put('/api/overlay/watermark', data),
  uploadWatermark: (formData: FormData) => api.post('/api/overlay/watermark/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Schedule & Multi-YouTube
export const scheduleAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/api/schedule', { params }),
  create: (data: Record<string, unknown>) => api.post('/api/schedule', data),
  importCsv: (formData: FormData) => api.post('/api/schedule/csv-import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getTemplate: () => api.get('/api/schedule/csv-template', { responseType: 'blob' }),
  delete: (id: string) => api.delete(`/api/schedule/${id}`),
  updateStatus: (id: string, status: string) => api.put(`/api/schedule/${id}/status?status=${status}`),
  getYouTubeAccounts: () => api.get('/api/schedule/youtube-accounts'),
  addYouTubeAccount: (data: Record<string, unknown>) => api.post('/api/schedule/youtube-accounts', data),
  updateYouTubeAccount: (id: string, data: Record<string, unknown>) => api.put(`/api/schedule/youtube-accounts/${id}`, data),
  deleteYouTubeAccount: (id: string) => api.delete(`/api/schedule/youtube-accounts/${id}`),
};

// Billing & Metering
export const billingAPI = {
  getPPSRates: () => api.get('/api/billing/pay-per-stream/rates'),
  createPPSOrder: (data: Record<string, unknown>) => api.post('/api/billing/pay-per-stream', data),
  verifyPPSPayment: (data: Record<string, unknown>) => api.post('/api/billing/pay-per-stream/verify', null, { params: data }),
  getBandwidth: (period?: string) => api.get('/api/billing/bandwidth', { params: { period } }),
  getBandwidthAlerts: () => api.get('/api/billing/bandwidth/alerts'),
  setBandwidthAlerts: (data: Record<string, unknown>) => api.put('/api/billing/bandwidth/alerts', data),
  adminBandwidth: (period?: string) => api.get('/api/billing/bandwidth/admin', { params: { period } }),
  getFreeTrial: () => api.get('/api/billing/free-trial'),
  activateFreeTrial: () => api.post('/api/billing/free-trial/activate'),
  toggleAutoUpgrade: (enabled: boolean) => api.put(`/api/billing/free-trial/auto-upgrade?enabled=${enabled}`),
  getRazorpayConfig: () => api.get('/api/billing/razorpay/config'),
  createRazorpayOrder: (amount: number, currency?: string) => api.post('/api/billing/razorpay/create-order', null, { params: { amount, currency: currency || 'INR' } }),
  verifyRazorpay: (data: Record<string, unknown>) => api.post('/api/billing/razorpay/verify', null, { params: data }),
};

// RTMP Pull & Load Balancing
export const rtmpPullAPI = {
  start: (data: Record<string, unknown>) => api.post('/api/rtmp-pull/start', data),
  stop: (slotId: string) => api.post(`/api/rtmp-pull/stop/${slotId}`),
  getSources: () => api.get('/api/rtmp-pull/sources'),
  saveSource: (name: string, url: string, type?: string) => api.post('/api/rtmp-pull/sources', null, { params: { name, url, source_type: type || 'rtmp' } }),
  deleteSource: (id: string) => api.delete(`/api/rtmp-pull/sources/${id}`),
  getServers: () => api.get('/api/rtmp-pull/servers'),
  addServer: (data: Record<string, unknown>) => api.post('/api/rtmp-pull/servers', data),
  updateServer: (id: string, data: Record<string, unknown>) => api.put(`/api/rtmp-pull/servers/${id}`, data),
  deleteServer: (id: string) => api.delete(`/api/rtmp-pull/servers/${id}`),
  getBestServer: () => api.get('/api/rtmp-pull/servers/best'),
};

export default api;
