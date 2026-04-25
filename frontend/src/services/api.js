import axios from 'axios';

// In production (Vercel), VITE_API_URL points to the deployed backend.
// In local dev, Vite's proxy forwards /api → localhost:5000
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fb_token');
      localStorage.removeItem('fb_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  getMe: () => api.get('/auth/me'),
  updateProfilePhoto: (data) => api.put('/auth/profile-photo', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeProfilePhoto: () => api.delete('/auth/profile-photo'),
};

// Donations
export const donationAPI = {
  create: (data) => api.post('/donations', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/donations', { params }),
  getById: (id) => api.get(`/donations/${id}`),
  getStats: () => api.get('/donations/stats'),
  cancel: (id, data) => api.put(`/donations/${id}/cancel`, data),
  accept: (id) => api.put(`/donations/${id}/accept`),
  reject: (id, data) => api.put(`/donations/${id}/reject`, data),
  assignVolunteer: (id) => api.put(`/donations/${id}/assign-volunteer`),
  markDelivered: (id) => api.put(`/donations/${id}/deliver`),
};

// Admin
export const adminAPI = {
  createAdmin: (data) => api.post('/admin/create', data),
  getUsers: (params) => api.get('/admin/users', { params }),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  rejectUser: (id) => api.put(`/admin/users/${id}/reject`),
  getDonations: (params) => api.get('/admin/donations', { params }),
  getAnalytics: () => api.get('/admin/analytics'),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
