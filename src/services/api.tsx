import axios from 'axios';

// Simple in-memory cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 100000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request debugging and caching
api.interceptors.request.use(
  async (config) => {
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

    // Check cache for GET requests
    if (config.method?.toLowerCase() === 'get') {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cachedResponse = cache.get(cacheKey);
      
      if (cachedResponse) {
        const now = Date.now();
        if (now - cachedResponse.timestamp < CACHE_DURATION) {
          console.log('🎯 Cache hit:', config.url);
          return Promise.reject({
            __CACHE_HIT__: true,
            config,
            ...cachedResponse.data
          });
        } else {
          // Remove expired cache entry
          cache.delete(cacheKey);
        }
      }
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

// Add response debugging and caching
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method?.toLowerCase() === 'get') {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, {
        timestamp: Date.now(),
        data: response
      });
    }

    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Return cached response if this was a cache hit
    if (error.__CACHE_HIT__) {
      return Promise.resolve(error);
    }

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