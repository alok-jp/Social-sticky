import axios from 'axios';

const isVercel = window.location.hostname.endsWith('.vercel.app') || window.location.hostname.includes('social-sticky');
let baseUrl = process.env.REACT_APP_API_URL || (isVercel ? 'https://social-sticky.onrender.com' : '');

// Ensure it ends with /api if not already present
if (!baseUrl.endsWith('/api')) {
  baseUrl = baseUrl.endsWith('/') ? `${baseUrl}api` : `${baseUrl}/api`;
}

// In local dev, if baseUrl is just '/api', make sure it's relative
if (!isVercel && !process.env.REACT_APP_API_URL) {
  baseUrl = '/api';
}

const api = axios.create({ baseURL: baseUrl });

// Diagnostic: Log the base URL to help debug connectivity
console.log('🚀 API Base URL Initialized:', api.defaults.baseURL);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ssn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (isProd) {
      console.error('❌ API Error:', {
        url: err.config?.url,
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('ssn_token');
      localStorage.removeItem('ssn_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
