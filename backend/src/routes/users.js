import express from 'express';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

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
router.post('/api/users/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      console.error('Validation error: Missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      console.error('Validation error: Passwords do not match');
      return res.status(400).json({ message: 'Passwords do not match' });
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

    // Check password strength
    if (password.length < 8) {
      console.error('Validation error: Weak password');
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const dbPool = await getPool();

    // Check if email already exists
    const [existingUsers] = await dbPool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.error('Validation error: Email already in use');
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await dbPool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, phone, passwordHash, 'passenger']
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// User Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const dbPool = await getPool();

    // Find user by email
    const [users] = await dbPool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Remove sensitive information
    const { password_hash, ...userResponse } = user;

    res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

export default router;