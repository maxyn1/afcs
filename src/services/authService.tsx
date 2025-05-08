import api from './api';
import axios from 'axios';

export enum USER_ROLES {
  PASSENGER = 'passenger',
  DRIVER = 'driver',
  SYSTEM_ADMIN = 'system_admin',
  SACCO_ADMIN = 'sacco_admin'
}

interface User {
  id: string;
  name: string;
  email: string;
  role: USER_ROLES;
  status: string;
}

interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
}

interface Transaction {
  id: number;
  amount: number;
  transaction_type: string;
  description: string;
  transaction_time: string;
  payment_method: string;
  status: string;
}

interface Vehicle {
  id: string;
  number: string;
  sacco_id: string;
}

class AuthService {
  private API_URL = '';

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await api.post<LoginResponse>(`/users/login`, { 
        email, 
        password 
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Invalid server response');
      }

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        token
      }));

      return user;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 'Login failed';
        throw new Error(errorMsg);
      }
      throw error;
    }
  }

  async register(data: RegisterData): Promise<void> {
    try {
      await api.post(`/users/register`, {
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
    window.location.href = '/';
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAdmin(role?: string) {
    return role === USER_ROLES.SYSTEM_ADMIN || role === USER_ROLES.SACCO_ADMIN;
  }

  isAuthenticated() {
    const user = this.getCurrentUser();
    const token = localStorage.getItem('token');
    return !!(user && token);
  }

  getRedirectPath(role?: string): string {
    switch(role) {
      case USER_ROLES.SYSTEM_ADMIN:
        return '/admin';
      case USER_ROLES.SACCO_ADMIN:
        return '/sacco-admin';
      case USER_ROLES.DRIVER:
        return '/driver';
      case USER_ROLES.PASSENGER:
        return '/dashboard';
      default:
        return '/';
    }
  }

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
      console.log('Raw routes response:', response.data);
      
      // Transform response to match Route interface
      const transformedRoutes = response.data.map((r: any) => ({
        id: r.id,
        route: r.name || `${r.start_point} - ${r.end_point}`,
        fare: r.fare || r.base_fare || 0,
        start_point: r.start_point || r.start_location,
        end_point: r.end_point || r.end_location
      }));
      console.log('Transformed routes:', transformedRoutes);
      return { data: transformedRoutes };
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
      console.log('Fetching vehicles for SACCO:', saccoId);
      const response = await api.get('/vehicles', {
        params: { saccoId }
      });
      console.log('Raw vehicle response:', response.data);
      
      // Transform response to match interface
      const vehicles = response.data.map(v => ({
        id: v.id.toString(),
        number: v.registration_number,
        sacco_id: saccoId
      }));
      console.log('Transformed vehicles:', vehicles);
      return { data: vehicles };
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  async getWalletBalance() {
    try {
      const response = await api.get('/wallet/balance');
      // Ensure we return a properly formatted response
      return {
        data: {
          balance: Number(response.data.balance) || 0
        }
      };
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  }

  async topUpWallet(amount: number, paymentMethod: string = 'mpesa', phoneNumber?: string): Promise<void> {
    try {
      const payload: { amount: number; payment_method: string; phoneNumber?: string } = { amount, payment_method: paymentMethod };
      if (phoneNumber) {
        payload.phoneNumber = phoneNumber;
      }
      await api.post('/wallet/topup', payload);
    } catch (error) {
      console.error('Error topping up wallet:', error);
      throw error;
    }
  }

  async getWalletTransactions(): Promise<Transaction[]> {
    try {
      const response = await api.get('/wallet/transactions');
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
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
      console.log('Making payment with details:', {
        ...paymentDetails,
        timestamp: new Date().toISOString()
      });
      const response = await api.post('/payments', paymentDetails);
      console.log('Payment response:', response.data);
      return response;
    } catch (error) {
      console.error('Error making payment:', {
        error: error.response?.data || error.message,
        details: paymentDetails,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

export default new AuthService();