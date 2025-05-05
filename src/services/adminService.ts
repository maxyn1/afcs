import apiService from './api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'passenger' | 'driver' | 'sacco_admin' | 'system_admin';
  status: 'active' | 'inactive' | 'suspended';
  saccoId?: string | null;
  saccoName?: string | null;
  lastLogin?: string;
  createdAt: string;
  // Driver specific fields
  licenseNumber?: string;
  licenseExpiry?: string;
  driverId?: number;
  rating?: number;
  totalTrips?: number;
  vehicleId?: number;
  vehicleNumber?: string;
}

interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  saccoId?: string | null;
  // Driver specific fields
  licenseNumber?: string;
  licenseExpiry?: string;
}

interface UpdateUserData {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  saccoId?: string | null;
  // Driver specific fields
  licenseNumber?: string;
  licenseExpiry?: string;
}

class AdminService {
  private readonly API_URL = '/admin';

  async getUsers(): Promise<User[]> {
    try {
      const { data } = await apiService.get(`${this.API_URL}/users`);
      return data;
    } catch (error) {
      console.error('Get users error:', error.response?.data || error);
      throw error;
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const { data } = await apiService.post(`${this.API_URL}/users`, userData);
      return data;
    } catch (error) {
      console.error('Create user error:', error.response?.data || error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: UpdateUserData): Promise<void> {
    try {
      const { data } = await apiService.put(`${this.API_URL}/users/${userId}`, userData);
      return data;
    } catch (error) {
      console.error('Update user error:', error.response?.data || error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const { data } = await apiService.delete(`${this.API_URL}/users/${userId}`);
      return data;
    } catch (error) {
      console.error('Delete user error:', error.response?.data || error);
      throw error;
    }
  }

  async changeUserRole(userId: string, role: string): Promise<void> {
    try {
      const { data } = await apiService.put(`${this.API_URL}/users/${userId}/role`, { role });
      return data;
    } catch (error) {
      console.error('Change user role error:', error.response?.data || error);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      const { data } = await apiService.get(`${this.API_URL}/dashboard/stats`);
      return data;
    } catch (error) {
      console.error('Get dashboard stats error:', error.response?.data || error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
