import express from 'express';
import { driverOnly } from '../middleware/authMiddleware.js';
import { connectDB } from '../config/database.js';
import DriverDashboardController from '../controllers/driverDashboardController.js';

const router = express.Router();

// Initialize controller with proper error handling
let driverController;
(async () => {
  try {
    const pool = await connectDB();
    driverController = new DriverDashboardController(pool);
    console.log('Driver controller initialized successfully');
  } catch (error) {
    console.error('Failed to initialize driver controller:', error);
  }
})();

// Debug middleware
router.use((req, res, next) => {
  console.log('Driver Route:', {
    path: req.path,
    method: req.method,
    controller: !!driverController
  });
  
  if (!driverController) {
    console.error('Driver controller not initialized');
    return res.status(500).json({ message: 'Server initialization error' });
  }
  
  next();
});

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

// Profile route
router.get('/profile', driverOnly, (req, res) => 
  driverController.getProfile(req, res)
);

router.put('/profile', driverOnly, (req, res) => 
  driverController.updateProfile(req, res)
);

// License route
router.put('/license', driverOnly, (req, res) => 
  driverController.updateLicense(req, res)
);

// Change password route
router.post('/change-password', driverOnly, (req, res) => 
  driverController.changePassword(req, res)
);

export default router;