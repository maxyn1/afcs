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

// Get all routes
router.get('/', async (req, res) => {
  try {
    const [routes] = await pool.query(
      `SELECT 
        r.id,
        r.start_location,
        r.end_location,
        r.base_fare,
        r.status,
        COUNT(DISTINCT v.id) as assigned_vehicles
      FROM routes r
      LEFT JOIN trips t ON r.id = t.route_id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id AND v.status = 'active'
      WHERE r.status = 'active'
      GROUP BY r.id`
    );
    
    const formattedRoutes = routes.map(route => ({
      id: route.id,
      name: `${route.start_location} - ${route.end_location}`,
      start_point: route.start_location,
      end_point: route.end_location,
      fare: route.base_fare,
      status: route.status || 'active',
      assigned_vehicles: Number(route.assigned_vehicles) || 0
    }));
    
    res.json(formattedRoutes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ 
      message: 'Error fetching routes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

export default router;
