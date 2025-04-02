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

// Get all SACCOs
router.get('/', async (req, res) => {
  try {
    const [saccos] = await pool.query(
      'SELECT id, name, registration_number, status FROM saccos WHERE status = ?',
      ['active']
    );
    res.json(saccos);
  } catch (error) {
    console.error('Error fetching SACCOs:', error);
    res.status(500).json({ message: 'Error fetching SACCOs' });
  }
});

export default router;
