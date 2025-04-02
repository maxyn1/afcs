import express from 'express';
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

// Get vehicles by SACCO ID
router.get('/', async (req, res) => {
  const { saccoId } = req.query;
  
  if (!saccoId) {
    return res.status(400).json({ message: 'SACCO ID is required' });
  }

  try {
    console.log('Fetching vehicles for SACCO:', saccoId);
    const [vehicles] = await pool.query(
      `SELECT id, registration_number, capacity, status, sacco_id 
       FROM vehicles 
       WHERE sacco_id = ? AND status = 'active'`,
      [saccoId]
    );
    console.log('Found vehicles:', vehicles);
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
});

export default router;
