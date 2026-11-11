import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sweety_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors cleanly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const responseData = error.response?.data;
    const message = responseData?.message || error.message || 'An unexpected error occurred.';
    
    // Auto-logout if unauthorized
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('sweety_token');
      localStorage.removeItem('sweety_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const enhancedError = new Error(message);
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    return Promise.reject(enhancedError);
  }
);

export default api;
