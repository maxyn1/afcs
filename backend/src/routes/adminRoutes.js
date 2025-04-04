import express from 'express';
import AdminUserController from '../controllers/adminUserController.js';
import AdminVehicleController from '../controllers/adminVehicleController.js';
import { connectDB } from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import AdminDashboardController from '../controllers/AdminDashboardController.js';
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

// Apply auth middlewares
router.use(authMiddleware());
router.use(adminMiddleware());

// User management routes
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


// Add this to the controller factory section
const getAdminDashboardController = createControllerFactory(AdminDashboardController);

// Add this route
router.get('/dashboard-stats', async (req, res) => {
  try {
    const controller = await getAdminDashboardController();
    return controller.getDashboardStats(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
