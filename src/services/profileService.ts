import api from './api';

export interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
}

class ProfileService {
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  }

  async updateProfile(data: ProfileData) {
    const response = await api.put('/users/profile', data);
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await api.post('/users/change-password', {
      oldPassword,
      newPassword
    });
    return response.data;
  }

  async deleteAccount() {
    const response = await api.delete('/users/profile');
    return response.data;
  }
}

export default new ProfileService();
