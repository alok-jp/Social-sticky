import axios from 'axios';

// For REST API calls, use a relative path. Vercel's vercel.json rewrites 
// will proxy these to the actual backend on Render, avoiding 405/CORS issues.
const baseUrl = process.env.REACT_APP_API_URL || '/api';
const api = axios.create({ baseURL: baseUrl });

// Diagnostic: Log the base URL
console.log('🚀 API Base URL:', api.defaults.baseURL);

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
