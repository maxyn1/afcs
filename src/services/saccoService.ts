import api from './api';

export interface Sacco {
  id: number;
  name: string;
  registration_number: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  vehicle_count: number;
  route_count: number;
}

class SaccoService {
  async getSaccos(): Promise<Sacco[]> {
    const response = await api.get('/saccos');
    return response.data;
  }
}

const saccoService = new SaccoService();
export default saccoService;
export { saccoService };
