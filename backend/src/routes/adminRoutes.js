import express from 'express';
import AdminUserController from '../controllers/adminUserController.js';
import AdminVehicleController from '../controllers/adminVehicleController.js';
import DashboardController from '../controllers/dashboardController.js';
import { connectDB } from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import AdminDashboardController from '../controllers/AdminDashboardController.js';
import AdminDriverController from '../controllers/adminDriverController.js';
const router = express.Router();

// Controller factory with caching
const createControllerFactory = (ControllerClass) => {
  let controller = null;
  let initPromise = null;

  return async () => {
    if (controller) return controller;
    
    if (!initPromise) {
      initPromise = (async () => {
        try {
          const pool = await connectDB();
          controller = new ControllerClass(pool);
          return controller;
        } catch (error) {
          console.error('Failed to initialize controller:', error);
          throw error;
        }
      })();
    }
    
    return await initPromise;
  };
};

const getAdminUserController = createControllerFactory(AdminUserController);
const getAdminVehicleController = createControllerFactory(AdminVehicleController);
const getAdminDashboardController = createControllerFactory(AdminDashboardController);
const getAdminDriverController = createControllerFactory(AdminDriverController);

// Apply auth middlewares
router.use(authMiddleware());
router.use(adminMiddleware());

// Add debug middleware for drivers routes
const debugDriversRoute = (req, res, next) => {
  console.log('[AdminRoutes] Drivers route accessed:', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    }
  });
  next();
};

// User management routes - requires system_admin
router.use('/users', authMiddleware(['system_admin']));
router.get('/users', async (req, res) => {
  try {
    const controller = await getAdminUserController();
    return controller.getAllUsers(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const controller = await getAdminUserController();
    return controller.createUser(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const controller = await getAdminUserController();
    return controller.updateUser(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const controller = await getAdminUserController();
    return controller.deleteUser(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const controller = await getAdminUserController();
    return controller.changeUserRole(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Vehicle management routes
router.get('/vehicles', async (req, res) => {
  try {
    const controller = await getAdminVehicleController();
    return controller.getAllVehicles(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    const controller = await getAdminVehicleController();
    return controller.createVehicle(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/vehicles/:id', async (req, res) => {
  try {
    const controller = await getAdminVehicleController();
    return controller.updateVehicle(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/vehicles/:id', async (req, res) => {
  try {
    const controller = await getAdminVehicleController();
    return controller.deleteVehicle(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard stats route
router.get('/dashboard-stats', async (req, res) => {
  try {
    const controller = await getAdminDashboardController();
    return controller.getDashboardStats(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Driver management routes - requires system_admin
router.use('/drivers', authMiddleware(['system_admin']));
router.get('/drivers', debugDriversRoute, async (req, res) => {
  try {
    const controller = await getAdminDriverController();
    await controller.getAllDrivers(req, res);
  } catch (error) {
    console.error('[AdminRoutes] Error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch drivers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

router.get('/drivers/:id', debugDriversRoute, async (req, res) => {
  try {
    const controller = await getAdminDriverController();
    return controller.getDriverDetails(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/drivers', debugDriversRoute, async (req, res) => {
  try {
    const controller = await getAdminDriverController();
    return controller.createDriver(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/drivers/:id', debugDriversRoute, async (req, res) => {
  try {
    const controller = await getAdminDriverController();
    return controller.updateDriver(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/drivers/:id', debugDriversRoute, async (req, res) => {
  try {
    const controller = await getAdminDriverController();
    return controller.deleteDriver(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
