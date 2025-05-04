import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import SaccoAdminDashboardController from '../controllers/saccoAdminDashboardController.js';
import AdminDriverController from '../controllers/adminDriverController.js';
import AdminVehicleController from '../controllers/adminVehicleController.js';
import SaccoAdminDriverController from '../controllers/saccoAdminDriverController.js';
import routesRouter from './routes.js';
import { connectDB } from '../config/database.js';

const router = express.Router();
const pool = await connectDB();
const saccoAdminDashboardController = new SaccoAdminDashboardController(pool);
const saccoAdminDriverController = new SaccoAdminDriverController(pool);
const adminVehicleController = new AdminVehicleController(pool);

// SACCO Admin Dashboard Stats
router.get('/dashboard-stats', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDashboardController.getDashboardStats(req, res));

// SACCO Admin Drivers
router.get('/drivers', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDriverController.getAllDrivers(req, res));
router.post('/drivers', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDriverController.createDriver(req, res));

// SACCO Admin Vehicles
router.get('/vehicles', authMiddleware(['sacco_admin']), (req, res) => adminVehicleController.getAllVehicles(req, res));

// SACCO Admin Routes
router.use('/routes', authMiddleware(['sacco_admin']), routesRouter);

export default router;
