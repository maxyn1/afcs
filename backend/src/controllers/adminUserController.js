import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class AdminUserController {
  constructor(pool) {
    this.pool = pool;
  }

  async getAllUsers(req, res) {
    try {
      console.log('Fetching all users...');
      const [rows] = await this.pool.query(
        `SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.role,
          u.status,
          u.balance,
          u.created_at as createdAt,
          u.last_login as lastLogin,
          s.id as saccoId,
          s.name as saccoName,
          s.registration_number as saccoRegistrationNumber,
          s.contact_email as saccoEmail,
          s.contact_phone as saccoPhone,
          s.status as saccoStatus,
          d.id as driverId,
          d.license_number as licenseNumber,
          d.license_expiry as licenseExpiry,
          d.driver_rating as driverRating,
          d.total_trips as totalTrips,
          d.status as driverStatus,
          v.id as vehicleId,
          v.registration_number as vehicleNumber,
          v.status as vehicleStatus
         FROM users u
         LEFT JOIN saccos s ON s.managed_by = u.id
         LEFT JOIN drivers d ON u.id = d.user_id 
         LEFT JOIN vehicles v ON v.id = d.id
         ORDER BY u.created_at DESC`
      );

      const users = rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        balance: parseFloat(user.balance || 0),
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
        createdAt: new Date(user.createdAt).toISOString(),
        // Include SACCO details if user is a sacco_admin
        ...(user.role === 'sacco_admin' ? {
          saccoId: user.saccoId,
          saccoName: user.saccoName,
          saccoRegistrationNumber: user.saccoRegistrationNumber,
          saccoEmail: user.saccoEmail,
          saccoPhone: user.saccoPhone,
          saccoStatus: user.saccoStatus
        } : {}),
        // Include driver details if user is a driver
        ...(user.role === 'driver' ? {
          driverId: user.driverId,
          licenseNumber: user.licenseNumber,
          licenseExpiry: user.licenseExpiry ? new Date(user.licenseExpiry).toISOString() : null,
          driverRating: parseFloat(user.driverRating || 0),
          totalTrips: parseInt(user.totalTrips || 0, 10),
          driverStatus: user.driverStatus,
          vehicleId: user.vehicleId,
          vehicleNumber: user.vehicleNumber,
          vehicleStatus: user.vehicleStatus
        } : {})
      }));

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  }

  async createUser(req, res) {
    try {
      const { 
        fullName, 
        email, 
        phone, 
        password,
        role = 'passenger'
      } = req.body;

      // Validate role
      const validRoles = ['passenger', 'driver', 'sacco_admin', 'system_admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          message: 'Invalid role',
          error: `Role must be one of: ${validRoles.join(', ')}`
        });
      }

      // Check existing user
      const [existingUsers] = await this.pool.query(
        'SELECT id FROM users WHERE email = ? OR phone = ?',
        [email, phone]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({ 
          message: 'User already exists',
          error: 'Email or phone number already in use'
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();

      // Start transaction
      const connection = await this.pool.getConnection();
      await connection.beginTransaction();

      try {
        // Insert user with correct schema fields
        await connection.query(
          `INSERT INTO users (
            id, 
            name, 
            email, 
            phone, 
            password_hash, 
            role, 
            status, 
            balance, 
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [userId, fullName, email, phone, passwordHash, role, 'active', 0.00]
        );

        // If user is a driver, create driver record
        if (role === 'driver') {
          const { licenseNumber, licenseExpiry, saccoId } = req.body;
          
          if (!licenseNumber || !licenseExpiry) {
            throw new Error('License information required for drivers');
          }

          await connection.query(
            `INSERT INTO drivers (
              user_id, 
              sacco_id,
              license_number, 
              license_expiry, 
              driver_rating,
              total_trips,
              status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, saccoId, licenseNumber, licenseExpiry, 0.00, 0, 'active']
          );
        }

        // If user is a sacco_admin, update sacco's managed_by field
        if (role === 'sacco_admin') {
          const { saccoId } = req.body;
          if (!saccoId) {
            throw new Error('SACCO ID is required for SACCO admin users');
          }

          await connection.query(
            'UPDATE saccos SET managed_by = ? WHERE id = ?',
            [userId, saccoId]
          );
        }

        await connection.commit();
        res.status(201).json({
          message: 'User created successfully',
          user: { 
            id: userId, 
            name: fullName, 
            email, 
            role,
            status: 'active',
            balance: 0.00,
            createdAt: new Date().toISOString()
          }
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ 
        message: 'Error creating user',
        error: error.message 
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { 
        fullName, 
        email, 
        phone, 
        role, 
        status,
        licenseNumber,
        licenseExpiry,
        saccoId
      } = req.body;

      // Validate role and status
      const validRoles = ['passenger', 'driver', 'sacco_admin', 'system_admin'];
      const validStatus = ['active', 'inactive', 'suspended'];
      
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ 
          message: 'Invalid role',
          error: `Role must be one of: ${validRoles.join(', ')}`
        });
      }

      if (status && !validStatus.includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status',
          error: `Status must be one of: ${validStatus.join(', ')}`
        });
      }

      const connection = await this.pool.getConnection();
      await connection.beginTransaction();

      try {
        // Get current user data
        const [currentUser] = await connection.query(
          'SELECT role, status FROM users WHERE id = ?',
          [id]
        );

        if (currentUser.length === 0) {
          await connection.rollback();
          return res.status(404).json({ message: 'User not found' });
        }

        // Update user basic information
        const updateFields = [];
        const updateValues = [];

        if (fullName) {
          updateFields.push('name = ?');
          updateValues.push(fullName);
        }
        if (email) {
          updateFields.push('email = ?');
          updateValues.push(email);
        }
        if (phone) {
          updateFields.push('phone = ?');
          updateValues.push(phone);
        }
        if (role) {
          updateFields.push('role = ?');
          updateValues.push(role);
        }
        if (status) {
          updateFields.push('status = ?');
          updateValues.push(status);
        }

        if (updateFields.length > 0) {
          updateValues.push(id);
          await connection.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
          );
        }

        // Handle driver-specific updates
        if (role === 'driver' || currentUser[0].role === 'driver') {
          const [existingDriver] = await connection.query(
            'SELECT id FROM drivers WHERE user_id = ?',
            [id]
          );

          if (role === 'driver') {
            // Validate driver-specific fields only if creating a new driver record
            if (existingDriver.length === 0) {
              if (licenseNumber === undefined || licenseExpiry === undefined) {
                throw new Error('License information required for new drivers');
              }
              // Create new driver record
              await connection.query(
                `INSERT INTO drivers (
                  user_id, 
                  sacco_id,
                  license_number, 
                  license_expiry, 
                  driver_rating,
                  total_trips,
                  status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, saccoId, licenseNumber, licenseExpiry, 0.00, 0, 'active']
              );
            } else {
              // Update existing driver record
              const driverUpdateFields = [];
              const driverUpdateValues = [];

              if (licenseNumber !== undefined) {
                driverUpdateFields.push('license_number = ?');
                driverUpdateValues.push(licenseNumber);
              }
              if (licenseExpiry !== undefined) {
                driverUpdateFields.push('license_expiry = ?');
                driverUpdateValues.push(licenseExpiry);
              }
              if (saccoId !== undefined) {
                driverUpdateFields.push('sacco_id = ?');
                driverUpdateValues.push(saccoId);
              }
              if (status !== undefined) {
                driverUpdateFields.push('status = ?');
                driverUpdateValues.push(status);
              }

              if (driverUpdateFields.length > 0) {
                driverUpdateValues.push(id);
                await connection.query(
                  `UPDATE drivers SET ${driverUpdateFields.join(', ')} WHERE user_id = ?`,
                  driverUpdateValues
                );
              }
            }
          } else if (currentUser[0].role === 'driver' && role !== 'driver') {
            // If user was a driver but isn't anymore, remove driver record
            await connection.query(
              'DELETE FROM drivers WHERE user_id = ?',
              [id]
            );
          }
        }

        // Handle sacco_admin-specific updates
        if (role === 'sacco_admin' || currentUser[0].role === 'sacco_admin') {
          if (role === 'sacco_admin') {
            if (!saccoId) {
              throw new Error('SACCO ID is required for SACCO admin users');
            }
            // Update or set the sacco's managed_by field
            await connection.query(
              'UPDATE saccos SET managed_by = ? WHERE id = ?',
              [id, saccoId]
            );
          } else if (currentUser[0].role === 'sacco_admin' && role !== 'sacco_admin') {
            // If user was a sacco_admin but isn't anymore, remove the managed_by reference
            await connection.query(
              'UPDATE saccos SET managed_by = NULL WHERE managed_by = ?',
              [id]
            );
          }
        }

        await connection.commit();
        res.json({ 
          message: 'User updated successfully',
          userId: id
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ 
        message: 'Error updating user',
        error: error.message
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const connection = await this.pool.getConnection();
      await connection.beginTransaction();

      try {
        // Check user role first
        const [user] = await connection.query(
          'SELECT role FROM users WHERE id = ?',
          [id]
        );

        if (user.length === 0) {
          await connection.rollback();
          return res.status(404).json({ message: 'User not found' });
        }

        // Handle SACCO admin relationships
        if (user[0].role === 'sacco_admin') {
          // Remove managed_by reference from saccos
          await connection.query(
            'UPDATE saccos SET managed_by = NULL WHERE managed_by = ?',
            [id]
          );
        }

        // Handle driver relationships
        if (user[0].role === 'driver') {
          // Update any vehicles assigned to this driver
          await connection.query(
            'UPDATE vehicles SET status = "active" WHERE id IN (SELECT vehicle_id FROM drivers WHERE user_id = ?)',
            [id]
          );
          
          // Delete driver record
          await connection.query(
            'DELETE FROM drivers WHERE user_id = ?',
            [id]
          );
        }

        // Delete wallet transactions
        await connection.query(
          'DELETE FROM wallet_transactions WHERE user_id = ?',
          [id]
        );

        // Delete bookings
        await connection.query(
          'DELETE FROM bookings WHERE user_id = ?',
          [id]
        );

        // Delete feedback
        await connection.query(
          'DELETE FROM feedback WHERE user_id = ?',
          [id]
        );

        // Finally delete the user
        const [result] = await connection.query(
          'DELETE FROM users WHERE id = ?',
          [id]
        );

        if (result.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({ message: 'User not found' });
        }

        await connection.commit();
        res.json({ 
          message: 'User and all related records deleted successfully',
          userId: id
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        message: 'Error deleting user',
        error: error.message
      });
    }
  }

  async changeUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const [result] = await this.pool.query(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Error changing user role:', error);
      res.status(500).json({ message: 'Error changing user role' });
    }
  }
}

export default AdminUserController;
