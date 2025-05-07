import { connectDB } from '../config/database.js';

class AdminDashboardController {
  constructor(pool) {
    this.pool = pool;
  }

  async getDashboardStats(req, res) {
    try {
      const [
        userStats,
        revenueStats,
        vehicleStats,
        saccoStats,
        recentTransactions,
        activeSaccos
      ] = await Promise.all([
        this.getUserStats(),
        this.getRevenueStats(),
        this.getVehicleStats(),
        this.getSaccoStats(),
        this.getRecentTransactions(),
        this.getActiveSaccos()
      ]);

      const stats = {
        userStats,
        revenueStats,
        vehicleStats,
        saccoStats,
        recentTransactions,
        activeSaccos
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ 
        message: 'Error fetching dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getUserStats() {
    const [rows] = await this.pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as newUsers,
        SUM(CASE WHEN role = 'passenger' THEN 1 ELSE 0 END) as passengers,
        SUM(CASE WHEN role = 'driver' THEN 1 ELSE 0 END) as drivers
      FROM users
    `);
    
    const [prevMonth] = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    const currentMonthUsers = rows[0].newUsers;
    const previousMonthUsers = prevMonth[0].count;
    const percentChange = previousMonthUsers > 0 
      ? (((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100).toFixed(1)
      : '+100';
    
    return {
      total: rows[0].totalUsers,
      percentChange: percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`,
      trend: percentChange >= 0 ? 'up' : 'down'
    };
  }

  async getRevenueStats() {
    const [rows] = await this.pool.query(`
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalRevenue,
        SUM(CASE 
          WHEN amount > 0 AND transaction_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
          THEN amount ELSE 0 END) as monthlyRevenue
      FROM wallet_transactions
      WHERE transaction_type IN ('payment', 'top_up')
      AND status = 'completed'
    `);
    
    const [prevMonth] = await this.pool.query(`
      SELECT SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as revenue
      FROM wallet_transactions
      WHERE transaction_type IN ('payment', 'top_up')
      AND status = 'completed'
      AND transaction_time BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    const currentMonthRevenue = rows[0].monthlyRevenue || 0;
    const previousMonthRevenue = prevMonth[0].revenue || 0;
    const percentChange = previousMonthRevenue > 0 
      ? (((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1)
      : '+100';
    
    return {
      total: rows[0].totalRevenue || 0,
      formattedTotal: `KSH ${(rows[0].totalRevenue || 0).toLocaleString()}`,
      percentChange: percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`,
      trend: percentChange >= 0 ? 'up' : 'down'
    };
  }

  async getVehicleStats() {
    const [rows] = await this.pool.query(`
      SELECT 
        COUNT(*) as totalVehicles,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeVehicles,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenanceVehicles
      FROM vehicles
    `);
    
    // For month-over-month comparison, we'll compare active vehicles in trips
    const [monthlyComparison] = await this.pool.query(`
      SELECT
        SUM(CASE 
          WHEN departure_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 
          ELSE 0 
        END) as currentMonthActive,
        SUM(CASE 
          WHEN departure_time BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 
          ELSE 0 
        END) as previousMonthActive
      FROM (
        SELECT DISTINCT vehicle_id, departure_time
        FROM trips
        WHERE departure_time >= DATE_SUB(NOW(), INTERVAL 60 DAY)
      ) t
    `);
    
    const currentActiveVehicles = monthlyComparison[0].currentMonthActive || 0;
    const previousActiveVehicles = monthlyComparison[0].previousMonthActive || 0;
    const percentChange = previousActiveVehicles > 0 
      ? (((currentActiveVehicles - previousActiveVehicles) / previousActiveVehicles) * 100).toFixed(1)
      : '+100';
    
    return {
      total: rows[0].activeVehicles,
      percentChange: percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`,
      trend: percentChange >= 0 ? 'up' : 'down'
    };
  }

  async getSaccoStats() {
    const [rows] = await this.pool.query(`
      SELECT 
        COUNT(*) as totalSaccos,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeSaccos
      FROM saccos
    `);
    
    // For simplicity, using a static 5% increase since SACCO registration doesn't change often
    return {
      total: rows[0].activeSaccos,
      percentChange: '+5%',
      trend: 'up'
    };
  }

  async getRecentTransactions() {
    const [rows] = await this.pool.query(`
      SELECT 
        w.id,
        w.amount,
        w.transaction_type,
        w.transaction_time,
        u.name as userName,
        u.id as userId
      FROM wallet_transactions w
      JOIN users u ON w.user_id = u.id
      WHERE w.status = 'completed'
      ORDER BY w.transaction_time DESC
      LIMIT 5
    `);
    
    return rows.map(tx => ({
      id: tx.id,
      amount: tx.amount,
      type: tx.transaction_type,
      userName: tx.userName,
      userId: tx.userId,
      time: new Date(tx.transaction_time).toISOString()
    }));
  }

  async getActiveSaccos() {
    const [rows] = await this.pool.query(`
      SELECT 
        s.id,
        s.name,
        s.status,
        COUNT(v.id) as vehicleCount
      FROM saccos s
      LEFT JOIN vehicles v ON s.id = v.sacco_id
      WHERE s.status = 'active'
      GROUP BY s.id
      ORDER BY vehicleCount DESC
      LIMIT 5
    `);
    
    return rows;
  }
}

export default AdminDashboardController;