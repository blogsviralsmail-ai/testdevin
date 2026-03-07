const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...config, redirect: 'follow' });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Something went wrong' }));
    throw new Error(error.detail || 'Something went wrong');
  }

  return response.json();
}

// Auth
export const authAPI = {
  register: (data: { email: string; password: string; full_name: string; phone?: string; role: string; city?: string; state?: string }) =>
    request('/api/auth/register', { method: 'POST', body: data }),
  login: (data: { email: string; password: string }) =>
    request('/api/auth/login', { method: 'POST', body: data }),
  getMe: () => request('/api/auth/me'),
};

// Teachers
export const teacherAPI = {
  search: (params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.set(key, String(val));
    });
    return request(`/api/teachers/search?${query.toString()}`);
  },
  getProfile: (id: number) => request(`/api/teachers/${id}`),
  updateProfile: (data: Record<string, unknown>) =>
    request('/api/teachers/profile', { method: 'PUT', body: data }),
  addSubject: (data: { subject_id: number; class_levels: string[] }) =>
    request('/api/teachers/subjects', { method: 'POST', body: data }),
  removeSubject: (subjectId: number) =>
    request(`/api/teachers/subjects/${subjectId}`, { method: 'DELETE' }),
  setAvailability: (slots: { day_of_week: number; start_time: string; end_time: string }[]) =>
    request('/api/teachers/availability', { method: 'POST', body: slots }),
  getMyClasses: (status?: string) =>
    request(`/api/teachers/my/classes${status ? `?status=${status}` : ''}`),
  getEarnings: () => request('/api/teachers/my/earnings'),
};

// Students
export const studentAPI = {
  bookTeacher: (data: { teacher_id: number; subject_id: number; scheduled_date: string; scheduled_time: string; duration_minutes?: number; class_type?: string; message?: string; card_number?: string; card_expiry?: string; card_cvv?: string; card_name?: string }) =>
    request('/api/students/book-teacher', { method: 'POST', body: data }),
  bookClass: (classId: number) =>
    request('/api/students/book', { method: 'POST', body: { class_id: classId } }),
  getBookings: (status?: string) =>
    request(`/api/students/bookings${status ? `?status=${status}` : ''}`),
  createReview: (data: { teacher_id: number; class_id: number; rating: number; comment?: string }) =>
    request('/api/students/review', { method: 'POST', body: data }),
  addFavourite: (teacherId: number) =>
    request(`/api/students/favourites/${teacherId}`, { method: 'POST' }),
  removeFavourite: (teacherId: number) =>
    request(`/api/students/favourites/${teacherId}`, { method: 'DELETE' }),
  getFavourites: () => request('/api/students/favourites'),
};

// Classes
export const classAPI = {
  create: (data: Record<string, unknown>) =>
    request('/api/classes/', { method: 'POST', body: data }),
  list: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.set(key, String(val));
      });
    }
    return request(`/api/classes/?${query.toString()}`);
  },
  get: (id: number) => request(`/api/classes/${id}`),
  updateStatus: (id: number, status: string) =>
    request(`/api/classes/${id}/status`, { method: 'PUT', body: { status } }),
};

// Payments
export const paymentAPI = {
  list: (status?: string) =>
    request(`/api/payments/${status ? `?status=${status}` : ''}`),
  release: (id: number) =>
    request(`/api/payments/release/${id}`, { method: 'POST' }),
  refund: (id: number) =>
    request(`/api/payments/refund/${id}`, { method: 'POST' }),
  payout: (paymentId: number, method: string = 'bank_transfer') =>
    request('/api/payments/payout/', { method: 'POST', body: { payment_id: paymentId, method } }),
  stats: () => request('/api/payments/stats/'),
};

// Admin
export const adminAPI = {
  dashboard: () => request('/api/admin/dashboard'),
  listUsers: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.set(key, String(val));
      });
    }
    return request(`/api/admin/users?${query.toString()}`);
  },
  updateUserStatus: (userId: number, action: string) =>
    request(`/api/admin/users/${userId}/status?action=${action}`, { method: 'PUT' }),
  addTeacher: (data: Record<string, unknown>) =>
    request('/api/admin/add-teacher', { method: 'POST', body: data }),
  addStudent: (data: Record<string, unknown>) =>
    request('/api/admin/add-student', { method: 'POST', body: data }),
  seedBulk: () =>
    request('/api/admin/seed-bulk', { method: 'POST' }),
  listClasses: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.set(key, String(val));
      });
    }
    return request(`/api/admin/classes?${query.toString()}`);
  },
};

// Support
export const supportAPI = {
  createTicket: (data: { subject: string; description: string; category?: string; priority?: string }) =>
    request('/api/support/tickets', { method: 'POST', body: data }),
  listTickets: (status?: string) =>
    request(`/api/support/tickets${status ? `?status=${status}` : ''}`),
  getTicket: (id: number) => request(`/api/support/tickets/${id}`),
  replyTicket: (id: number, message: string) =>
    request(`/api/support/tickets/${id}/reply`, { method: 'POST', body: { message } }),
  updateTicketStatus: (id: number, status: string) =>
    request(`/api/support/tickets/${id}/status`, { method: 'PUT', body: { status } }),
};

// Notifications
export const notificationAPI = {
  list: () => request('/api/notifications/'),
  markAllRead: () => request('/api/notifications/read-all', { method: 'PUT' }),
  markRead: (id: number) => request(`/api/notifications/${id}/read`, { method: 'PUT' }),
};

// Subjects
export const subjectAPI = {
  list: () => request('/api/subjects'),
};
