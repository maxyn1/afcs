import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import SaccoAdminDashboardController from '../controllers/saccoAdminDashboardController.js';
import { connectDB } from '../config/database.js';

const router = express.Router();
const pool = await connectDB();
const saccoAdminDashboardController = new SaccoAdminDashboardController(pool);

// SACCO Admin Dashboard Stats
router.get('/sacco-admin/dashboard-stats', authMiddleware(), (req, res) => saccoAdminDashboardController.getDashboardStats(req, res));

export default router;