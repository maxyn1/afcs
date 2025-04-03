import express from 'express';
import AdminUserController from '../controllers/adminUserController.js';
import { connectDB } from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();
const getController = (() => {
  let adminUserController = null;
  let initPromise = null;

  return async () => {
    if (adminUserController) return adminUserController;
    
    if (!initPromise) {
      initPromise = (async () => {
        try {
          const pool = await connectDB();
          adminUserController = new AdminUserController(pool);
          return adminUserController;
        } catch (error) {
          console.error('Failed to initialize admin controller:', error);
          throw error;
        }
      })();
    }
    
    return await initPromise;
  };
})();

// Apply auth middlewares
router.use(authMiddleware());
router.use(adminMiddleware());

// User management routes with async handlers
router.get('/users', async (req, res) => {
  try {
    const controller = await getController();
    return controller.getAllUsers(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const controller = await getController();
    return controller.createUser(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const controller = await getController();
    return controller.updateUser(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const controller = await getController();
    return controller.deleteUser(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const controller = await getController();
    return controller.changeUserRole(req, res);
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
