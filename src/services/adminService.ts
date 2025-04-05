import apiService from './api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'passenger' | 'driver' | 'sacco_admin' | 'system_admin';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
}

interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

interface UpdateUserData {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
}

class AdminService {
  private readonly API_URL = '/admin'; // This is correct since api.tsx adds /api

  async getUsers(): Promise<User[]> {
    try {
      // Add debug logging
      console.log('Fetching users from:', `${this.API_URL}/users`);
      const { data } = await apiService.get(`${this.API_URL}/users`);
      console.log('API Response:', data);
      if (!Array.isArray(data)) {
        console.error('Unexpected data format:', data);
        throw new Error('Invalid response format');
      }
      return data;
    } catch (error) {
      console.error('Get users error:', error.response?.data || error);
      throw error;
    }
  }

  async createUser(userData: CreateUserData) {
    const { data } = await apiService.post(`${this.API_URL}/users`, userData);
    return data;
  }

  async updateUser(userId: string, userData: UpdateUserData) {
    const { data } = await apiService.put(`${this.API_URL}/users/${userId}`, userData);
    return data;
  }

  async deleteUser(userId: string) {
    const { data } = await apiService.delete(`${this.API_URL}/users/${userId}`);
    return data;
  }

  async changeUserRole(userId: string, role: string) {
    const { data } = await apiService.put(`${this.API_URL}/users/${userId}/role`, { role });
    return data;
  }

  async getDashboardStats() {
    try {
      console.log('Fetching dashboard stats from:', `${this.API_URL}/dashboard-stats`);
      const { data } = await apiService.get(`${this.API_URL}/dashboard-stats`);
      console.log('Dashboard stats response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error.response?.data || error);
      // Return default data structure instead of throwing
      return {
        userStats: { total: 0, percentChange: '0%', trend: 'up' },
        revenueStats: { formattedTotal: 'KSH 0', percentChange: '0%', trend: 'up' },
        vehicleStats: { total: 0, percentChange: '0%', trend: 'up' },
        saccoStats: { total: 0, percentChange: '0%', trend: 'up' },
        recentTransactions: [],
        activeSaccos: []
      };
    }
  }
}

export const adminService = new AdminService();
