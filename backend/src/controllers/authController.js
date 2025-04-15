import bcrypt from 'bcrypt';
import crypto from 'crypto';

import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import config from '../config/config.js';

const saltRounds = 10;

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role = 'user' } = req.body;

    // Check if user already exists
    const [existingUser] = await pool.query(
      'SELECT * FROM Users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate UUID for user ID
    const userId = crypto.randomUUID();

    // Insert new user
    await pool.query(
      'INSERT INTO Users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, fullName, email, hashedPassword, role, 'active']
    );

    // Create JWT token
    const token = jwt.sign(
      { userId, email, role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: userId, name: fullName, email, role },
      token
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Error registering user' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and get sacco_id based on role
    let params = [email];

    // First get user basic info and role
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      params
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    let saccoId = null;

    if (user.role === 'driver') {
      // Get sacco_id from drivers table
      const [driverRows] = await pool.query(
        'SELECT sacco_id FROM drivers WHERE user_id = ?',
        [user.id]
      );
      if (driverRows.length > 0) {
        saccoId = driverRows[0].sacco_id;
      }
    } else if (user.role === 'sacco_admin') {
      // Get sacco_id from saccos table by matching admin user
      // Assuming sacco_admin users have a link to sacco via a sacco_admins table or similar
      // Since no such table found, try to find sacco_id by user id in saccos or other logic
      // For now, try to find sacco_id from saccos where contact_email matches user email
      const [saccoRows] = await pool.query(
        'SELECT id FROM saccos WHERE contact_email = ?',
        [user.email]
      );
      if (saccoRows.length > 0) {
        saccoId = saccoRows[0].id;
      }
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Create JWT token including sacco_id
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, sacco_id: saccoId },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Error logging in' });
  }
};
