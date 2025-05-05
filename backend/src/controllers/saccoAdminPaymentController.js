import { AppError } from '../utils/errorHandler.js';

class SaccoAdminPaymentController {
  constructor(pool) {
    this.pool = pool;
  }

  async getPayments(req, res) {
    try {
      const saccoId = req.user.saccoId;
      const { startDate, endDate, page = 1, searchTerm = '', filterStatus } = req.query;
      const limit = 10;
      const offset = (page - 1) * limit;

      let query = `
        SELECT wt.id, u.name as user_name, wt.amount, wt.transaction_type, wt.status, wt.transaction_time, wt.payment_method
        FROM wallet_transactions wt
        JOIN users u ON wt.user_id = u.id
        JOIN bookings b ON b.user_id = u.id
        JOIN trips t ON b.trip_id = t.id
        JOIN vehicles v ON t.vehicle_id = v.id
        WHERE v.sacco_id = ?
      `;

      const params = [saccoId];

      if (startDate && endDate) {
        query += ' AND DATE(wt.transaction_time) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      if (filterStatus && filterStatus !== 'all') {
        query += ' AND wt.status = ?';
        params.push(filterStatus);
      }

      if (searchTerm) {
        query += ' AND (u.name LIKE ? OR wt.transaction_type LIKE ? OR wt.payment_method LIKE ?)';
        const likeTerm = `%${searchTerm}%`;
        params.push(likeTerm, likeTerm, likeTerm);
      }

      query += ' ORDER BY wt.transaction_time DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [payments] = await this.pool.query(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as totalCount
        FROM wallet_transactions wt
        JOIN users u ON wt.user_id = u.id
        JOIN bookings b ON b.user_id = u.id
        JOIN trips t ON b.trip_id = t.id
        JOIN vehicles v ON t.vehicle_id = v.id
        WHERE v.sacco_id = ?
      `;

      const countParams = [saccoId];

      if (startDate && endDate) {
        countQuery += ' AND DATE(wt.transaction_time) BETWEEN ? AND ?';
        countParams.push(startDate, endDate);
      }

      if (filterStatus && filterStatus !== 'all') {
        countQuery += ' AND wt.status = ?';
        countParams.push(filterStatus);
      }

      if (searchTerm) {
        countQuery += ' AND (u.name LIKE ? OR wt.transaction_type LIKE ? OR wt.payment_method LIKE ?)';
        const likeTerm = `%${searchTerm}%`;
        countParams.push(likeTerm, likeTerm, likeTerm);
      }

      const [countResult] = await this.pool.query(countQuery, countParams);
      const totalCount = countResult[0].totalCount;
      const totalPages = Math.ceil(totalCount / limit);

      res.json({ data: payments, totalPages });
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  }

  async getPaymentStats(req, res) {
    try {
      const saccoId = req.user.saccoId;

      const [[totalRevenueResult], [transactionsThisMonthResult], [pendingPaymentsResult]] = await Promise.all([
        this.pool.query(`
          SELECT COALESCE(SUM(amount), 0) as totalRevenue
          FROM wallet_transactions wt
          JOIN bookings b ON wt.user_id = b.user_id
          JOIN trips t ON b.trip_id = t.id
          JOIN vehicles v ON t.vehicle_id = v.id
          WHERE v.sacco_id = ? AND wt.status = 'completed' AND wt.transaction_type = 'payment'
        `, [saccoId]),
        this.pool.query(`
          SELECT COUNT(*) as transactionsThisMonth
          FROM wallet_transactions wt
          JOIN bookings b ON wt.user_id = b.user_id
          JOIN trips t ON b.trip_id = t.id
          JOIN vehicles v ON t.vehicle_id = v.id
          WHERE v.sacco_id = ? AND MONTH(wt.transaction_time) = MONTH(CURDATE()) AND YEAR(wt.transaction_time) = YEAR(CURDATE())
        `, [saccoId]),
        this.pool.query(`
          SELECT COUNT(*) as pendingPayments
          FROM wallet_transactions wt
          JOIN bookings b ON wt.user_id = b.user_id
          JOIN trips t ON b.trip_id = t.id
          JOIN vehicles v ON t.vehicle_id = v.id
          WHERE v.sacco_id = ? AND wt.status = 'pending'
        `, [saccoId])
      ]);

      res.json({
        totalRevenue: totalRevenueResult[0].totalRevenue || 0,
        transactionsThisMonth: transactionsThisMonthResult[0].transactionsThisMonth || 0,
        pendingPayments: pendingPaymentsResult[0].pendingPayments || 0
      });
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      res.status(500).json({ message: 'Failed to fetch payment stats' });
    }
  }
}

export default SaccoAdminPaymentController;
