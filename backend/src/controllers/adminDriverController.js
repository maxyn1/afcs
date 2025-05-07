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
          d.license_number as licenseNumber,
          d.license_expiry as licenseExpiry,
          d.driver_rating as rating,
          d.total_trips as totalTrips,
          d.status as driverStatus,
          d.vehicle_id,
          u.name,
          u.phone,
          u.email,
          u.status as accountStatus,
          u.address,
          u.date_of_birth,
          u.emergency_contact,
          s.name as saccoName,
          v.registration_number as vehicleNumber,
          v.make as vehicleMake,
          v.model as vehicleModel,
          v.status as vehicleStatus,
          COALESCE(
            (SELECT status FROM trips WHERE vehicle_id = v.id AND driver_id = d.id AND status = 'in_progress' LIMIT 1),
            'inactive'
          ) as trip_status
        FROM users u
        JOIN drivers d ON u.id = d.user_id
        LEFT JOIN saccos s ON d.sacco_id = s.id
        LEFT JOIN vehicles v ON d.vehicle_id = v.id
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
        status: driver.accountStatus || 'inactive',
        driverStatus: driver.driverStatus || 'inactive',
        address: driver.address || '',
        dateOfBirth: driver.date_of_birth ? new Date(driver.date_of_birth).toISOString() : null,
        emergencyContact: driver.emergency_contact || '',
        vehicle: driver.vehicle_id ? {
          id: driver.vehicle_id,
          registrationNumber: driver.vehicleNumber,
          make: driver.vehicleMake,
          model: driver.vehicleModel,
          status: driver.vehicleStatus,
          tripStatus: driver.trip_status
        } : null
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

      // Get assigned vehicle info
      const vehicleQuery = `
        SELECT 
          v.id,
          v.registration_number,
          v.make,
          v.model,
          v.year,
          v.capacity,
          v.status,
          COALESCE(
            (SELECT status FROM trips WHERE vehicle_id = v.id AND driver_id = d.id AND status = 'in_progress' LIMIT 1),
            'inactive'
          ) as trip_status
        FROM drivers d
        LEFT JOIN vehicles v ON d.vehicle_id = v.id
        WHERE d.id = ?
      `;
      
      const [vehicles] = await this.pool.query(vehicleQuery, [id]);
      const currentVehicle = vehicles.length > 0 && vehicles[0].id ? vehicles[0] : null;

      // Get driver details
      const query = `
        SELECT 
          d.id,
          d.license_number,
          d.license_expiry,
          d.driver_rating,
          d.total_trips,
          d.status as driver_status,
          d.vehicle_id,
          u.name,
          u.email,
          u.phone,
          u.status as account_status,
          u.address,
          u.date_of_birth,
          u.emergency_contact,
          s.name as sacco_name,
          s.id as sacco_id
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN saccos s ON d.sacco_id = s.id
        WHERE d.id = ?
      `;

      const [[driver]] = await this.pool.query(query, [id]);
      
      if (!driver) {
        console.log('[AdminDriverController] No driver found with id:', id);
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Get trip history
      const tripQuery = `
        SELECT 
          t.id as trip_id,
          r.start_location,
          r.end_location,
          t.departure_time,
          t.arrival_time,
          t.status,
          COUNT(b.id) as passenger_count,
          v.registration_number as vehicle_number
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN bookings b ON t.id = b.trip_id
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
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
        status: driver.account_status,
        driverStatus: driver.driver_status,
        address: driver.address,
        dateOfBirth: driver.date_of_birth ? new Date(driver.date_of_birth).toISOString() : null,
        emergencyContact: driver.emergency_contact,
        vehicle: currentVehicle ? {
          id: currentVehicle.id,
          registrationNumber: currentVehicle.registration_number,
          make: currentVehicle.make,
          model: currentVehicle.model,
          year: currentVehicle.year,
          capacity: currentVehicle.capacity,
          status: currentVehicle.status,
          tripStatus: currentVehicle.trip_status
        } : null,
        recentTrips: trips.map(trip => ({
          id: trip.trip_id,
          route: `${trip.start_location} to ${trip.end_location}`,
          departureTime: trip.departure_time,
          arrivalTime: trip.arrival_time,
          status: trip.status,
          passengerCount: trip.passenger_count,
          vehicleNumber: trip.vehicle_number
        }))
      };

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
      const { 
        fullName, 
        phone, 
        email, 
        licenseNumber, 
        licenseExpiry, 
        saccoId,
        address,
        dateOfBirth,
        emergencyContact
      } = req.body;
      
      // Validate required fields
      if (!fullName || !phone || !email || !licenseNumber || !licenseExpiry || !saccoId) {
        return res.status(400).json({ 
          message: 'Required fields missing',
          required: ['fullName', 'phone', 'email', 'licenseNumber', 'licenseExpiry', 'saccoId']
        });
      }

      // Validate email format
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Validate phone format
      if (!phone.match(/^\+?[\d\s-]{10,}$/)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }

      // Validate license expiry date
      const expiryDate = new Date(licenseExpiry);
      if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired license expiry date' });
      }

      const userId = crypto.randomUUID();
      const upperLicenseNumber = licenseNumber.toUpperCase();
      const passwordHash = await bcrypt.hash(upperLicenseNumber, 10);

      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // Verify SACCO exists
        const [sacco] = await connection.query(
          'SELECT id FROM saccos WHERE id = ? AND status = "active"',
          [saccoId]
        );

        if (sacco.length === 0) {
          return res.status(404).json({ message: 'SACCO not found or inactive' });
        }

        // Check for existing email or phone
        const [existingUser] = await connection.query(
          'SELECT id FROM users WHERE email = ? OR phone = ?',
          [email, phone]
        );

        if (existingUser.length > 0) {
          return res.status(409).json({ message: 'Email or phone number already registered' });
        }

        // Check for existing license number
        const [existingLicense] = await connection.query(
          'SELECT id FROM drivers WHERE license_number = ?',
          [upperLicenseNumber]
        );

        if (existingLicense.length > 0) {
          return res.status(409).json({ message: 'License number already registered' });
        }
        
        // Create user account with user-specific fields
        await connection.query(
          'INSERT INTO users (id, name, email, phone, password_hash, role, status, address, date_of_birth, emergency_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, fullName, email, phone, passwordHash, 'driver', 'active', address || null, dateOfBirth || null, emergencyContact || null]
        );
        
        // Create driver record with driver-specific fields
        const [result] = await connection.query(
          'INSERT INTO drivers (user_id, sacco_id, license_number, license_expiry, driver_rating, total_trips, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, saccoId, upperLicenseNumber, licenseExpiry, 0.00, 0, 'active']
        );

        await connection.commit();

        res.status(201).json({
          message: 'Driver registered successfully',
          driverId: result.insertId,
          defaultPassword: upperLicenseNumber,
          defaultPasswordMessage: 'Please instruct the driver to change their password on first login'
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
      const { 
        fullName, 
        email, 
        phone, 
        licenseNumber, 
        licenseExpiry, 
        saccoId, 
        status,
        address,
        dateOfBirth,
        emergencyContact
      } = req.body;

      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // First get the user_id associated with this driver
        const [[driverData]] = await connection.query(
          'SELECT user_id FROM drivers WHERE id = ?',
          [id]
        );

        if (!driverData) {
          throw new Error(`Driver with ID ${id} not found`);
        }

        const userId = driverData.user_id;

        // Update user-specific fields in users table
        await connection.query(
          'UPDATE users SET name = ?, email = ?, phone = ?, status = ?, address = ?, date_of_birth = ?, emergency_contact = ? WHERE id = ?',
          [fullName, email, phone, status, address, dateOfBirth, emergencyContact, userId]
        );

        // Update driver-specific fields in drivers table
        await connection.query(
          'UPDATE drivers SET license_number = ?, license_expiry = ?, sacco_id = ? WHERE id = ?',
          [licenseNumber, licenseExpiry, saccoId, id]
        );

        await connection.commit();

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

      // First get the user_id associated with this driver
      const [[driverData]] = await this.pool.query(
        'SELECT user_id FROM drivers WHERE id = ?',
        [id]
      );

      if (!driverData) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      const userId = driverData.user_id;

      // Instead of deleting, just deactivate both accounts
      await this.pool.query(
        'UPDATE users SET status = ? WHERE id = ?',
        ['inactive', userId]
      );

      await this.pool.query(
        'UPDATE drivers SET status = ? WHERE user_id = ?',
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