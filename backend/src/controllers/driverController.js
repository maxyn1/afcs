import bcrypt from 'bcrypt';

class DriverController {
  constructor(pool) {
    this.pool = pool;
  }

  // CREATE - Register a new driver
  async createDriver(req, res) {
    try {
      const { name, email, phone, licenseNumber, licenseExpiry, saccoId } = req.body;
      const userId = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(licenseNumber, 10); // Using license number as initial password

      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();
        
        // Create user account
        await connection.query(
          'INSERT INTO users (id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, name, email, phone, passwordHash, 'driver', 'active']
        );

        // Create driver record
        const [result] = await connection.query(
          'INSERT INTO drivers (user_id, sacco_id, license_number, license_expiry, driver_rating, total_trips) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, saccoId, licenseNumber, licenseExpiry, 0.0, 0]
        );

        await connection.commit();
        res.status(201).json({
          message: 'Driver registered successfully',
          driverId: result.insertId
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({ message: 'Error creating driver' });
    }
  }

  // READ - Get driver profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const [[driver]] = await this.pool.query(
        `SELECT 
          d.id,
          u.name,
          u.email,
          u.phone,
          d.license_number,
          d.license_expiry,
          d.driver_rating as rating,
          d.total_trips as trips_count,
          s.name as sacco_name,
          d.status,
          d.vehicle_id
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN saccos s ON d.sacco_id = s.id
        WHERE d.user_id = ?`,
        [userId]
      );

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      res.json(driver);
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  }

  // UPDATE - Update driver profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { name, email, phone } = req.body;

      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();

        // Update user table
        await connection.query(
          'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
          [name, email, phone, userId]
        );

        // Get updated profile
        const [[updatedProfile]] = await connection.query(
          `SELECT 
            d.id,
            u.name,
            u.email,
            u.phone,
            d.license_number,
            d.license_expiry,
            d.driver_rating as rating,
            d.total_trips as trips_count,
            s.name as sacco_name,
            d.status
          FROM drivers d
          JOIN users u ON d.user_id = u.id
          LEFT JOIN saccos s ON d.sacco_id = s.id
          WHERE d.user_id = ?`,
          [userId]
        );

        await connection.commit();
        res.json(updatedProfile);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating driver profile:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  }

  // UPDATE - Update license information
  async updateLicense(req, res) {
    try {
      const userId = req.user.userId;
      const { license_number, license_expiry } = req.body;

      await this.pool.query(
        'UPDATE drivers SET license_number = ?, license_expiry = ? WHERE user_id = ?',
        [license_number, license_expiry, userId]
      );

      res.json({ message: 'License information updated successfully' });
    } catch (error) {
      console.error('Error updating license:', error);
      res.status(500).json({ message: 'Error updating license information' });
    }
  }

  // DELETE - Deactivate driver account
  async deleteAccount(req, res) {
    try {
      const userId = req.user.userId;
      const connection = await this.pool.getConnection();

      try {
        await connection.beginTransaction();

        // Deactivate user account
        await connection.query(
          'UPDATE users SET status = ? WHERE id = ?',
          ['inactive', userId]
        );

        // Deactivate driver record
        await connection.query(
          'UPDATE drivers SET status = ? WHERE user_id = ?',
          ['inactive', userId]
        );

        await connection.commit();
        res.json({ message: 'Account deactivated successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error deactivating account:', error);
      res.status(500).json({ message: 'Error deactivating account' });
    }
  }

  async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { oldPassword, newPassword } = req.body;

      const [[user]] = await this.pool.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await this.pool.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newPasswordHash, userId]
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Error changing password' });
    }
  }
}

export default DriverController;
