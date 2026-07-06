import axios from 'axios';

const defaultApiUrl = import.meta.env.VITE_API_URL || 'https://codechemy.onrender.com/api';
const localApiUrl = 'http://localhost:5002/api';
const baseURL = (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname))
  ? localApiUrl
  : defaultApiUrl;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('codechemy-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('codechemy-token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
