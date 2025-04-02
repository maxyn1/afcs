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

export default router;
