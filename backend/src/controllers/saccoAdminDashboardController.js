class SaccoAdminDashboardController {
  constructor(pool) {
    this.pool = pool;
  }

  // Helper method to get saccoId from userId
  async getSaccoIdFromUserId(userId) {
    try {
      // Query the saccos table to find the sacco managed by this user
      const [rows] = await this.pool.query(
        'SELECT id FROM saccos WHERE managed_by = ?',
        [userId]
      );

      if (!rows || rows.length === 0) {
        return null; // User does not manage any SACCO
      }

      return rows[0].id;
    } catch (error) {
      console.error('[SaccoAdminDashboardController] Error getting saccoId from userId:', error);
      throw error;
    }
  }

  async getDashboardStats(req, res) {
    try {
      const userId = req.user.id;
      console.log('[SaccoAdminDashboardController] Getting dashboard stats for user:', userId);

      if (!userId) {
        console.error('[SaccoAdminDashboardController] No user ID in request');
        return res.status(400).json({ message: 'User ID is required' });
      }

      const saccoId = await this.getSaccoIdFromUserId(userId);
      
      if (!saccoId) {
        console.warn('[SaccoAdminDashboardController] No SACCO found for user:', userId);
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      console.log('[SaccoAdminDashboardController] Fetching stats for SACCO:', saccoId);

      const [[driverStats], [vehicleStats], [routeStats], [revenueStats], [tripStats], [passengerStats]] = await Promise.all([
        this.pool.query(`
          SELECT COUNT(*) as totalDrivers
          FROM drivers
          WHERE sacco_id = ?
        `, [saccoId]),
        this.pool.query(`
          SELECT 
            COUNT(*) as totalVehicles,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeVehicles
          FROM vehicles
          WHERE sacco_id = ?
        `, [saccoId]),
        this.pool.query(`
          SELECT COUNT(DISTINCT r.id) as totalRoutes
          FROM routes r
          INNER JOIN trips t ON r.id = t.route_id
          INNER JOIN vehicles v ON t.vehicle_id = v.id
          WHERE v.sacco_id = ?
        `, [saccoId]),
        this.pool.query(`
          SELECT 
            COALESCE(SUM(wt.amount), 0) as dailyRevenue
          FROM wallet_transactions wt
          INNER JOIN bookings b ON wt.user_id = b.user_id
          INNER JOIN trips t ON b.trip_id = t.id
          INNER JOIN vehicles v ON t.vehicle_id = v.id
          WHERE v.sacco_id = ? 
          AND DATE(wt.transaction_time) = CURDATE()
          AND wt.transaction_type = 'payment'
          AND wt.status = 'completed'
        `, [saccoId]),
        this.pool.query(`
          SELECT COUNT(*) as totalTrips
          FROM trips t
          INNER JOIN vehicles v ON t.vehicle_id = v.id
          WHERE v.sacco_id = ?
          AND DATE(t.departure_time) = CURDATE()
        `, [saccoId]),
        this.pool.query(`
          SELECT COUNT(DISTINCT b.user_id) as totalPassengers
          FROM bookings b
          INNER JOIN trips t ON b.trip_id = t.id
          INNER JOIN vehicles v ON t.vehicle_id = v.id
          WHERE v.sacco_id = ?
          AND DATE(t.departure_time) = CURDATE()
        `, [saccoId])
      ]);

      const stats = {
        totalDrivers: driverStats?.totalDrivers || 0,
        totalVehicles: vehicleStats?.totalVehicles || 0,
        activeVehicles: vehicleStats?.activeVehicles || 0,
        totalRoutes: routeStats?.totalRoutes || 0,
        dailyRevenue: revenueStats?.dailyRevenue || 0,
        totalTrips: tripStats?.totalTrips || 0,
        totalPassengers: passengerStats?.totalPassengers || 0
      };

      console.log('[SaccoAdminDashboardController] Returning stats:', stats);
      res.json(stats);
    } catch (error) {
      console.error('[SaccoAdminDashboardController] Error fetching dashboard stats:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });
      res.status(500).json({ 
        message: 'Failed to fetch SACCO dashboard stats',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default SaccoAdminDashboardController;
