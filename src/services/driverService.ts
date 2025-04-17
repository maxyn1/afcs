import api from './api';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  sacco_name: string;
  vehicle_id: number | null;
  status: 'active' | 'inactive' | 'suspended';
  rating: number;
  trips_count: number;
  created_at: string;
}

export interface DriverStats {
  todayTrips: number;
  todayEarnings: number;
  weeklyEarnings: number;
  totalPassengers: number;
  rating: number;
  completionRate: number;
}

export interface Trip {
  id: number;
  date: string;
  route: string;
  passengers: number;
  amount: number;
  status: 'completed' | 'cancelled' | 'in-progress';
}

export interface DashboardStats {
  todayTrips: number;
  todayEarnings: number;
  totalPassengers: number;
  isOnline: boolean;
  currentRoute: string;
}

export interface VehicleInfo {
  registration_number: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  vehicle_status: string;
  sacco_name: string;
  last_maintenance: string;
  insurance_expiry: string;
}

class DriverService {
  private API_URL = '/driver';

  async getProfile(): Promise<Driver> {
    const response = await api.get(`${this.API_URL}/profile`);
    return response.data;
  }

  async getStats() {
    const response = await api.get(`${this.API_URL}/stats`);
    return response.data;
  }

  async getVehicle() {
    const response = await api.get(`${this.API_URL}/vehicle`);
    return response.data;
  }

  async getTripHistory(page = 1, limit = 10) {
    const response = await api.get(`${this.API_URL}/trips`, {
      params: { page, limit }
    });
    return response.data;
  }

  async updateProfile(data: Partial<Driver>): Promise<Driver> {
    const response = await api.put(`${this.API_URL}/profile`, data);
    return response.data;
  }

  async updateStatus(status: 'active' | 'inactive'): Promise<void> {
    try {
      console.log('Updating driver status:', status);
      const response = await api.put(`${this.API_URL}/status`, { status });
      console.log('Status update response:', response.data);
    } catch (error) {
      console.error('Failed to update status:', {
        error,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async reportIssue(issue: { type: string; description: string; priority: 'low' | 'medium' | 'high' }) {
    const response = await api.post(`${this.API_URL}/issues`, issue);
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('Making request to /driver/dashboard-stats');
      const response = await api.get<DashboardStats>(`${this.API_URL}/dashboard-stats`);
      console.log('Dashboard stats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', {
        error,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async getVehicleInfo(): Promise<VehicleInfo> {
    const response = await api.get(`${this.API_URL}/vehicle-info`);
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post(`${this.API_URL}/change-password`, {
      oldPassword,
      newPassword
    });
  }

  async updateLicenseInfo(data: { license_number: string; license_expiry: string }): Promise<Driver> {
    const response = await api.put(`${this.API_URL}/license`, data);
    return response.data;
  }
}

export default new DriverService();
