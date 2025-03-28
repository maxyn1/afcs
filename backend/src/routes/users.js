import express from 'express';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import crypto from 'crypto';



const router = express.Router();

// Database connection pool
let pool;
async function getPool() {
  if (!pool) {
    pool = await mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

// User Registration Route
router.post('/register', async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phone, 
      password, 
      confirmPassword,
      role = 'passenger' // Default role
    } = req.body;

    // Detailed validation errors
    const errors = {};
    
    if (!fullName) errors.fullName = 'Full name is required';
    if (!email) errors.email = 'Email is required';
    if (!phone) errors.phone = 'Phone number is required';
    if (!password) errors.password = 'Password is required';
    if (!confirmPassword) errors.confirmPassword = 'Password confirmation is required';

    if (Object.keys(errors).length > 0) {
      console.error('Validation errors:', errors);
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { confirmPassword: 'Passwords do not match' }
      });
    }

    // Password strength validation
    const passwordErrors = [];
    if (password.length < 8) passwordErrors.push('at least 8 characters long');
    if (!/[A-Z]/.test(password)) passwordErrors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) passwordErrors.push('one lowercase letter');
    if (!/[0-9]/.test(password)) passwordErrors.push('one number');
    if (!/[!@#$%^&*]/.test(password)) passwordErrors.push('one special character');

    if (passwordErrors.length > 0) {
      return res.status(400).json({
        message: 'Password is too weak',
        errors: { password: `Password must contain ${passwordErrors.join(', ')}` }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Validation error: Invalid email format');
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate phone number (assuming Kenyan phone number format)
    const phoneRegex = /^(0|\+?254)[17]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      console.error('Validation error: Invalid phone number');
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const dbPool = await getPool();

    try {
      // Check if email already exists
      const [existingUsers] = await dbPool.query(
        'SELECT id FROM users WHERE email = ? OR phone = ?',
        [email, phone]
      );

      if (existingUsers.length > 0) {
        const errors = {};
        if (existingUsers.find(u => u.email === email)) errors.email = 'Email is already in use';
        if (existingUsers.find(u => u.phone === phone)) errors.phone = 'Phone number is already in use';
        return res.status(409).json({ message: 'Account already exists', errors });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const userId = crypto.randomUUID();

      // Insert new user
      const [result] = await dbPool.query(
        'INSERT INTO users (id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, fullName, email, phone, passwordHash, role, 'active']
      );



      




      if (result.affectedRows === 0) {
        console.error('Database error: Failed to insert user');
        return res.status(500).json({ message: 'Failed to register user' });
      }

      console.log('User registered successfully:', { userId: result.insertId });
      res.status(201).json({
        message: 'User registered successfully',
        userId: result.insertId
      });
    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      return res.status(500).json({
        message: 'Database error during registration',
        error: process.env.NODE_ENV === 'development' ? dbError.message : 'Internal server error'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// User Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Enhanced input validation
    const errors = {};
    if (!email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    const dbPool = await getPool();

    try {
      // Find user by email
      const [users] = await dbPool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          message: 'Authentication failed',
          errors: { email: 'No account found with this email' }
        });
      }

      const user = users[0];

      // Check account status
      if (user.status === 'inactive') {
        return res.status(403).json({
          message: 'Account inactive',
          errors: { account: 'Your account has been deactivated. Please contact support.' }
        });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({
          message: 'Account suspended',
          errors: { account: 'Your account has been suspended. Please contact support.' }
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          message: 'Authentication failed',
          errors: { password: 'Incorrect password' }
        });
      }

      // Update last login time
      await dbPool.query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          lastLogin: new Date()
        },
        config.jwtSecret || 'your-secret-key', // Use config secret or fallback
        { expiresIn: '24h' }
      );

      // Remove sensitive data from response
      const { password_hash, ...userResponse } = user;

      res.status(200).json({
        message: 'Login successful',
        user: {
          ...userResponse,
          token
        }
      });
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      res.status(500).json({
        message: 'An error occurred while processing your request',
        error: process.env.NODE_ENV === 'development' ? dbError.message : 'Internal server error'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;