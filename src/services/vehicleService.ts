import api from './api';

export interface Vehicle {
  id: number;
  registrationNumber: string;
  sacco_id: string;
  sacco_name: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'retired';
  route: string | null;
  make: string;
  model: string;
  year: number;
}

class VehicleService {
  async getVehicles(): Promise<Vehicle[]> {
    const response = await api.get('/admin/vehicles');
    return response.data;
  }

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await api.post('/admin/vehicles', data);
      return response.data;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 409) {
        throw new Error('A vehicle with this registration number already exists');
      }
      throw new Error('Failed to create vehicle');
    }
  }

  async updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await api.put(`/admin/vehicles/${id}`, data);
      if (!response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 404) {
        throw new Error('Vehicle not found');
      } else if (error.response?.status === 409) {
        throw new Error('Registration number already in use');
      }
      throw new Error('Failed to update vehicle');
    }
  }

  async deleteVehicle(id: number): Promise<void> {
    try {
      await api.delete(`/admin/vehicles/${id}`);
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 404) {
        throw new Error('Vehicle not found');
      }
      throw new Error('Failed to delete vehicle');
    }
  }
}

const vehicleService = new VehicleService();
export default vehicleService;
export { vehicleService };
