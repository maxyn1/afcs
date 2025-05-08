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
      `SELECT 
        v.id,
        v.registration_number,
        v.capacity,
        v.status,
        v.sacco_id,
        MAX(CASE 
          WHEN t.status = 'in_progress' THEN CONCAT(r.start_location, ' - ', r.end_location)
          ELSE NULL 
        END) as current_route
       FROM vehicles v
       LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = 'in_progress'
       LEFT JOIN routes r ON t.route_id = r.id
       WHERE v.sacco_id = ? AND v.status = 'active'
       GROUP BY v.id, v.registration_number, v.capacity, v.status, v.sacco_id`,
      [saccoId]
    );
    
    console.log('Found vehicles:', vehicles.length);
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ 
      message: 'Error fetching vehicles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
