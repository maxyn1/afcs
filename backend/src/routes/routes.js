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

// Get all routes
router.get('/', async (req, res) => {
  try {
    const [routes] = await pool.query(
      'SELECT id, start_location, end_location, base_fare FROM routes'
    );
    
    const formattedRoutes = routes.map(route => ({
      route: `${route.start_location} - ${route.end_location}`,
      fare: route.base_fare
    }));
    
    res.json(formattedRoutes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ message: 'Error fetching routes' });
  }
});

export default router;
