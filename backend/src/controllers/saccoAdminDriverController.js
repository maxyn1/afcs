import crypto from 'crypto';
import bcrypt from 'bcrypt';

class SaccoAdminDriverController {
  constructor(pool) {
    this.pool = pool;
    console.log('[SaccoAdminDriverController] Initialized with pool:', !!pool);
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
      console.error('[SaccoAdminDriverController] Error getting saccoId from userId:', error);
      throw error;
    }
  }

  async getAllDrivers(req, res) {
    try {
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Get the saccoId for this user
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      const query = `
        SELECT 
          d.id,
          d.license_number as licenseNumber,
          d.license_expiry as licenseExpiry,
          d.driver_rating as rating,
          d.total_trips as totalTrips,
          d.status as driverStatus,
          u.name,
          u.phone,
          u.email,
          u.status as accountStatus,
          u.address,
          u.date_of_birth,
          u.emergency_contact,
          s.name as saccoName
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN saccos s ON d.sacco_id = s.id
        WHERE d.sacco_id = ?
        ORDER BY u.name ASC
      `;

      const [drivers] = await this.pool.query(query, [saccoId]);
      
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
        emergencyContact: driver.emergency_contact || ''
      }));

      res.json(transformedDrivers);
    } catch (error) {
      console.error('[SaccoAdminDriverController] Error:', error);
      res.status(500).json({ 
        message: 'Error fetching drivers',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async createDriver(req, res) {
    try {
      console.log('[SaccoAdminDriverController] Creating a new driver...');
      
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Get the saccoId for this user
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }
      
      const { 
        fullName, 
        phone, 
        email, 
        licenseNumber, 
        licenseExpiry,
        address,
        dateOfBirth,
        emergencyContact 
      } = req.body;
      
      // Validate required fields
      if (!fullName || !phone || !email || !licenseNumber || !licenseExpiry) {
        return res.status(400).json({ 
          message: 'Required fields missing',
          required: ['fullName', 'phone', 'email', 'licenseNumber', 'licenseExpiry']
        });
      }

      // Validate email format
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Validate phone format (adjust regex as needed for your region)
      if (!phone.match(/^\+?[\d\s-]{10,}$/)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }

      // Validate license expiry date
      const expiryDate = new Date(licenseExpiry);
      if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired license expiry date' });
      }

      const newUserId = crypto.randomUUID();
      const upperLicenseNumber = licenseNumber.toUpperCase();
      const passwordHash = await bcrypt.hash(upperLicenseNumber, 10);

      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();

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
          [newUserId, fullName, email, phone, passwordHash, 'driver', 'active', address || null, dateOfBirth || null, emergencyContact || null]
        );

        // Create driver record with driver-specific fields
        const [result] = await connection.query(
          'INSERT INTO drivers (user_id, sacco_id, license_number, license_expiry, driver_rating, total_trips, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [newUserId, saccoId, upperLicenseNumber, licenseExpiry, 0.00, 0, 'active']
        );

        await connection.commit();

        res.status(201).json({
          message: 'Driver registered successfully',
          driverId: result.insertId,
          defaultPassword: upperLicenseNumber,
          defaultPasswordMessage: 'Please change this password on first login'
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('[SaccoAdminDriverController] Error creating driver:', error);
      res.status(500).json({ 
        message: 'Error creating driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async updateDriver(req, res) {
    try {
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Get the saccoId for this user
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }
      
      const driverId = req.params.id;
      const { 
        fullName, 
        phone, 
        email, 
        licenseNumber, 
        licenseExpiry, 
        address, 
        dateOfBirth, 
        emergencyContact, 
        status 
      } = req.body;

      const connection = await this.pool.getConnection();

      try {
        await connection.beginTransaction();

        // First check if driver exists and get user_id
        const [driverExists] = await connection.query(
          'SELECT user_id FROM drivers WHERE id = ? AND sacco_id = ?',
          [driverId, saccoId]
        );

        if (!driverExists.length) {
          return res.status(404).json({ message: 'Driver not found' });
        }

        // Update user-specific fields in users table
        await connection.query(
          'UPDATE users SET name = ?, phone = ?, email = ?, status = ?, address = ?, date_of_birth = ?, emergency_contact = ? WHERE id = ?',
          [fullName, phone, email, status, address, dateOfBirth, emergencyContact, driverExists[0].user_id]
        );

        // Update driver-specific fields in drivers table
        await connection.query(
          'UPDATE drivers SET license_number = ?, license_expiry = ? WHERE id = ? AND sacco_id = ?',
          [licenseNumber, licenseExpiry, driverId, saccoId]
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
      console.error('[SaccoAdminDriverController] Error updating driver:', error);
      res.status(500).json({
        message: 'Error updating driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async deleteDriver(req, res) {
    try {
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Get the saccoId for this user
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }
      
      const driverId = req.params.id;

      const connection = await this.pool.getConnection();

      try {
        await connection.beginTransaction();

        // First get the user_id
        const [driver] = await connection.query(
          'SELECT user_id FROM drivers WHERE id = ? AND sacco_id = ?',
          [driverId, saccoId]
        );

        if (!driver.length) {
          return res.status(404).json({ message: 'Driver not found' });
        }

        const userId = driver[0].user_id;

        // Delete from drivers table first (due to foreign key constraint)
        await connection.query(
          'DELETE FROM drivers WHERE id = ? AND sacco_id = ?',
          [driverId, saccoId]
        );

        // Delete from users table
        await connection.query(
          'DELETE FROM users WHERE id = ?',
          [userId]
        );

        await connection.commit();
        res.json({ message: 'Driver deleted successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('[SaccoAdminDriverController] Error deleting driver:', error);
      res.status(500).json({
        message: 'Error deleting driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Add a new method to get SACCO details
  async getSaccoDetails(req, res) {
    try {
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Query to get SACCO details for the current admin
      const query = `
        SELECT 
          s.id,
          s.name,
          s.registration_number,
          s.contact_email,
          s.contact_phone,
          s.address,
          s.founded_date,
          s.status,
          s.total_vehicles,
          COUNT(DISTINCT d.id) as total_drivers,
          COUNT(DISTINCT v.id) as active_vehicles
        FROM saccos s
        LEFT JOIN drivers d ON s.id = d.sacco_id AND d.status = 'active'
        LEFT JOIN vehicles v ON s.id = v.sacco_id AND v.status = 'active'
        WHERE s.managed_by = ?
        GROUP BY s.id
      `;

      const [saccos] = await this.pool.query(query, [userId]);
      
      if (!saccos || saccos.length === 0) {
        return res.status(404).json({ message: 'No SACCO found for this admin' });
      }

      const sacco = {
        id: saccos[0].id,
        name: saccos[0].name || 'Unknown',
        registrationNumber: saccos[0].registration_number || '',
        contactEmail: saccos[0].contact_email || '',
        contactPhone: saccos[0].contact_phone || '',
        address: saccos[0].address || '',
        foundedDate: saccos[0].founded_date ? new Date(saccos[0].founded_date).toISOString() : null,
        status: saccos[0].status || 'inactive',
        totalVehicles: Number(saccos[0].total_vehicles) || 0,
        totalDrivers: Number(saccos[0].total_drivers) || 0,
        activeVehicles: Number(saccos[0].active_vehicles) || 0
      };

      res.json(sacco);
    } catch (error) {
      console.error('[SaccoAdminDriverController] Error getting SACCO details:', error);
      res.status(500).json({ 
        message: 'Error fetching SACCO details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default SaccoAdminDriverController;