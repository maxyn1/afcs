
import api from './api';
import type { Driver } from './driverService';

export interface SaccoStats {
  totalDrivers: number;
  totalVehicles: number;
  totalRoutes: number;
  dailyRevenue: number;
  totalTrips: number;
  totalPassengers: number;
  activeVehicles: number;
}

export interface Route {
  id: number;
  name: string;
  start_point: string;
  end_point: string;
  distance: number;
  fare: number;
  status: 'active' | 'inactive';
  assigned_vehicles: number;
}

class SaccoAdminService {
  async getDashboardStats() {
    const response = await api.get('/sacco-admin/dashboard-stats');
    return response.data;
  }

  async getDrivers() {
    const response = await api.get('/sacco-admin/drivers');
    return response.data;
  }

  async getVehicles() {
    const response = await api.get('/sacco-admin/vehicles');
    return response.data;
  }

  async getRoutes() {
    const response = await api.get('/sacco-admin/routes');
    return response.data;
  }

  async getPayments(startDate?: string, endDate?: string) {
    const params = startDate && endDate ? { startDate, endDate } : {};
    const response = await api.get('/sacco-admin/payments', { params });
    return response.data;
  }

  async createDriver(driverData: Partial<Driver>) {
    const response = await api.post('/sacco-admin/drivers', driverData);
    return response.data;
  }

  async updateDriver(id: string, driverData: Partial<Driver>) {
    const response = await api.put(`/sacco-admin/drivers/${id}`, driverData);
    return response.data;
  }

  async assignVehicle(driverId: string, vehicleId: number) {
    const response = await api.put(`/sacco-admin/drivers/${driverId}/assign-vehicle`, {
      vehicleId
    });
    return response.data;
  }

  async createRoute(routeData: Partial<Route>) {
    const response = await api.post('/sacco-admin/routes', routeData);
    return response.data;
  }

  async updateRoute(id: number, routeData: Partial<Route>) {
    const response = await api.put(`/sacco-admin/routes/${id}`, routeData);
    return response.data;
  }

  async generateReport(type: 'daily' | 'weekly' | 'monthly', date?: string) {
    const response = await api.get('/sacco-admin/reports', {
      params: { type, date }
    });
    return response.data;
  }
}

export default new SaccoAdminService();
