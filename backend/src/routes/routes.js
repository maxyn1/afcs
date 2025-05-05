import express from 'express';
import { connectDB } from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import SaccoAdminRoutesController from '../controllers/saccoAdminRoutesController.js';

const router = express.Router();
let pool;
let saccoAdminRoutesController;

// Initialize database connection and controller
(async () => {
  try {
    pool = await connectDB();
    saccoAdminRoutesController = new SaccoAdminRoutesController(pool);
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

// Get all routes
router.get('/', async (req, res) => {
  try {
    const [routes] = await pool.query(
      `SELECT 
        id,
        start_location,
        end_location,
        base_fare,
        0 AS distance,
        'active' AS status,
        0 AS assigned_vehicles
      FROM routes`
    );
    
    const formattedRoutes = routes.map(route => ({
      id: route.id,
      name: `${route.start_location} - ${route.end_location}`,
      start_point: route.start_location,
      end_point: route.end_location,
      distance: route.distance,
      fare: route.base_fare,
      status: route.status,
      assigned_vehicles: route.assigned_vehicles
    }));
    
    res.json(formattedRoutes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ message: 'Error fetching routes' });
  }
});

// Create a new route
router.post('/', authMiddleware(['sacco_admin']), (req, res) => {
  saccoAdminRoutesController.createRoute(req, res);
});

// Update an existing route
router.put('/:id', authMiddleware(['sacco_admin']), (req, res) => {
  saccoAdminRoutesController.updateRoute(req, res);
});

export default router;
