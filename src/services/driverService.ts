import axios from 'axios';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expiry: string;
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
  make: string;
  model: string;
  year: number;
  capacity: number;
  vehicle_status: string;
  sacco_name: string;
  last_maintenance: string;
  insurance_expiry: string;
}

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

export interface Message {
  id: number;
  content: string;
  timestamp: string;
  is_mine: boolean;
  sender_name?: string;
}

export interface Conversation {
  id: number;
  name: string;
  avatar?: string;
  last_message: string;
  last_message_date: string;
  unread_count: number;
  is_group: boolean;
  member_count?: number;
  status?: 'online' | 'offline';
}

export interface Route {
  id: number;
  name: string;
  start_point: string;
  end_point: string;
  stops: number;
  distance: number;
  duration: number;
  schedule_days: string;
  schedule_hours: string;
}

class DriverService {
  private static instance: DriverService | null = null;
  private readonly axiosInstance: ReturnType<typeof axios.create>;
  private readonly API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/driver';

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/driver',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Bind methods to instance
    this.getRoutes = this.getRoutes.bind(this);
    this.getActiveRoute = this.getActiveRoute.bind(this);
    this.startRoute = this.startRoute.bind(this);
    this.endRoute = this.endRoute.bind(this);

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): DriverService {
    if (!DriverService.instance) {
      DriverService.instance = new DriverService();
    }
    return DriverService.instance;
  }

  async getProfile(): Promise<Driver> {
    const response = await this.axiosInstance.get('/profile');
    return response.data;
  }

  async getStats() {
    const response = await this.axiosInstance.get('/stats');
    return response.data;
  }

  async getVehicle() {
    const response = await this.axiosInstance.get('/vehicle');
    return response.data;
  }

  async getTripHistory(page = 1, limit = 10) {
    try {
      console.log('Fetching trip history:', { page, limit });
      const response = await this.axiosInstance.get<{trips: Trip[], totalPages: number}>('/trips', {
        params: { 
          page,
          limit,
          sort: 'date:desc'
        }
      });
      console.log('Trip history response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trip history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch trips');
    }
  }

  async updateProfile(data: Partial<Driver>): Promise<Driver> {
    const response = await this.axiosInstance.put('/profile', data);
    return response.data;
  }

  async updateStatus(status: 'active' | 'inactive'): Promise<void> {
    try {
      console.log('Updating driver status:', status);
      const response = await this.axiosInstance.put('/status', { status });
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
    const response = await this.axiosInstance.post('/issues', issue);
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('Making request to /driver/dashboard-stats');
      const response = await this.axiosInstance.get<DashboardStats>('/dashboard-stats');
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
    const response = await this.axiosInstance.get('/vehicle-info');
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.axiosInstance.post('/change-password', {
      oldPassword,
      newPassword
    });
  }

  async updateLicenseInfo(data: { license_number: string; license_expiry: string }): Promise<Driver> {
    const response = await this.axiosInstance.put('/license', data);
    return response.data;
  }

  async getSettings(): Promise<Settings> {
    try {
      const response = await this.axiosInstance.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      throw error;
    }
  }

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    try {
      const response = await this.axiosInstance.put('/settings', data);
      return response.data;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(data: Partial<NotificationPreferences>): Promise<Settings> {
    try {
      const response = await this.axiosInstance.put('/settings/notifications', data);
      return response.data;
    } catch (error) {
      console.error('Failed to update notifications:', error);
      throw error;
    }
  }

  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    try {
      await this.axiosInstance.put('/settings/password', data);
    } catch (error) {
      console.error('Failed to update password:', error);
      throw error;
    }
  }

  async logoutAllDevices(): Promise<void> {
    try {
      await this.axiosInstance.post('/settings/logout-all');
    } catch (error) {
      console.error('Failed to logout all devices:', error);
      throw error;
    }
  }

  async deactivateAccount(): Promise<void> {
    try {
      await this.axiosInstance.delete('/settings/deactivate');
    } catch (error) {
      console.error('Failed to deactivate account:', error);
      throw error;
    }
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await this.axiosInstance.get('/conversations');
    return response.data;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    const response = await this.axiosInstance.get(`/conversations/${conversationId}/messages`);
    return response.data;
  }

  async sendMessage(conversationId: number, content: string): Promise<Message> {
    const response = await this.axiosInstance.post(`/conversations/${conversationId}/messages`, {
      content
    });
    return response.data;
  }

  public async getRoutes(): Promise<Route[]> {
    try {
      console.log('Fetching driver routes...');
      const response = await this.axiosInstance.get<Route[]>('/routes');
      console.log('Routes fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch routes');
    }
  }

  public async getActiveRoute(): Promise<Route | null> {
    try {
      console.log('[DriverService] Fetching active route from:', `${this.API_URL}/routes/active`);
      const response = await this.axiosInstance.get<Route>('/api/driver/routes/active');
      
      console.log('[DriverService] Active route response:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('No active route found');
        return null;
      }
      console.error('Failed to fetch active route:', {
        error,
        status: error.response?.status,
        message: error.response?.data?.message
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch active route');
    }
  }

  async startRoute(routeId: number): Promise<void> {
    if (!routeId) {
      throw new Error('Route ID is required');
    }
    try {
      console.log('Starting route:', routeId);
      await this.axiosInstance.post(`/routes/${routeId}/start`);
      console.log('Route started successfully');
    } catch (error) {
      console.error('Failed to start route:', error);
      throw new Error(error.response?.data?.message || 'Failed to start route');
    }
  }

  async endRoute(routeId: number): Promise<void> {
    if (!routeId) {
      throw new Error('Route ID is required');
    }
    try {
      console.log('Ending route:', routeId);
      await this.axiosInstance.post(`/routes/${routeId}/end`);
      console.log('Route ended successfully');
    } catch (error) {
      console.error('Failed to end route:', error);
      throw new Error(error.response?.data?.message || 'Failed to end route');
    }
  }
}

// Create a single instance and export it
const driverServiceInstance = DriverService.getInstance();
export default driverServiceInstance;
