import axios from 'axios';

const isProd = process.env.NODE_ENV === 'production';
let baseUrl = process.env.REACT_APP_API_URL || (isProd ? 'https://social-sticky.onrender.com' : '');

// Ensure it ends with /api if not already present
if (!baseUrl.endsWith('/api')) {
  baseUrl = baseUrl.endsWith('/') ? `${baseUrl}api` : `${baseUrl}/api`;
}

const api = axios.create({ baseURL: baseUrl });

// Diagnostic: Log the base URL in production to help debug connectivity
if (isProd) console.log('🚀 API Base URL:', api.defaults.baseURL);

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
