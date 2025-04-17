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
    console.log('Login attempt:', req.body); // Debugging: Log incoming request data

    const { email, password } = req.body;

    // Find user by email
    console.log('Querying user by email:', email); // Debugging: Log email being queried
    const [users] = await pool.query(
      'SELECT id, name, email, password_hash, role, status FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.warn('No user found for email:', email); // Debugging: Log if no user is found
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    console.log('User found:', user); // Debugging: Log user details

    // Check if the account is active
    if (user.status !== 'active') {
      console.warn('Inactive account for user ID:', user.id); // Debugging: Log inactive account
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Compare passwords
    console.log('Comparing passwords for user ID:', user.id); // Debugging: Log password comparison
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn('Password mismatch for user ID:', user.id); // Debugging: Log password mismatch
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Determine additional role-specific data
    let roleData = {};
    if (user.role === 'driver') {
      console.log('Fetching driver-specific data for user ID:', user.id); // Debugging: Log role-specific query
      const [driverRows] = await pool.query(
        'SELECT sacco_id FROM drivers WHERE user_id = ?',
        [user.id]
      );
      if (driverRows.length > 0) {
        roleData.sacco_id = driverRows[0].sacco_id;
      }
    } else if (user.role === 'sacco_admin') {
      console.log('Fetching sacco admin-specific data for email:', user.email); // Debugging: Log role-specific query
      const [saccoRows] = await pool.query(
        'SELECT id as sacco_id FROM saccos WHERE contact_email = ?',
        [user.email]
      );
      if (saccoRows.length > 0) {
        roleData.sacco_id = saccoRows[0].sacco_id;
      }
    }

    // Update last login timestamp
    console.log('Updating last login for user ID:', user.id); // Debugging: Log last login update
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Generate JWT token
    console.log('Generating JWT token for user ID:', user.id); // Debugging: Log token generation
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      ...roleData,
    };
    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '24h' });

    console.log('Login successful for user ID:', user.id); // Debugging: Log successful login
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...roleData,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message); // Debugging: Log error details
    res.status(500).json({ message: 'Error logging in' });
  }
};
