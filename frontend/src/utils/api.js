import axios from 'axios';

const isProd = process.env.NODE_ENV === 'production';
const api = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || (isProd ? 'https://social-sticky.onrender.com/api' : '/api') 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ssn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ssn_token');
      localStorage.removeItem('ssn_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
