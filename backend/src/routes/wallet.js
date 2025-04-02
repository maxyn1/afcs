import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { connectDB } from '../config/database.js';

const router = express.Router();
let pool;

// Initialize database connection
(async () => {
  try {
    pool = await connectDB();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

// Get wallet balance
router.get('/balance', authMiddleware(), async (req, res) => {
  try {
    const [user] = await pool.query(
      'SELECT balance FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ balance: user[0].balance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: 'Error fetching wallet balance' });
  }
});

// Get wallet transactions
router.get('/transactions', authMiddleware(), async (req, res) => {
  try {
    const [transactions] = await pool.query(
      `SELECT * FROM wallet_transactions 
       WHERE user_id = ? 
       ORDER BY transaction_time DESC 
       LIMIT 10`,
      [req.user.userId]
    );
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Top up wallet
router.post('/topup', authMiddleware(), async (req, res) => {
  const { amount, payment_method = 'mpesa' } = req.body;
  
  try {
    // Start transaction
    await pool.beginTransaction();

    // Create transaction record
    const [result] = await pool.query(
      `INSERT INTO wallet_transactions 
       (user_id, amount, transaction_type, payment_method, description) 
       VALUES (?, ?, 'top_up', ?, 'Wallet top up')`,
      [req.user.userId, amount, payment_method]
    );

    // Update user balance
    await pool.query(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amount, req.user.userId]
    );

    await pool.commit();
    res.json({ message: 'Top up successful' });
  } catch (error) {
    await pool.rollback();
    console.error('Top up error:', error);
    res.status(500).json({ message: 'Error processing top up' });
  }
});

export default router;
