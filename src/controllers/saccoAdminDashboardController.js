class SaccoAdminDashboardController {
  constructor(pool) {
    this.pool = pool;
  }

  async getDashboardStats(req, res) {
    try {
      // Debugging: Log the entire req.user object
      console.log('Request User Object:', req.user);

      const saccoId = req.user?.sacco_id; // Safely access sacco_id
      if (!saccoId) {
        console.error('SACCO ID is undefined. Ensure the user is authenticated and sacco_id is set.');
        return res.status(400).json({ message: 'SACCO ID is required to fetch dashboard stats.' });
      }

      console.log('Fetching dashboard stats for SACCO ID:', saccoId);

      const [[driverStats], [vehicleStats], [routeStats], [revenueStats], [tripStats], [feedbackStats]] = await Promise.all([
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
          JOIN trips t ON r.id = t.route_id
          JOIN vehicles v ON t.vehicle_id = v.id
          WHERE v.sacco_id = ?
        `, [saccoId]),
        this.pool.query(`
          SELECT 
            SUM(amount) as dailyRevenue
          FROM wallet_transactions
          WHERE user_id IN (
            SELECT user_id FROM drivers WHERE sacco_id = ?
          ) AND DATE(transaction_time) = CURDATE()
        `, [saccoId]),
        this.pool.query(`
          SELECT COUNT(*) as totalTrips
          FROM trips
          WHERE vehicle_id IN (
            SELECT id FROM vehicles WHERE sacco_id = ?
          )
        `, [saccoId]),
        this.pool.query(`
          SELECT 
            AVG(rating) as averageRating,
            COUNT(*) as totalFeedback
          FROM feedback
          WHERE trip_id IN (
            SELECT id FROM trips WHERE vehicle_id IN (
              SELECT id FROM vehicles WHERE sacco_id = ?
            )
          )
        `, [saccoId])
      ]);

      // Debugging logs for each query result
      console.log('Driver Stats:', driverStats);
      console.log('Vehicle Stats:', vehicleStats);
      console.log('Route Stats:', routeStats);
      console.log('Revenue Stats:', revenueStats);
      console.log('Trip Stats:', tripStats);
      console.log('Feedback Stats:', feedbackStats);

      res.json({
        totalDrivers: driverStats?.totalDrivers || 0,
        totalVehicles: vehicleStats?.totalVehicles || 0,
        activeVehicles: vehicleStats?.activeVehicles || 0,
        totalRoutes: routeStats?.totalRoutes || 0,
        dailyRevenue: revenueStats?.dailyRevenue || 0,
        totalTrips: tripStats?.totalTrips || 0,
        averageRating: feedbackStats?.averageRating || 0,
        totalFeedback: feedbackStats?.totalFeedback || 0
      });
    } catch (error) {
      console.error('Error fetching SACCO dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch SACCO dashboard stats' });
    }
  }
}

export default SaccoAdminDashboardController;
