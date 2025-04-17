import express from 'express';
import { driverOnly } from '../middleware/authMiddleware.js';
import { connectDB } from '../config/database.js';
import DriverDashboardController from '../controllers/driverDashboardController.js';

const router = express.Router();
let pool;
let driverController;

(async () => {
  try {
    pool = await connectDB();
    driverController = new DriverDashboardController(pool);
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

// Dashboard stats route
router.get('/dashboard-stats', driverOnly, (req, res) => 
  driverController.getDashboardStats(req, res)
);

// Vehicle info route
router.get('/vehicle-info', driverOnly, (req, res) => 
  driverController.getVehicleInfo(req, res)
);

// Update driver status route
router.put('/status', driverOnly, (req, res) => 
  driverController.updateDriverStatus(req, res)
);

export default router;