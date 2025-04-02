import api from './api';
import axios from 'axios';

export enum USER_ROLES {
  PASSENGER = 'passenger',
  SYSTEM_ADMIN = 'system_admin',
  SACCO_ADMIN = 'sacco_admin'
}

interface LoginError {
  message: string;
  errors?: {
    email?: string;
    password?: string;
    account?: string;
  };
}

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'passenger' | 'sacco_admin' | 'system_admin';
    token: string;
  };
  message: string;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
}

class AuthService {
  private API_URL = '/users'; // Remove /api since it's included in the base URL

  async login(email: string, password: string): Promise<LoginResponse['user']> {
    try {
      const response = await api.post<LoginResponse>(`${this.API_URL}/login`, { 
        email, 
        password 
      });

      if (response.data.user && response.data.user.token) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.user.token);
        return response.data.user;
      }

      throw new Error('Invalid response format from server');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data as LoginError;
        
        // Handle specific error cases
        if (errorData.errors?.account) {
          throw new Error(errorData.errors.account);
        }
        if (errorData.errors?.email) {
          throw new Error(errorData.errors.email);
        }
        if (errorData.errors?.password) {
          throw new Error(errorData.errors.password);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      }
      throw new Error('An unexpected error occurred during login');
    }
  }

  async register(data: RegisterData): Promise<void> {
    try {
      await api.post(`${this.API_URL}/register`, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: 'passenger'
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Registration error:', error.response.data || error.message);
        throw new Error(
          error.response.data?.message || 
          'Registration failed. Please try again.'
        );
      } else {
        console.error('Unexpected error:', error);
        throw new Error('An unexpected error occurred.');
      }
    }
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  isAdmin(role?: string) {
    return role === USER_ROLES.SYSTEM_ADMIN || role === USER_ROLES.SACCO_ADMIN;
  }

  getCurrentUser() {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        return {
          ...user,
          isAdmin: this.isAdmin(user.role)
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.logout();
      return null;
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Add new methods for dashboard
  async getSaccos() {
    try {
      console.log('Fetching SACCOs...');
      const response = await api.get('/saccos');
      console.log('SACCOs response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching SACCOs:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
      }
      throw error;
    }
  }

  async getRoutes() {
    try {
      console.log('Fetching routes...');
      const response = await api.get('/routes');
      console.log('Routes response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching routes:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
      }
      throw error;
    }
  }

  async getVehicles(saccoId: string) {
    try {
      const response = await api.get(`/vehicles?saccoId=${saccoId}`);
      return response;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  async getWalletBalance() {
    try {
      const response = await api.get('/users/wallet/balance');
      return response;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  }

  async topUpWallet(amount: number) {
    try {
      const response = await api.post('/users/wallet/topup', { amount });
      return response;
    } catch (error) {
      console.error('Error topping up wallet:', error);
      throw error;
    }
  }

  async makePayment(paymentDetails: {
    saccoId: string;
    vehicleId: string;
    route: string;
    amount: number;
  }) {
    try {
      const response = await api.post('/payments', paymentDetails);
      return response;
    } catch (error) {
      console.error('Error making payment:', error);
      throw error;
    }
  }
}

export default new AuthService();