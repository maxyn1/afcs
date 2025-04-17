import crypto from 'crypto';
import bcrypt from 'bcrypt';

class AdminDriverController {
  constructor(pool) {
    this.pool = pool;
    console.log('[AdminDriverController] Initialized with pool:', !!pool);
  }

  async getAllDrivers(req, res) {
    try {
      const query = `
        SELECT 
          d.id,
          u.name,
          u.phone,
          u.email,
          d.license_number as licenseNumber,
          d.license_expiry as licenseExpiry,
          COALESCE(d.driver_rating, 0) as rating,
          COALESCE(d.total_trips, 0) as totalTrips,
          s.name as saccoName,
          u.status
        FROM users u
        JOIN drivers d ON u.id = d.user_id
        LEFT JOIN saccos s ON d.sacco_id = s.id
        WHERE u.role = 'driver'
        ORDER BY u.name ASC
      `;

      const [drivers] = await this.pool.query(query);
      
      if (!drivers || !Array.isArray(drivers)) {
        throw new Error('Invalid response from database');
      }

      const transformedDrivers = drivers.map(driver => ({
        id: driver.id,
        name: driver.name || 'Unknown',
        phone: driver.phone || '',
        email: driver.email || '',
        licenseNumber: driver.licenseNumber || '',
        licenseExpiry: driver.licenseExpiry || new Date().toISOString(),
        rating: Number(driver.rating) || 0,
        totalTrips: Number(driver.totalTrips) || 0,
        saccoName: driver.saccoName || 'Unassigned',
        status: driver.status || 'inactive'
      }));

      res.json(transformedDrivers);
    } catch (error) {
      console.error('[AdminDriverController] Error:', error);
      res.status(500).json({ 
        message: 'Error fetching drivers',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getDriverDetails(req, res) {
    try {
      const { id } = req.params;
      console.log('[AdminDriverController] Getting details for driver:', id);

      // Get current assigned vehicle (if any) from trips
      const vehicleQuery = `
        SELECT 
          v.id,
          v.registration_number,
          v.make,
          v.model,
          v.year,
          v.capacity,
          v.status
        FROM vehicles v
        JOIN trips t ON v.id = t.vehicle_id
        JOIN drivers d ON t.driver_id = d.id
        WHERE d.id = ? AND t.status = 'in_progress'
        ORDER BY t.departure_time DESC
        LIMIT 1
      `;
      
      const [vehicles] = await this.pool.query(vehicleQuery, [id]);
      const currentVehicle = vehicles.length > 0 ? vehicles[0] : null;

      const query = `
        SELECT 
          d.id,
          u.name,
          u.email,
          u.phone,
          d.license_number,
          d.license_expiry,
          d.driver_rating,
          d.total_trips,
          s.name as sacco_name,
          s.id as sacco_id,
          u.status
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN saccos s ON d.sacco_id = s.id
        WHERE d.id = ?
      `;

      console.log('[AdminDriverController] Executing query:', query);
      const [[driver]] = await this.pool.query(query, [id]);
      
      if (!driver) {
        console.log('[AdminDriverController] No driver found with id:', id);
        return res.status(404).json({ message: 'Driver not found' });
      }

      console.log('[AdminDriverController] Found driver:', driver);

      // Get past trip history
      const tripQuery = `
        SELECT 
          t.id as trip_id,
          r.start_location,
          r.end_location,
          t.departure_time,
          t.arrival_time,
          t.status,
          COUNT(b.id) as passenger_count
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN bookings b ON t.id = b.trip_id
        WHERE t.driver_id = ?
        GROUP BY t.id
        ORDER BY t.departure_time DESC
        LIMIT 10
      `;
      
      const [trips] = await this.pool.query(tripQuery, [id]);

      const transformedDriver = {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        licenseNumber: driver.license_number,
        licenseExpiry: driver.license_expiry,
        rating: Number(driver.driver_rating) || 0,
        totalTrips: Number(driver.total_trips) || 0,
        saccoName: driver.sacco_name || 'Unassigned',
        saccoId: driver.sacco_id,
        status: driver.status,
        vehicle: currentVehicle ? {
          id: currentVehicle.id,
          registrationNumber: currentVehicle.registration_number,
          make: currentVehicle.make,
          model: currentVehicle.model,
          year: currentVehicle.year,
          capacity: currentVehicle.capacity,
          status: currentVehicle.status
        } : null,
        recentTrips: trips.map(trip => ({
          id: trip.trip_id,
          route: `${trip.start_location} to ${trip.end_location}`,
          departureTime: trip.departure_time,
          arrivalTime: trip.arrival_time,
          status: trip.status,
          passengerCount: trip.passenger_count
        }))
      };

      console.log('[AdminDriverController] Transformed response:', transformedDriver);
      res.json(transformedDriver);
    } catch (error) {
      console.error('[AdminDriverController] Error fetching driver details:', error);
      res.status(500).json({ 
        message: 'Error fetching driver details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async createDriver(req, res) {
    try {
      console.log('Creating a new driver...');
      const { fullName, phone, email, licenseNumber, licenseExpiry, saccoId } = req.body;
      const userId = crypto.randomUUID();
      const defaultPassword = 'Driver@123'; // You might want to generate this randomly
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      console.log('Generated userId:', userId);
      console.log('Generated password hash:', passwordHash);

      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();
        console.log('Starting transaction...');
        
        // Create user account first with required fields based on schema
        await connection.query(
          'INSERT INTO users (id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, fullName, email, phone, passwordHash, 'driver', 'active']
        );

        console.log('User account created.');

        // Then create driver record with required fields based on schema
        const [result] = await connection.query(
          'INSERT INTO drivers (user_id, sacco_id, license_number, license_expiry) VALUES (?, ?, ?, ?)',
          [userId, saccoId, licenseNumber, licenseExpiry]
        );

        console.log('Driver record created with ID:', result.insertId);

        await connection.commit();
        console.log('Transaction committed.');

        res.status(201).json({
          message: 'Driver registered successfully',
          driverId: result.insertId,
          defaultPassword // In production, send this via SMS instead
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating driver - Details:', {
        message: error.message,
        stack: error.stack,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      res.status(500).json({ 
        message: 'Error creating driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async updateDriver(req, res) {
    try {
      console.log('Updating driver...');
      const { id } = req.params;
      const { fullName, email, phone, licenseNumber, licenseExpiry, saccoId, status } = req.body;

      console.log('Driver ID:', id);
      console.log('Update details:', { fullName, email, phone, licenseNumber, licenseExpiry, saccoId, status });

      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();
        console.log('Starting transaction...');

        // First get the user_id associated with this driver
        const [[driverData]] = await connection.query(
          'SELECT user_id FROM drivers WHERE id = ?',
          [id]
        );

        if (!driverData) {
          throw new Error(`Driver with ID ${id} not found`);
        }

        const userId = driverData.user_id;

        // Update user details
        await connection.query(
          'UPDATE users SET name = ?, email = ?, phone = ?, status = ? WHERE id = ?',
          [fullName, email, phone, status, userId]
        );

        console.log('User details updated.');

        // Update driver details
        await connection.query(
          'UPDATE drivers SET license_number = ?, license_expiry = ?, sacco_id = ? WHERE id = ?',
          [licenseNumber, licenseExpiry, saccoId, id]
        );

        console.log('Driver details updated.');

        await connection.commit();
        console.log('Transaction committed.');

        res.json({ message: 'Driver updated successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating driver - Details:', {
        message: error.message,
        stack: error.stack,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      res.status(500).json({ 
        message: 'Error updating driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async deleteDriver(req, res) {
    try {
      console.log('Deactivating driver...');
      const { id } = req.params;

      console.log('Driver ID:', id);

      // First get the user_id associated with this driver
      const [[driverData]] = await this.pool.query(
        'SELECT user_id FROM drivers WHERE id = ?',
        [id]
      );

      if (!driverData) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      const userId = driverData.user_id;

      // Instead of deleting, just deactivate the user account
      await this.pool.query(
        'UPDATE users SET status = ? WHERE id = ?',
        ['inactive', userId]
      );

      console.log('Driver deactivated successfully.');

      res.json({ message: 'Driver deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating driver - Details:', {
        message: error.message,
        stack: error.stack,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      res.status(500).json({ 
        message: 'Error deactivating driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default AdminDriverController;