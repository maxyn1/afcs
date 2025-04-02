import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import crypto from 'crypto';

class UserController {
  constructor(pool) {
    this.pool = pool;
  }

  async register(req, res) {
    try {
      const { 
        fullName, 
        email, 
        phone, 
        password, 
        confirmPassword,
        role = 'passenger'
      } = req.body;

      // Validation logic
      const errors = this.validateRegistration(req.body);
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
      }

      // Check existing user
      const [existingUsers] = await this.pool.query(
        'SELECT id FROM users WHERE email = ? OR phone = ?',
        [email, phone]
      );

      if (existingUsers.length > 0) {
        const errors = {};
        if (existingUsers.find(u => u.email === email)) errors.email = 'Email is already in use';
        if (existingUsers.find(u => u.phone === phone)) errors.phone = 'Phone number is already in use';
        return res.status(409).json({ message: 'Account already exists', errors });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();

      const [result] = await this.pool.query(
        'INSERT INTO users (id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, fullName, email, phone, passwordHash, role, 'active']
      );

      res.status(201).json({
        message: 'User registered successfully',
        userId: result.insertId
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        message: 'Server error during registration',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const errors = this.validateLogin(req.body);
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
      }

      const [users] = await this.pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(401).json({
          message: 'Authentication failed',
          errors: { email: 'No account found with this email' }
        });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          message: 'Authentication failed',
          errors: { password: 'Incorrect password' }
        });
      }

      await this.pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

      const token = this.generateToken(user);
      const { password_hash, ...userResponse } = user;

      res.status(200).json({
        message: 'Login successful',
        user: { ...userResponse, token }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Helper methods
  validateRegistration(data) {
    const errors = {};
    const { fullName, email, phone, password, confirmPassword } = data;
    
    if (!fullName) errors.fullName = 'Full name is required';
    if (!email) errors.email = 'Email is required';
    if (!phone) errors.phone = 'Phone number is required';
    if (!password) errors.password = 'Password is required';
    if (!confirmPassword) errors.confirmPassword = 'Password confirmation is required';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    // Add more validation as needed
    return errors;
  }

  validateLogin(data) {
    const errors = {};
    const { email, password } = data;
    
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    
    return errors;
  }

  generateToken(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        lastLogin: new Date()
      },
      config.jwtSecret || 'your-secret-key',
      { expiresIn: '24h' }
    );
  }
}

export default UserController;
