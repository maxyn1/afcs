import api from './api';
import type { Driver } from './driverService';
import type { Vehicle } from './vehicleService';

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
  start_location?: string;
  end_location?: string;
  base_fare?: number;
  estimated_duration_minutes?: number;
}

export interface Payment {
  id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transactionTime: string;
  transactionType: 'payment' | 'refund';
  paymentMethod: string;
  userId: string;
  userName: string;
  vehicleId: number;
  vehicleRegistration: string;
  tripId: number;
}

export interface Report {
  revenue: number;
  tripCount: number;
  passengerCount: number;
  activeVehicles: number;
  activeDrivers: number;
  period: {
    start: string;
    end: string;
  };
  transactions: {
    completed: number;
    pending: number;
    failed: number;
  };
}

class SaccoAdminService {
  async getDashboardStats(): Promise<SaccoStats> {
    try {
      const response = await api.get('/sacco-admin/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch SACCO dashboard stats:', error);
      throw error;
    }
  }

  async getDrivers(): Promise<Driver[]> {
    const response = await api.get('/sacco-admin/drivers');
    return response.data;
  }

  async getVehicles(): Promise<Vehicle[]> {
    const response = await api.get('/sacco-admin/vehicles');
    return response.data;
  }

  async getRoutes(): Promise<Route[]> {
    const response = await api.get('/sacco-admin/routes');
    return response.data;
  }

  async getPayments(startDate?: string, endDate?: string): Promise<Payment[]> {
    const params = startDate && endDate ? { startDate, endDate } : {};
    const response = await api.get('/sacco-admin/payments', { params });
    return response.data;
  }

  async createDriver(driverData: Partial<Driver>): Promise<Driver> {
    const response = await api.post('/sacco-admin/drivers', driverData);
    return response.data;
  }

  async updateDriver(id: string, driverData: Partial<Driver>): Promise<Driver> {
    const response = await api.put(`/sacco-admin/drivers/${id}`, driverData);
    return response.data;
  }

  async deleteDriver(id: string): Promise<void> {
    await api.delete(`/sacco-admin/drivers/${id}`);
  }

  async createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.post('/sacco-admin/vehicles', vehicleData);
    return response.data;
  }

  async updateVehicle(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.put(`/sacco-admin/vehicles/${id}`, vehicleData);
    return response.data;
  }

  async deleteVehicle(id: number): Promise<void> {
    await api.delete(`/sacco-admin/vehicles/${id}`);
  }

  async createRoute(routeData: Partial<Route>): Promise<Route> {
    // Map frontend routeData fields to backend expected fields
    const payload = {
      start_location: routeData.start_point,
      end_location: routeData.end_point,
      distance_km: routeData.distance,
      base_fare: routeData.fare,
      status: routeData.status || 'active',
    };
    const response = await api.post('/sacco-admin/routes', payload);
    return response.data;
  }

  async updateRoute(id: number, routeData: Partial<Route>): Promise<Route> {
    // Map frontend routeData fields to backend expected fields
    const payload = {
      start_location: routeData.start_point,
      end_location: routeData.end_point,
      distance_km: routeData.distance,
      base_fare: routeData.fare,
      status: routeData.status || 'active',
    };
    const response = await api.put(`/sacco-admin/routes/${id}`, payload);
    return response.data;
  }

  // Driver assignment methods
  async getAvailableDrivers(vehicleId: number): Promise<Driver[]> {
    console.log('[SaccoAdminService] Fetching available drivers for vehicle:', vehicleId);
    try {
      const response = await api.get(`/sacco-admin/vehicles/${vehicleId}/available-drivers`);
      console.log('[SaccoAdminService] Available drivers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[SaccoAdminService] Error fetching available drivers:', {
        error,
        status: error.response?.status,
        message: error.response?.data?.message,
        vehicleId
      });
      throw error;
    }
  }

  async assignDriver(vehicleId: number, driverId: number): Promise<void> {
    console.log('[SaccoAdminService] Assigning driver:', { vehicleId, driverId });
    try {
      const response = await api.post(`/sacco-admin/vehicles/${vehicleId}/assign-driver`, { driverId });
      console.log('[SaccoAdminService] Driver assigned successfully:', response.data);
    } catch (error) {
      console.error('[SaccoAdminService] Error assigning driver:', {
        error,
        status: error.response?.status,
        message: error.response?.data?.message,
        vehicleId,
        driverId
      });
      throw error;
    }
  }

  async unassignDriver(vehicleId: number): Promise<void> {
    await api.post(`/sacco-admin/vehicles/${vehicleId}/unassign-driver`);
  }

  async generateReport(type: 'daily' | 'weekly' | 'monthly', date?: string): Promise<Report> {
    const response = await api.get('/sacco-admin/reports', {
      params: { type, date }
    });
    return response.data;
  }

  async getSaccoIdByUserId(): Promise<number> {
    const response = await api.get('/sacco-admin/my-sacco');
    return response.data.saccoId;
  }

  async getAvailableVehicles(): Promise<Vehicle[]> {
    try {
      const response = await api.get('/sacco-admin/vehicles');
      // Filter to only return vehicles that are active and have no assigned driver
      return response.data.filter(
        (vehicle: Vehicle & { driverId?: number }) => 
          vehicle.status === 'active' && !vehicle.driverId
      );
    } catch (error) {
      console.error('[SaccoAdminService] Error fetching available vehicles:', error);
      throw error;
    }
  }

  async assignVehicleToDriver(driverId: number, vehicleId: number): Promise<void> {
    try {
      await api.post(`/sacco-admin/vehicles/${vehicleId}/assign-driver`, { driverId });
    } catch (error) {
      console.error('[SaccoAdminService] Error assigning vehicle to driver:', error);
      throw error;
    }
  }

  async unassignVehicleFromDriver(vehicleId: number): Promise<void> {
    try {
      await api.post(`/sacco-admin/vehicles/${vehicleId}/unassign-driver`);
    } catch (error) {
      console.error('[SaccoAdminService] Error unassigning vehicle from driver:', error);
      throw error;
    }
  }
}

const saccoAdminService = new SaccoAdminService();
export default saccoAdminService;
export { saccoAdminService };
