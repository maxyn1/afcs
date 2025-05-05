import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import SaccoAdminDashboardController from '../controllers/saccoAdminDashboardController.js';
import AdminDriverController from '../controllers/adminDriverController.js';
import SaccoAdminDriverController from '../controllers/saccoAdminDriverController.js';
import SaccoAdminVehicleController from '../controllers/saccoAdminVehicleController.js';
import routesRouter from './routes.js';
import { connectDB } from '../config/database.js';

const router = express.Router();
const pool = await connectDB();
const saccoAdminDashboardController = new SaccoAdminDashboardController(pool);
const saccoAdminDriverController = new SaccoAdminDriverController(pool);
const saccoAdminVehicleController = new SaccoAdminVehicleController(pool);

// SACCO Admin Dashboard Stats
router.get('/dashboard-stats', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDashboardController.getDashboardStats(req, res));

// SACCO Admin Drivers
router.get('/drivers', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDriverController.getAllDrivers(req, res));
router.post('/drivers', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDriverController.createDriver(req, res));
router.put('/drivers/:id', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDriverController.updateDriver(req, res));
router.delete('/drivers/:id', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDriverController.deleteDriver(req, res));

import SaccoAdminPaymentController from '../controllers/saccoAdminPaymentController.js';
const saccoAdminPaymentController = new SaccoAdminPaymentController(pool);

// SACCO Admin Vehicles
router.get('/vehicles', authMiddleware(['sacco_admin']), (req, res) => saccoAdminVehicleController.getAllVehicles(req, res));

// SACCO Admin Payments
router.get('/payments', authMiddleware(['sacco_admin']), (req, res) => saccoAdminPaymentController.getPayments(req, res));
router.get('/payment-stats', authMiddleware(['sacco_admin']), (req, res) => saccoAdminPaymentController.getPaymentStats(req, res));

// SACCO Admin Routes
router.use('/routes', authMiddleware(['sacco_admin']), routesRouter);

export default router;

