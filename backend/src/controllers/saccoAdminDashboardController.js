class SaccoAdminDashboardController {
  constructor(pool) {
    this.pool = pool;
  }

  async getDashboardStats(req, res) {
    try {
      const saccoId = req.user.sacco_id; // Assuming SACCO ID is available in the user object

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
          SELECT COUNT(*) as totalRoutes
          FROM routes
          WHERE sacco_id = ?
        `, [saccoId]),
        this.pool.query(`
          SELECT 
            SUM(amount) as dailyRevenue
          FROM wallet_transactions
          WHERE sacco_id = ? AND DATE(transaction_time) = CURDATE()
        `, [saccoId]),
        this.pool.query(`
          SELECT COUNT(*) as totalTrips
          FROM trips
          WHERE sacco_id = ?
        `, [saccoId]),
        this.pool.query(`
          SELECT COUNT(*) as totalPassengers
          FROM passengers
          WHERE sacco_id = ?
        `, [saccoId])
      ]);

      res.json({
        totalDrivers: driverStats?.totalDrivers || 0,
        totalVehicles: vehicleStats?.totalVehicles || 0,
        activeVehicles: vehicleStats?.activeVehicles || 0,
        totalRoutes: routeStats?.totalRoutes || 0,
        dailyRevenue: revenueStats?.dailyRevenue || 0,
        totalTrips: tripStats?.totalTrips || 0,
        totalPassengers: passengerStats?.totalPassengers || 0
      });
    } catch (error) {
      console.error('Error fetching SACCO dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch SACCO dashboard stats' });
    }
  }
}

export default SaccoAdminDashboardController;
