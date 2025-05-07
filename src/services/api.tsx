import axios from 'axios';

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 40000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request debugging
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      const token = parsedUser.token || '';
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Debug token
      console.log('🔑 Auth Token:', {
        token,
        tokenLength: token.length,
        tokenFirstChars: token.substring(0, 10) + '...',
        tokenLastChars: '...' + token.substring(token.length - 10)
      });
    }

    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: {
        ...config.headers,
        Authorization: config.headers['Authorization'] ? 
          (config.headers['Authorization'] as string).substring(0, 15) + '...' : 
          'None'
      },
      data: config.data,
      params: config.params
    });

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      message: error.message,
      response: {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      }
    });
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Only redirect if not already on login page to avoid loops
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden - handle access denied
          console.error('Access forbidden');
          break;
        case 500:
          console.error('Server error:', error.response.data);
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default api;