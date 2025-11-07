import axios from 'axios';
import csrfProtection from '../utils/csrfProtection';
import secureStorage from '../utils/secureStorage';

// Node.js Express API base URL (MERN Stack)
// Backend only accepts HTTPS connections
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001/api';
console.log('API_BASE_URL configured as:', API_BASE_URL);

// Create axios instance with security configurations
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CORS credentials (cookies, auth headers)
  timeout: 30000, // 30 second timeout for requests
  transformRequest: [(data) => {
    // Ensure data is properly stringified without escaping issues
    if (data && typeof data === 'object') {
      return JSON.stringify(data);
    }
    return data;
  }],
});

// Add token and CSRF protection to requests automatically
api.interceptors.request.use((config) => {
  // Try secure storage first, then fall back to localStorage
  const token = secureStorage.getToken() || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add CSRF token for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
    config.headers['X-CSRF-Token'] = csrfProtection.getToken();
  }

  // Debug logging
  console.log('=== REQUEST DEBUG ===');
  console.log('Base URL:', config.baseURL);
  console.log('Full URL:', config.baseURL + config.url);
  console.log('URL:', config.url);
  console.log('Method:', config.method);
  console.log('Data:', JSON.stringify(config.data));
  console.log('==================');

  return config;
});

// Handle errors globally with security considerations
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Unauthorized - clear token from both storage methods
      secureStorage.clearAuth();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      // Don't redirect on login failure, just let the error propagate
      // Only redirect if user is already logged in and token expired
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        window.location.href = '/customer/login';
      }
    }

    // Handle 429 Too Many Requests (Rate Limiting)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const message = error.response.data?.message || 'Too many requests. Please try again later.';

      // Enhance error with user-friendly message
      error.userMessage = retryAfter
        ? `${message} Retry in ${retryAfter} seconds.`
        : message;
    }

    // Handle network errors (including HTTPS certificate issues)
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      error.userMessage = 'Unable to connect to the server. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

// Customer Authentication
export const customerAuth = {
  register: (data) => api.post('/customer/auth/register', data),
  login: (data) => api.post('/customer/auth/login', data),
};

// Customer Payments
export const customerPayments = {
  create: (data) => api.post('/customer/payments/create', data),
  getMyPayments: () => api.get('/customer/payments/my-payments'),
  getById: (id) => api.get(`/customer/payments/${id}`),
};

// Employee Authentication
export const employeeAuth = {
  login: (data) => api.post('/employee/auth/login', data),
};

// Employee Portal
export const employeePortal = {
  getPendingPayments: () => api.get('/employee/portal/pending-payments'),
  verifyPayment: (paymentId) => api.post('/employee/portal/verify-payment', { paymentId }),
  getVerifiedPayments: () => api.get('/employee/portal/verified-payments'),
  submitToSwift: () => api.post('/employee/portal/submit-to-swift'),
  getAllPayments: (status) => api.get(`/employee/portal/all-payments${status ? `?status=${status}` : ''}`),
  rejectPayment: (paymentId, reason) => api.post('/employee/portal/reject-payment', { paymentId, reason }),
};

// Health Check
export const health = {
  check: () => api.get('/health'),
  checkMongoDB: () => api.get('/health/mongodb'),
  status: () => api.get('/health/status'),
};

export default api;
