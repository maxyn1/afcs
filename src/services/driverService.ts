import api from './api';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  sacco_id: number;
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
  type: string;
  capacity: number;
  sacco_name: string;
  last_maintenance: string;
  insurance_expiry: string;
}

class DriverService {
  async getProfile() {
    const response = await api.get('/driver/profile');
    return response.data;
  }

  async getStats() {
    const response = await api.get('/driver/stats');
    return response.data;
  }

  async getVehicle() {
    const response = await api.get('/driver/vehicle');
    return response.data;
  }

  async getTripHistory(page = 1, limit = 10) {
    const response = await api.get('/driver/trips', {
      params: { page, limit }
    });
    return response.data;
  }

  async updateProfile(data: Partial<Driver>) {
    const response = await api.put('/driver/profile', data);
    return response.data;
  }

  async updateStatus(status: 'active' | 'inactive'): Promise<void> {
    try {
      console.log('Updating driver status:', status);
      const response = await api.put('/driver/status', { status });
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
    const response = await api.post('/driver/issues', issue);
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('Making request to /driver/dashboard-stats');
      const response = await api.get<DashboardStats>('/driver/dashboard-stats');
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
    const response = await api.get('/driver/vehicle-info');
    return response.data;
  }
}

export default new DriverService();
