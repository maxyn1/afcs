import { AppError } from '../utils/errorHandler.js';

class DashboardController {
  constructor(pool) {
    this.pool = pool;
  }

  async getStats(req, res) {
    try {
      // Get users stats with growth
      const [userStatsResult] = await this.pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as totalUsers
      `);
      
      // Get transactions sum
      const [transactionStatsResult] = await this.pool.query(`
        SELECT 
          COALESCE(SUM(amount), 0) as totalRevenue
        FROM wallet_transactions
      `);
      
      // Get vehicle count
      const [vehicleStatsResult] = await this.pool.query(`
        SELECT 
          COUNT(*) as activeVehicles
        FROM vehicles 
        WHERE status = 'active'
      `);
      
      // Get sacco count
      const [saccoStatsResult] = await this.pool.query(`
        SELECT 
          COUNT(*) as totalSaccos
        FROM saccos 
        WHERE status = 'active'
      `);
  
      // Extract values with default fallbacks
      const totalUsers = userStatsResult[0]?.totalUsers || 0;
      const totalRevenue = transactionStatsResult[0]?.totalRevenue || 0;
      const activeVehicles = vehicleStatsResult[0]?.activeVehicles || 0;
      const totalSaccos = saccoStatsResult[0]?.totalSaccos || 0;
  
      console.log('Raw DB results:', {
        userStatsResult,
        transactionStatsResult,
        vehicleStatsResult,
        saccoStatsResult
      });
  
      const stats = {
        users: [{
          totalUsers: totalUsers,
          userGrowth: "0" // Simplified for now
        }],
        transactions: [{
          totalRevenue: totalRevenue.toString(),
          revenueGrowth: "0" // Simplified for now
        }],
        vehicles: [{
          activeVehicles: activeVehicles,
          vehicleGrowth: "0" // Simplified for now
        }],
        saccos: [{
          totalSaccos: totalSaccos,
          saccoGrowth: "0" // Simplified for now
        }]
      };
  
      console.log('Stats fetched successfully:', stats);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ 
        message: 'Error fetching dashboard stats', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async getRecentTransactions(req, res, next) {
    try {
      const [transactions] = await this.pool.query(`
        SELECT 
          t.id,
          t.amount,
          t.user_id,
          u.name as user_name,
          t.transaction_time
        FROM wallet_transactions t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.transaction_time DESC
        LIMIT 5
      `);

      res.json(transactions);
    } catch (error) {
      console.error('Recent transactions error:', error);
      next(new AppError('Failed to fetch recent transactions', 500, error.message));
    }
  }

  async getActiveSaccos(req, res, next) {
    try {
      const [saccos] = await this.pool.query(`
        SELECT
          s.id,
          s.name,
          s.registration_number,
          s.contact_email,
          COUNT(v.id) as vehicle_count
        FROM saccos s
        LEFT JOIN vehicles v ON s.id = v.sacco_id
        WHERE s.status = 'active'
        GROUP BY s.id
        ORDER BY vehicle_count DESC
        LIMIT 5
      `);

      res.json(saccos);
    } catch (error) {
      console.error('Active SACCOs error:', error);
      next(new AppError('Failed to fetch active SACCOs', 500, error.message));
    }
  }
}

export default DashboardController;
