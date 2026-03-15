import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getCurrentUser: () => api.get('/api/auth/me'),
};

export const projectsAPI = {
  create: (data) => api.post('/api/projects', data),
  list: () => api.get('/api/projects'),
  get: (id) => api.get(`/api/projects/${id}`),
  saveImages: (id, data) => api.patch(`/api/projects/${id}/images`, data),
  delete: (id) => api.delete(`/api/projects/${id}`),
};

export const brandsAPI = {
  create: (data) => api.post('/api/brands', data),
  list: () => api.get('/api/brands'),
  get: (id) => api.get(`/api/brands/${id}`),
  update: (id, data) => api.patch(`/api/brands/${id}`, data),
  delete: (id) => api.delete(`/api/brands/${id}`),
  generateContent: (brandId, data) => api.post(`/api/brands/${brandId}/generate-content`, data),
  listContent: (brandId) => api.get(`/api/brands/${brandId}/content`),
};

export const itemsAPI = {
  create: (brandId, data) => api.post(`/api/brands/${brandId}/items`, data),
  list: (brandId, category, includeInactive) => api.get(`/api/brands/${brandId}/items`, { params: { category, include_inactive: includeInactive || undefined } }),
  get: (itemId) => api.get(`/api/brands/items/${itemId}`),
  update: (itemId, data) => api.patch(`/api/brands/items/${itemId}`, data),
  delete: (itemId) => api.delete(`/api/brands/items/${itemId}`),
};

export const inventoryAPI = {
  create: (brandId, data) => api.post(`/api/brands/${brandId}/inventory`, data),
  list: (brandId, category) => api.get(`/api/brands/${brandId}/inventory`, { params: { category } }),
  get: (itemId) => api.get(`/api/brands/inventory/${itemId}`),
  update: (itemId, data) => api.patch(`/api/brands/inventory/${itemId}`, data),
  delete: (itemId) => api.delete(`/api/brands/inventory/${itemId}`),
  recordMovement: (itemId, data) => api.post(`/api/brands/inventory/${itemId}/movements`, data),
  lowStock: (brandId) => api.get(`/api/brands/${brandId}/inventory/low-stock`),
};

export const ordersAPI = {
  create: (brandId, data) => api.post(`/api/brands/${brandId}/orders`, data),
  list: (brandId, params) => api.get(`/api/brands/${brandId}/orders`, { params }),
  get: (orderId) => api.get(`/api/brands/orders/${orderId}`),
  update: (orderId, data) => api.patch(`/api/brands/orders/${orderId}`, data),
  updateStatus: (orderId, status) => api.patch(`/api/brands/orders/${orderId}/status`, { status }),
  delete: (orderId) => api.delete(`/api/brands/orders/${orderId}`),
};

export const transactionsAPI = {
  create: (brandId, data) => api.post(`/api/brands/${brandId}/transactions`, data),
  list: (brandId, params) => api.get(`/api/brands/${brandId}/transactions`, { params }),
  get: (transactionId) => api.get(`/api/brands/transactions/${transactionId}`),
  update: (transactionId, data) => api.patch(`/api/brands/transactions/${transactionId}`, data),
  delete: (transactionId) => api.delete(`/api/brands/transactions/${transactionId}`),
};

export const investmentsAPI = {
  create: (brandId, data) => api.post(`/api/brands/${brandId}/investments`, data),
  list: (brandId, category) => api.get(`/api/brands/${brandId}/investments`, { params: { category } }),
  get: (investmentId) => api.get(`/api/brands/investments/${investmentId}`),
  update: (investmentId, data) => api.patch(`/api/brands/investments/${investmentId}`, data),
  delete: (investmentId) => api.delete(`/api/brands/investments/${investmentId}`),
  summary: (brandId) => api.get(`/api/brands/${brandId}/investments/summary`),
};

export const aiAPI = {
  parseOrder: (data) => api.post('/api/parse-order', data),
  generateImages: (data) => api.post('/api/generate-images', data, { timeout: 300000 }),
};

export const triageAPI = {
  daily: (date) => api.get('/api/triage/daily', { params: { target_date: date } }),
};

export default api;
