class DriverController {
  constructor(pool) {
    this.pool = pool;
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const [[driver]] = await this.pool.query(`
        SELECT 
          d.id,
          u.name,
          u.email,
          u.phone,
          d.license_number,
          d.license_expiry,
          d.driver_rating as rating,
          d.total_trips as trips_count,
          s.name as sacco_name,
          d.vehicle_id,
          d.status
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN saccos s ON d.sacco_id = s.id
        WHERE d.user_id = ?
      `, [userId]);

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      res.json(driver);
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  }

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
        const [[updatedProfile]] = await connection.query(`
          SELECT 
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
          WHERE d.user_id = ?
        `, [userId]);

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
