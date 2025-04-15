import { AppError } from '../utils/errorHandler.js';

class UserDashboardController {
  constructor(pool) {
    this.pool = pool;
  }

  async getUserStats(req, res, next) {
    try {
      const userId = req.user.id;
      const [[walletStats], [transactionStats], [lastTransaction]] = await Promise.all([
        this.pool.query(`
          SELECT balance
          FROM wallets
          WHERE user_id = ?
        `, [userId]),
        this.pool.query(`
          SELECT 
            COUNT(*) as totalTransactions,
            COALESCE(SUM(amount), 0) as totalSpent
          FROM wallet_transactions
          WHERE user_id = ? 
          AND transaction_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, [userId]),
        this.pool.query(`
          SELECT amount, transaction_time
          FROM wallet_transactions
          WHERE user_id = ?
          ORDER BY transaction_time DESC
          LIMIT 1
        `, [userId])
      ]);

      res.json({
        currentBalance: walletStats?.balance || 0,
        totalTransactions: transactionStats?.totalTransactions || 0,
        totalSpent: transactionStats?.totalSpent || 0,
        lastTransaction: lastTransaction?.[0] || null
      });
    } catch (error) {
      next(new AppError('Failed to fetch user dashboard stats', 500, error.message));
    }
  }

  async getRecentTransactions(req, res, next) {
    try {
      const userId = req.user.id;
      const [transactions] = await this.pool.query(`
        SELECT 
          t.id,
          t.amount,
          t.transaction_time,
          t.type,
          v.plate_number,
          r.name as route_name
        FROM wallet_transactions t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN routes r ON t.route_id = r.id
        WHERE t.user_id = ?
        ORDER BY t.transaction_time DESC
        LIMIT 5
      `, [userId]);

      res.json(transactions);
    } catch (error) {
      next(new AppError('Failed to fetch recent transactions', 500, error.message));
    }
  }

  async getFrequentRoutes(req, res, next) {
    try {
      const userId = req.user.id;
      const [routes] = await this.pool.query(`
        SELECT 
          r.id,
          r.name,
          r.start_point,
          r.end_point,
          COUNT(*) as trip_count
        FROM wallet_transactions t
        JOIN routes r ON t.route_id = r.id
        WHERE t.user_id = ?
        GROUP BY r.id
        ORDER BY trip_count DESC
        LIMIT 3
      `, [userId]);

      res.json(routes);
    } catch (error) {
      next(new AppError('Failed to fetch frequent routes', 500, error.message));
    }
  }
}

export default UserDashboardController;
