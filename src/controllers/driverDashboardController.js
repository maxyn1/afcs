class DriverDashboardController {
  constructor(pool) {
    this.pool = pool;
    console.log('DriverDashboardController initialized with pool:', !!pool);
  }

  async getDashboardStats(req, res) {
    try {
      const driverId = req.user.userId;
      console.log('Fetching dashboard stats for driver:', driverId);

      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching stats for date:', today);

      // First, get the driver ID from the users table
      const [driverRows] = await this.pool.query(
        'SELECT d.id, d.status FROM drivers d WHERE d.user_id = ?',
        [driverId]
      );

      if (driverRows.length === 0) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      const driverDbId = driverRows[0].id;
      const driverStatus = driverRows[0].status || 'inactive';

      // Get current route
      const [routeRows] = await this.pool.query(`
        SELECT r.id, r.start_location, r.end_location as name
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        WHERE t.driver_id = ? AND t.status = 'in_progress'
        LIMIT 1
      `, [driverDbId]);

      // Get today's trips and earnings
      const query = `
        SELECT 
          COUNT(t.id) as todayTrips,
          COALESCE(SUM(b.total_fare), 0) as todayEarnings,
          COUNT(DISTINCT b.user_id) as totalPassengers
        FROM trips t
        LEFT JOIN bookings b ON t.id = b.trip_id AND b.status = 'confirmed'
        WHERE t.driver_id = ? AND DATE(t.departure_time) = ?
      `;

      console.log('Executing query with params:', { driverDbId, today });
      const [statsRows] = await this.pool.query(query, [driverDbId, today]);
      const stats = statsRows[0];

      const response = {
        todayTrips: stats?.todayTrips || 0,
        todayEarnings: stats?.todayEarnings || 0,
        totalPassengers: stats?.totalPassengers || 0,
        isOnline: driverStatus === 'active',
        currentRoute: routeRows.length > 0 
          ? `${routeRows[0].start_location} - ${routeRows[0].name}`
          : 'Not assigned'
      };

      console.log('Sending response:', response);
      res.json(response);
    } catch (error) {
      console.error('Error in getDashboardStats:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId
      });
      res.status(500).json({ 
        message: 'Error fetching dashboard stats',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getVehicleInfo(req, res) {
    try {
      const driverId = req.user.userId;
      console.log('Fetching vehicle info for driver:', driverId);

      // First, get the driver's database ID and vehicle ID
      const [driverRows] = await this.pool.query(`
        SELECT d.id, v.id as vehicle_id
        FROM drivers d
        JOIN trips t ON d.id = t.driver_id
        JOIN vehicles v ON t.vehicle_id = v.id
        WHERE d.user_id = ?
        AND t.status = 'in_progress'
        LIMIT 1
      `, [driverId]);

      if (driverRows.length === 0) {
        console.warn('No vehicle currently assigned to driver:', driverId);
        return res.status(404).json({ message: 'No vehicle currently assigned' });
      }

      const vehicleId = driverRows[0].vehicle_id;

      const query = `
        SELECT 
          v.registration_number,
          v.make,
          v.model,
          v.year,
          v.capacity,
          v.status as vehicle_status,
          s.name as sacco_name,
          m.maintenance_date as last_maintenance,
          DATE_ADD(m.maintenance_date, INTERVAL 3 MONTH) as insurance_expiry
        FROM vehicles v
        JOIN saccos s ON v.sacco_id = s.id
        LEFT JOIN (
          SELECT vehicle_id, MAX(maintenance_date) as maintenance_date
          FROM maintenance_logs
          GROUP BY vehicle_id
        ) m ON v.id = m.vehicle_id
        WHERE v.id = ?
      `;

      console.log('Executing query with params:', { vehicleId });
      const [vehicleRows] = await this.pool.query(query, [vehicleId]);
      
      if (vehicleRows.length === 0) {
        console.warn('Vehicle not found:', vehicleId);
        return res.status(404).json({ message: 'Vehicle information not found' });
      }

      const vehicle = vehicleRows[0];
      console.log('Sending response:', vehicle);
      res.json(vehicle);
    } catch (error) {
      console.error('Error in getVehicleInfo:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId
      });
      res.status(500).json({ 
        message: 'Error fetching vehicle information',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async updateDriverStatus(req, res) {
    try {
      const { status } = req.body;
      const driverId = req.user.userId;
      console.log('Updating driver status:', { driverId, status });

      // Validate status
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Use "active" or "inactive".' });
      }

      // First, get the driver's database ID
      const [driverRows] = await this.pool.query(
        'SELECT id FROM drivers WHERE user_id = ?',
        [driverId]
      );

      if (driverRows.length === 0) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      const driverDbId = driverRows[0].id;

      const query = 'UPDATE drivers SET status = ? WHERE id = ?';
      console.log('Executing query with params:', { driverDbId, status });
      await this.pool.query(query, [status, driverDbId]);

      console.log('Driver status updated successfully for driver:', driverId);
      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error in updateDriverStatus:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId
      });
      res.status(500).json({ 
        message: 'Error updating status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getProfile(req, res) {
    try {
      console.log('Getting driver profile for user:', req.user.userId);
      
      // Get driver details including user info
      const [driverRows] = await this.pool.query(`
        SELECT 
          d.id,
          d.license_number,
          d.license_expiry,
          d.status,
          d.driver_rating,
          d.total_trips,
          u.name,
          u.email,
          u.phone,
          s.name as sacco_name,
          v.id as vehicle_id
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN saccos s ON d.sacco_id = s.id
        LEFT JOIN (
          SELECT driver_id, vehicle_id 
          FROM trips 
          WHERE status = 'in_progress' 
          ORDER BY departure_time DESC 
          LIMIT 1
        ) t ON d.id = t.driver_id
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        WHERE d.user_id = ?`,
        [req.user.userId]
      );

      if (driverRows.length === 0) {
        console.log('No driver profile found for user:', req.user.userId);
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      const driver = driverRows[0];
      console.log('Found driver profile:', driver);

      res.json({
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        status: driver.status || 'inactive',
        rating: Number(driver.driver_rating) || 0,
        trips_count: Number(driver.total_trips) || 0,
        sacco_name: driver.sacco_name,
        vehicle_id: driver.vehicle_id,
      });

    } catch (error) {
      console.error('Error in getProfile:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId
      });
      res.status(500).json({ 
        message: 'Error fetching driver profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default DriverDashboardController;