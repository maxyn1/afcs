import api from './api';
import { logger } from '@/utils/logger';

export interface RawDashboardStats {
  users: Array<{
    totalUsers: string | number;  // Updated to handle both string and number
    userGrowth: string;
  }>;
  transactions: Array<{
    totalRevenue: string | number;
    revenueGrowth: string;
  }>;
  vehicles: Array<{
    activeVehicles: string | number;
    vehicleGrowth: string;
  }>;
  saccos: Array<{
    totalSaccos: string | number;
    saccoGrowth: string;
  }>;
}

export interface DashboardStats {
  totalUsers: number;
  totalRevenue: number;
  activeVehicles: number;
  totalSaccos: number;
  userGrowth: number;
  revenueGrowth: number;
  vehicleGrowth: number;
  saccoGrowth: number;
}

export interface Transaction {
  id: number;
  amount: number;
  user_id: string;
  user_name: string;
  transaction_time: string;
}

export interface Sacco {
  id: number;
  name: string;
  registration_number: string;
  contact_email: string;
  vehicle_count: number;
}

class DashboardService {
  async getStats(): Promise<RawDashboardStats> {
    try {
      logger.info('Fetching dashboard stats');
      const response = await api.get('/admin/dashboard/stats');
      
      // Parse the response data if it's a string
      const rawData = typeof response.data === 'string' 
        ? JSON.parse(response.data) 
        : response.data;

      logger.debug('Parsed API response:', {
        rawData,
        parsedUsers: rawData?.users,
        parsedTransactions: rawData?.transactions
      });

      // Extract and validate the data
      const stats = {
        users: [{
          totalUsers: rawData?.users?.[0]?.totalUsers || '0',
          userGrowth: rawData?.users?.[0]?.userGrowth || '0'
        }],
        transactions: [{
          totalRevenue: rawData?.transactions?.[0]?.totalRevenue || '0',
          revenueGrowth: rawData?.transactions?.[0]?.revenueGrowth || '0'
        }],
        vehicles: [{
          activeVehicles: rawData?.vehicles?.[0]?.activeVehicles || '0',
          vehicleGrowth: rawData?.vehicles?.[0]?.vehicleGrowth || '0'
        }],
        saccos: [{
          totalSaccos: rawData?.saccos?.[0]?.totalSaccos || '0',
          saccoGrowth: rawData?.saccos?.[0]?.saccoGrowth || '0'
        }]
      };

      logger.debug('Processed stats:', {
        processedStats: stats,
        firstUser: stats.users[0],
        firstTransaction: stats.transactions[0]
      });

      return stats;

    } catch (error) {
      logger.error('Failed to fetch dashboard stats', {
        error: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      // Return default data instead of throwing
      return {
        users: [{ totalUsers: '0', userGrowth: '0' }],
        transactions: [{ totalRevenue: '0', revenueGrowth: '0' }],
        vehicles: [{ activeVehicles: '0', vehicleGrowth: '0' }],
        saccos: [{ totalSaccos: '0', saccoGrowth: '0' }]
      };
    }
  }

  async getRecentTransactions(): Promise<Transaction[]> {
    try {
      logger.info('Fetching recent transactions');
      const response = await api.get<Transaction[]>('/admin/dashboard/recent-transactions');
      
      logger.debug('Recent transactions response:', { transactions: response.data });
      
      // Validate and transform transaction data
      return (response.data || []).map(transaction => ({
        ...transaction,
        amount: Number(transaction.amount),
        transaction_time: new Date(transaction.transaction_time).toISOString()
      }));
    } catch (error) {
      logger.error('Failed to fetch transactions', error);
      return [];
    }
  }

  async getActiveSaccos(): Promise<Sacco[]> {
    try {
      logger.info('Fetching active SACCOs');
      const response = await api.get<Sacco[]>('/admin/dashboard/active-saccos');
      
      logger.debug('Active SACCOs response:', { saccos: response.data });
      
      // Validate and transform SACCO data
      return (response.data || []).map(sacco => ({
        ...sacco,
        vehicle_count: Number(sacco.vehicle_count)
      }));
    } catch (error) {
      logger.error('Failed to fetch SACCOs', error);
      return [];
    }
  }
}

export const dashboardService = new DashboardService();
