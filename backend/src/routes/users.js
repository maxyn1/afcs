import express from 'express';
import UserController from '../controllers/userController.js';
import { connectDB } from '../config/database.js';

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

export default router;