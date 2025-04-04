import api from './api';

export interface Vehicle {
  id: number;
  registration_number: string;
  sacco_id: number;
  sacco_name: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'retired';
  route: string | null;
}

class VehicleService {
  async getVehicles() {
    const response = await api.get('/admin/vehicles');
    return response.data;
  }

  async createVehicle(data: Partial<Vehicle>) {
    const response = await api.post('/admin/vehicles', data);
    return response.data;
  }

  async updateVehicle(id: number, data: Partial<Vehicle>) {
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

  async deleteVehicle(id: number) {
    await api.delete(`/admin/vehicles/${id}`);
  }
}

export default new VehicleService();
