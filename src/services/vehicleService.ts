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
    const response = await api.put(`/admin/vehicles/${id}`, data);
    return response.data;
  }

  async deleteVehicle(id: number) {
    await api.delete(`/admin/vehicles/${id}`);
  }
}

export default new VehicleService();
