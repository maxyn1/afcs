import axios from 'axios';
import api from '../services/api';

const BASE_URL = 'http://localhost:3000/api'; // Updated to match the backend base route

interface LoginResponse {
  id: number;
  name: string;
  email: string;
  role: 'passenger' | 'driver' | 'sacco_admin' | 'system_admin';
  token: string;
}

interface RegisterData {
  fullName: string; // Updated to match the frontend field name
  email: string;
  phone: string;
  password: string;
  confirmPassword: string; // Added to match the backend API
}

const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${BASE_URL}/users/login`, { email, password });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  async register(userData: RegisterData): Promise<void> {
    try {
      await axios.post(`${BASE_URL}/users/register`, userData); // Updated endpoint
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Registration failed');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

export default authService;