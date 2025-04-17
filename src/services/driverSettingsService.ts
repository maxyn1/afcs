import api from './api';

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  lastPasswordChange?: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newTrips: boolean;
  paymentUpdates: boolean;
  systemAnnouncements: boolean;
  maintenanceAlerts?: boolean;
}

export interface Settings {
  language: string;
  theme: 'light' | 'dark' | 'system';
  autoStartTrips: boolean;
  showEarnings: boolean;
  voiceNavigation: boolean;
  notifications: NotificationPreferences;
  security: SecuritySettings;
}

class DriverSettingsService {
  private API_URL = '/driver/settings';

  async getSettings(): Promise<Settings> {
    const response = await api.get(this.API_URL);
    return response.data;
  }

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const response = await api.put(this.API_URL, data);
    return response.data;
  }

  async updateNotificationPreferences(data: Partial<NotificationPreferences>): Promise<Settings> {
    const response = await api.put(`${this.API_URL}/notifications`, data);
    return response.data;
  }

  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.put(`${this.API_URL}/password`, data);
  }

  async logoutAllDevices(): Promise<void> {
    await api.post(`${this.API_URL}/logout-all`);
  }

  async deactivateAccount(): Promise<void> {
    await api.delete(`${this.API_URL}/account`);
  }
}

export const driverSettingsService = new DriverSettingsService();
export default driverSettingsService;
