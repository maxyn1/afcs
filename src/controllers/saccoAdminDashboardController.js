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
        `, [saccoId]),
        this.pool.query(`
          SELECT COUNT(DISTINCT b.user_id) as totalPassengers
          FROM bookings b
          INNER JOIN trips t ON b.trip_id = t.id
          INNER JOIN vehicles v ON t.vehicle_id = v.id
          WHERE v.sacco_id = ?
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
