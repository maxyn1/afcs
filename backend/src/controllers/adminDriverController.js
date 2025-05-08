import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { AppError, logError } from '../utils/errorHandler.js';

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
      console.log('[AdminDriverController] Creating a new driver...');
      const { 
        fullName, email, phone, licenseNumber, licenseExpiry, saccoId,
        address, dateOfBirth, emergencyContact, initialStatus = 'active'
      } = req.body;

      // Enhanced validation with specific error messages
      const validationErrors = {};
      
      // Required fields validation
      if (!fullName) validationErrors.fullName = 'Full name is required';
      if (!email) validationErrors.email = 'Email is required';
      if (!phone) validationErrors.phone = 'Phone number is required';
      if (!licenseNumber) validationErrors.licenseNumber = 'License number is required';
      if (!licenseExpiry) validationErrors.licenseExpiry = 'License expiry date is required';
      if (!saccoId) validationErrors.saccoId = 'SACCO ID is required';

      // Format validations
      if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        validationErrors.email = 'Invalid email format';
      }

      if (phone && !phone.match(/^\+?[\d\s-]{10,}$/)) {
        validationErrors.phone = 'Invalid phone format (minimum 10 digits)';
      }

      if (licenseExpiry) {
        const expiryDate = new Date(licenseExpiry);
        if (isNaN(expiryDate.getTime())) {
          validationErrors.licenseExpiry = 'Invalid date format';
        } else if (expiryDate < new Date()) {
          validationErrors.licenseExpiry = 'License has already expired';
        }
      }

      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          validationErrors.dateOfBirth = 'Invalid date format';
        } else if (dob > new Date()) {
          validationErrors.dateOfBirth = 'Date of birth cannot be in the future';
        }
      }

      // System admin specific validation
      if (!['active', 'inactive', 'suspended'].includes(initialStatus)) {
        validationErrors.status = 'Invalid status. Must be active, inactive, or suspended';
      }

      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // System admin can create drivers for any SACCO that exists
        const [sacco] = await connection.query('SELECT id FROM saccos WHERE id = ?', [saccoId]);
        if (!sacco.length) {
          return res.status(400).json({
            success: false,
            message: 'SACCO not found',
            error: { saccoId: 'Specified SACCO does not exist' }
          });
        }

        // Check for existing contacts
        const [existingUser] = await connection.query(
          'SELECT id, email, phone FROM users WHERE email = ? OR phone = ?',
          [email, phone]
        );

        if (existingUser.length) {
          const errors = {};
          existingUser.forEach(u => {
            if (u.email === email) errors.email = 'Email already registered';
            if (u.phone === phone) errors.phone = 'Phone already registered';
          });
          return res.status(409).json({
            success: false,
            message: 'Contact information already in use',
            errors
          });
        }

        const upperLicenseNumber = licenseNumber.toUpperCase();
        const [existingLicense] = await connection.query(
          'SELECT id FROM drivers WHERE license_number = ?',
          [upperLicenseNumber]
        );

        if (existingLicense.length) {
          return res.status(409).json({
            success: false,
            message: 'License number already registered',
            error: { licenseNumber: 'This license number is already in use' }
          });
        }

        // Create records with admin-specified status
        const userId = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(upperLicenseNumber, 10);
        
        await connection.query(
          'INSERT INTO users (id, name, email, phone, password_hash, role, status, address, date_of_birth, emergency_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, fullName, email, phone, passwordHash, 'driver', initialStatus, address, dateOfBirth, emergencyContact]
        );

        const [result] = await connection.query(
          'INSERT INTO drivers (user_id, sacco_id, license_number, license_expiry, driver_rating, total_trips, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, saccoId, upperLicenseNumber, licenseExpiry, 0.00, 0, initialStatus]
        );

        await connection.commit();

        res.status(201).json({
          success: true,
          message: 'Driver registered successfully by system admin',
          data: {
            driverId: result.insertId,
            userId: userId,
            defaultPassword: upperLicenseNumber,
            defaultPasswordMessage: 'Please instruct the driver to change their password on first login',
            status: initialStatus
          }
        });
      } catch (error) {
        await connection.rollback();
        console.error('[AdminDriverController] Database error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create driver',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('[AdminDriverController] Unexpected error:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

      // Validation
      const validationErrors = {};

      if (!fullName) validationErrors.fullName = 'Full name is required';
      if (!email) validationErrors.email = 'Email is required';
      if (!phone) validationErrors.phone = 'Phone number is required';
      if (!licenseNumber) validationErrors.licenseNumber = 'License number is required';
      if (!licenseExpiry) validationErrors.licenseExpiry = 'License expiry date is required';
      if (!saccoId) validationErrors.saccoId = 'SACCO ID is required';

      // Format validations
      if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        validationErrors.email = 'Invalid email format';
      }

      if (phone && !phone.match(/^\+?[\d\s-]{10,}$/)) {
        validationErrors.phone = 'Invalid phone number format';
      }

      if (licenseExpiry) {
        const expiryDate = new Date(licenseExpiry);
        if (isNaN(expiryDate.getTime())) {
          validationErrors.licenseExpiry = 'Invalid date format';
        } else if (expiryDate < new Date()) {
          validationErrors.licenseExpiry = 'License has already expired';
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        throw new AppError(
          'Validation failed',
          400,
          { validation: validationErrors },
          'VALIDATION_ERROR'
        );
      }

      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // Verify driver exists
        const [[driverData]] = await connection.query(
          'SELECT user_id FROM drivers WHERE id = ?',
          [id]
        );

        if (!driverData) {
          throw new AppError(
            'Driver not found',
            404,
            { driverId: id },
            'DRIVER_NOT_FOUND'
          );
        }

        // Verify SACCO exists
        const [sacco] = await connection.query(
          'SELECT id, status FROM saccos WHERE id = ?',
          [saccoId]
        );

        if (sacco.length === 0) {
          throw new AppError(
            'SACCO not found',
            400,
            { saccoId: 'Specified SACCO does not exist' },
            'INVALID_SACCO'
          );
        }

        if (sacco[0].status !== 'active') {
          throw new AppError(
            'SACCO is not active',
            400,
            { saccoId: 'Specified SACCO is not active' },
            'INACTIVE_SACCO'
          );
        }

        // Check for duplicate contact info (excluding current driver)
        const userId = driverData.user_id;
        const [existingUser] = await connection.query(
          'SELECT id, email, phone FROM users WHERE (email = ? OR phone = ?) AND id != ?',
          [email, phone, userId]
        );

        existingUser.forEach(user => {
          if (user.email === email) {
            validationErrors.email = 'Email already registered to another user';
          }
          if (user.phone === phone) {
            validationErrors.phone = 'Phone number already registered to another user';
          }
        });

        if (Object.keys(validationErrors).length > 0) {
          throw new AppError(
            'Contact information already in use',
            400,
            { validation: validationErrors },
            'DUPLICATE_CONTACT'
          );
        }

        // Check for duplicate license number (excluding current driver)
        const [existingLicense] = await connection.query(
          'SELECT id FROM drivers WHERE license_number = ? AND id != ?',
          [licenseNumber, id]
        );

        if (existingLicense.length > 0) {
          throw new AppError(
            'License number already registered',
            400,
            { licenseNumber: 'This license number is already in use by another driver' },
            'DUPLICATE_LICENSE'
          );
        }

        // Update records
        await connection.query(
          'UPDATE users SET name = ?, email = ?, phone = ?, status = ?, address = ?, date_of_birth = ?, emergency_contact = ? WHERE id = ?',
          [fullName, email, phone, status, address, dateOfBirth, emergencyContact, userId]
        );

        await connection.query(
          'UPDATE drivers SET license_number = ?, license_expiry = ?, sacco_id = ? WHERE id = ?',
          [licenseNumber, licenseExpiry, saccoId, id]
        );

        await connection.commit();

        res.json({ 
          success: true,
          message: 'Driver updated successfully' 
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      const errorResponse = error instanceof AppError ? error : new AppError(
        'Failed to update driver',
        500,
        logError(error, {
          context: 'AdminDriverController.updateDriver',
          params: req.params,
          body: req.body
        }),
        'DRIVER_UPDATE_FAILED'
      );

      res.status(errorResponse.statusCode).json({
        success: false,
        message: errorResponse.message,
        errorCode: errorResponse.errorCode,
        details: errorResponse.details
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