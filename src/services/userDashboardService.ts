import api from './api';
import { logger } from '@/utils/logger';

export interface UserDashboardStats {
  currentBalance: number;
  totalTransactions: number;
  totalSpent: number;
  lastTransaction: {
    amount: number;
    transaction_time: string;
  } | null;
}

export interface UserTransaction {
  id: number;
  amount: number;
  transaction_time: string;
  type: string;
  plate_number?: string;
  route_name?: string;
}

export interface FrequentRoute {
  id: number;
  name: string;
  start_point: string;
  end_point: string;
  trip_count: number;
}

class UserDashboardService {
  async getUserStats() {
    try {
      logger.info('Fetching user dashboard stats');
      const response = await api.get<UserDashboardStats>('/users/dashboard/stats');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch user dashboard stats', error);
      throw error;
    }
  }

  async getRecentTransactions() {
    try {
      logger.info('Fetching user recent transactions');
      const response = await api.get<UserTransaction[]>('/users/dashboard/recent-transactions');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch user transactions', error);
      throw error;
    }
  }

  async getFrequentRoutes() {
    try {
      logger.info('Fetching user frequent routes');
      const response = await api.get<FrequentRoute[]>('/users/dashboard/frequent-routes');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch frequent routes', error);
      throw error;
    }
  }
}

export const userDashboardService = new UserDashboardService();
