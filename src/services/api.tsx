import axios from 'axios';

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      config.headers['Authorization'] = `Bearer ${parsedUser.token || ''}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error scenarios
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear user and redirect to login
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - handle access denied
          console.error('Access forbidden');
          break;
        case 500:
          // Server error
          console.error('Server error');
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default api;