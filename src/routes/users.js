import express from 'express';
import UserController from '../controllers/userController.js';
import UserDashboardController from '../controllers/userDashboardController.js';
import { connectDB } from '../config/database.js';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware.js';

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

const getUserController = createControllerFactory(UserController);
const getUserDashboardController = createControllerFactory(UserDashboardController);

// Public routes
router.post('/register', async (req, res) => {
  const controller = await getUserController();
  return controller.register(req, res);
});

router.post('/login', async (req, res) => {
  const controller = await getUserController();
  return controller.login(req, res);
});

// Protected routes with role-based access
router.get('/profile', authMiddleware(), async (req, res) => {
  const controller = await getUserController();
  return controller.getProfile(req, res);
});

router.put('/profile', authMiddleware(), async (req, res) => {
  const controller = await getUserController();
  return controller.updateProfile(req, res);
});

router.post('/change-password', authMiddleware(), async (req, res) => {
  const controller = await getUserController();
  return controller.changePassword(req, res);
});

router.delete('/profile', authMiddleware(), async (req, res) => {
  const controller = await getUserController();
  return controller.deleteAccount(req, res);
});

// Admin only routes
router.get('/all', adminOnly, async (req, res) => {
  const controller = await getUserController();
  return controller.getAllUsers(req, res);
});

// Dashboard routes
router.get('/dashboard/stats', authMiddleware(), async (req, res) => {
  try {
    const controller = await getUserDashboardController();
    return controller.getUserStats(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dashboard/recent-transactions', authMiddleware(), async (req, res) => {
  try {
    const controller = await getUserDashboardController();
    return controller.getRecentTransactions(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dashboard/frequent-routes', authMiddleware(), async (req, res) => {
  try {
    const controller = await getUserDashboardController();
    return controller.getFrequentRoutes(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;