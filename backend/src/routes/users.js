import express from 'express';
import UserController from '../controllers/userController.js';
import { connectDB } from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
let userController;

// Initialize controller
(async () => {
  try {
    const pool = await connectDB();
    userController = new UserController(pool);
  } catch (error) {
    console.error('Failed to initialize user controller:', error);
  }
})();

// Routes
router.post('/register', (req, res) => userController.register(req, res));
router.post('/login', (req, res) => userController.login(req, res));

// Profile routes - all protected by authentication
router.get('/profile', authMiddleware(), (req, res) => userController.getProfile(req, res));
router.put('/profile', authMiddleware(), (req, res) => userController.updateProfile(req, res));
router.post('/change-password', authMiddleware(), (req, res) => userController.changePassword(req, res));
router.delete('/profile', authMiddleware(), (req, res) => userController.deleteAccount(req, res));

export default router;