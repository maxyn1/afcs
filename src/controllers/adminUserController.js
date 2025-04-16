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
          id,
          name,
          email,
          role,
          status,
          COALESCE(last_login, NOW()) as lastLogin,
          created_at as createdAt
         FROM users 
         ORDER BY created_at DESC`
      );

      const users = rows.map(user => ({
        ...user,
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
        createdAt: new Date(user.createdAt).toISOString()
      }));

      console.log('Formatted users:', users);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  }

  async createUser(req, res) {
    try {
      const { fullName, email, password, role = 'passenger', phone } = req.body;

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

      await this.pool.query(
        'INSERT INTO users (id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, fullName, email, phone, passwordHash, role, 'active']
      );

      res.status(201).json({
        message: 'User created successfully',
        user: { id: userId, name: fullName, email, role }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Error creating user' });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { fullName, email, phone, role, status } = req.body;

      const [result] = await this.pool.query(
        'UPDATE users SET name = ?, email = ?, phone = ?, role = ?, status = ? WHERE id = ?',
        [fullName, email, phone, role, status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error updating user' });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const [result] = await this.pool.query('DELETE FROM users WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error deleting user' });
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

  async getSaccoAdmins(req, res) {
    try {
      const [admins] = await this.pool.query(
        `SELECT id, name FROM users WHERE role = 'sacco_admin' AND status = 'active'`
      );
      res.json(admins);
    } catch (error) {
      console.error('Error fetching SACCO admins:', error);
      res.status(500).json({ message: 'Error fetching SACCO admins' });
    }
  }
}

export default AdminUserController;
