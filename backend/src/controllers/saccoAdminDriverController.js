import crypto from 'crypto';
import bcrypt from 'bcrypt';

class SaccoAdminDriverController {
  constructor(pool) {
    this.pool = pool;
    console.log('[SaccoAdminDriverController] Initialized with pool:', !!pool);
  }

  async getAllDrivers(req, res) {
    try {
      const saccoId = req.user.saccoId; // Assuming saccoId is in user object from auth middleware
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
        WHERE u.role = 'driver' AND d.sacco_id = ?
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
        status: driver.status || 'inactive'
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
      const saccoId = req.user.saccoId; // sacco admin's saccoId from auth middleware
      const { fullName, phone, email, licenseNumber, licenseExpiry, address, dateOfBirth, emergencyContact } = req.body;
      const userId = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(licenseNumber, 10);

      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();
        console.log('Starting transaction...');
        
        // Create user account
        await connection.query(
          'INSERT INTO users (id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, fullName, email, phone, passwordHash, 'driver', 'active']
        );

        console.log('User account created.');

        // Create driver record with saccoId from sacco admin context
        const [result] = await connection.query(
          'INSERT INTO drivers (user_id, sacco_id, license_number, license_expiry, address, date_of_birth, emergency_contact) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, saccoId, licenseNumber, licenseExpiry, address, dateOfBirth, emergencyContact]
        );

        console.log('Driver record created with ID:', result.insertId);

        await connection.commit();
        console.log('Transaction committed.');

        res.status(201).json({
          message: 'Driver registered successfully',
          driverId: result.insertId,
          defaultPassword: licenseNumber // In production, send this via SMS instead
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
      const saccoId = req.user.saccoId;
      const driverId = req.params.id;
      const { fullName, phone, email, licenseNumber, licenseExpiry, address, dateOfBirth, emergencyContact, status } = req.body;

      const connection = await this.pool.getConnection();

      try {
        await connection.beginTransaction();

        // First check if driver exists
        const [driverExists] = await connection.query(
          'SELECT user_id FROM drivers WHERE id = ? AND sacco_id = ?',
          [driverId, saccoId]
        );

        if (!driverExists.length) {
          return res.status(404).json({ message: 'Driver not found' });
        }

        // Update users table
        await connection.query(
          'UPDATE users SET name = ?, phone = ?, email = ?, status = ? WHERE id = ?',
          [fullName, phone, email, status, driverExists[0].user_id]
        );

        // Update drivers table
        await connection.query(
          'UPDATE drivers SET license_number = ?, license_expiry = ?, address = ?, date_of_birth = ?, emergency_contact = ? WHERE id = ? AND sacco_id = ?',
          [licenseNumber, licenseExpiry, address, dateOfBirth, emergencyContact, driverId, saccoId]
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
      const saccoId = req.user.saccoId;
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

        // Delete from drivers table
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
}

export default SaccoAdminDriverController;
