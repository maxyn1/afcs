
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

  async updateStatus(status: 'active' | 'inactive') {
    const response = await api.put('/driver/status', { status });
    return response.data;
  }

  async reportIssue(issue: { type: string; description: string; priority: 'low' | 'medium' | 'high' }) {
    const response = await api.post('/driver/issues', issue);
    return response.data;
  }
}

export default new DriverService();
