import express from 'express';
import { driverOnly } from '../middleware/authMiddleware.js';
import { connectDB } from '../config/database.js';
import DriverDashboardController from '../controllers/driverDashboardController.js';
import DriverRoutesController from '../controllers/driverRoutesController.js';
import DriverTripsController from '../controllers/driverTripsController.js';

const router = express.Router();

// Initialize database connection
let pool;
(async () => {
  try {
    pool = await connectDB();
    console.log('[Driver Routes] Database pool initialized successfully');
  } catch (error) {
    console.error('[Driver Routes] Failed to initialize database pool:', error);
  }
})();

// Initialize controllers with pool
let driverController;
let driverRoutesController;
let tripsController;

(async () => {
  try {
    if (!pool) {
      pool = await connectDB();
    }
    driverController = new DriverDashboardController(pool);
    driverRoutesController = new DriverRoutesController(pool);
    tripsController = new DriverTripsController(pool);
    console.log('[Driver Routes] Controllers initialized successfully');
  } catch (error) {
    console.error('[Driver Routes] Failed to initialize controllers:', error);
  }
})();

// Debug middleware
router.use((req, res, next) => {
  console.log('[Driver Routes] Handling request:', {
    path: req.path,
    method: req.method,
    hasPool: !!pool,
    hasController: !!driverController
  });

  if (!pool) {
    console.error('[Driver Routes] Pool not initialized');
    return res.status(500).json({ message: 'Database connection not available' });
  }

  if (!driverController) {
    console.error('[Driver Routes] Driver controller not initialized');
    return res.status(500).json({ message: 'Server initialization error' });
  }

  next();
});

// Add debug middleware for route matching
router.use((req, res, next) => {
  console.log('[Driver Routes] Incoming request:', {
    path: req.path,
    method: req.method,
    params: req.params,
    query: req.query
  });
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

// Settings routes
router.get('/settings', driverOnly, (req, res) => 
  driverSettingsController.getSettings(req, res)
);

router.put('/settings', driverOnly, (req, res) => 
  driverSettingsController.updateSettings(req, res)
);

router.put('/settings/notifications', driverOnly, (req, res) => 
  driverSettingsController.updateNotifications(req, res)
);

router.put('/settings/password', driverOnly, (req, res) => 
  driverSettingsController.updatePassword(req, res)
);

router.post('/settings/logout-all', driverOnly, (req, res) => 
  driverSettingsController.logoutAllDevices(req, res)
);

router.delete('/settings/deactivate', driverOnly, (req, res) => 
  driverSettingsController.deactivateAccount(req, res)
);

// Message routes
router.get('/conversations', driverOnly, (req, res) => 
  driverMessagesController.getConversations(req, res)
);

router.get('/conversations/:conversationId/messages', driverOnly, (req, res) => 
  driverMessagesController.getMessages(req, res)
);

router.post('/conversations/:conversationId/messages', driverOnly, (req, res) => 
  driverMessagesController.sendMessage(req, res)
);

// Route endpoints
router.get('/routes', driverOnly, (req, res) => {
  if (!driverRoutesController) {
    return res.status(500).json({ message: 'Service unavailable' });
  }
  return driverRoutesController.getRoutes(req, res);
});

router.get('/api/driver/routes/active', driverOnly, (req, res) => {
  console.log('[Driver Routes] Handling active route request');
  if (!driverRoutesController) {
    return res.status(500).json({ message: 'Service unavailable' });
  }
  return driverRoutesController.getActiveRoute(req, res);
});

router.post('/routes/:routeId/start', driverOnly, (req, res) => {
  if (!driverRoutesController) {
    return res.status(500).json({ message: 'Service unavailable' });
  }
  return driverRoutesController.startRoute(req, res);
});

router.post('/routes/:routeId/end', driverOnly, (req, res) => {
  if (!driverRoutesController) {
    return res.status(500).json({ message: 'Service unavailable' });
  }
  return driverRoutesController.endRoute(req, res);
});

// Trips routes
router.get('/trips', driverOnly, (req, res) => {
  if (!tripsController) {
    return res.status(500).json({ message: 'Service unavailable' });
  }
  return tripsController.getTripHistory(req, res);
});

export default router;