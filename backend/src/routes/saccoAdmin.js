import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import SaccoAdminDashboardController from '../controllers/saccoAdminDashboardController.js';
import AdminDriverController from '../controllers/adminDriverController.js';
import SaccoAdminDriverController from '../controllers/saccoAdminDriverController.js';
import SaccoAdminVehicleController from '../controllers/saccoAdminVehicleController.js';
import SaccoAdminPaymentController from '../controllers/saccoAdminPaymentController.js';
import SaccoAdminRoutesController from '../controllers/saccoAdminRoutesController.js';
import routesRouter from './routes.js';
import { connectDB } from '../config/database.js';

const router = express.Router();
const pool = await connectDB();
const saccoAdminDashboardController = new SaccoAdminDashboardController(pool);
const saccoAdminDriverController = new SaccoAdminDriverController(pool);
const saccoAdminVehicleController = new SaccoAdminVehicleController(pool);
const saccoAdminPaymentController = new SaccoAdminPaymentController(pool);
const saccoAdminRoutesController = new SaccoAdminRoutesController(pool);

// SACCO Admin Dashboard Stats
router.get('/dashboard-stats', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDashboardController.getDashboardStats(req, res));

// SACCO Admin Drivers
router.get('/drivers', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDriverController.getAllDrivers(req, res));
router.post('/drivers', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDriverController.createDriver(req, res));
router.put('/drivers/:id', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDriverController.updateDriver(req, res));
router.delete('/drivers/:id', authMiddleware(['sacco_admin']), (req, res) => saccoAdminDriverController.deleteDriver(req, res));

// SACCO Admin Vehicles
router.get('/vehicles', authMiddleware(['sacco_admin']), (req, res) => saccoAdminVehicleController.getAllVehicles(req, res));
router.post('/vehicles', authMiddleware(['sacco_admin']), (req, res) => saccoAdminVehicleController.createVehicle(req, res));
router.put('/vehicles/:id', authMiddleware(['sacco_admin']), (req, res) => saccoAdminVehicleController.updateVehicle(req, res));
router.delete('/vehicles/:id', authMiddleware(['sacco_admin']), (req, res) => saccoAdminVehicleController.deleteVehicle(req, res));
router.get('/vehicles/:id', authMiddleware(['sacco_admin']), (req, res) => saccoAdminVehicleController.getVehicleDetails(req, res));

// Vehicle-Driver Assignment Routes
router.get('/vehicles/:vehicleId/available-drivers', authMiddleware(['sacco_admin']), (req, res) => saccoAdminVehicleController.getAvailableDrivers(req, res));
router.post('/vehicles/:vehicleId/assign-driver', authMiddleware(['sacco_admin']), (req, res) => saccoAdminVehicleController.assignDriver(req, res));
router.post('/vehicles/:vehicleId/unassign-driver', authMiddleware(['sacco_admin']), (req, res) => saccoAdminVehicleController.unassignDriver(req, res));

// SACCO Admin Payments
router.get('/payments', authMiddleware(['sacco_admin']), (req, res) => saccoAdminPaymentController.getPayments(req, res));
router.get('/payment-stats', authMiddleware(['sacco_admin']), (req, res) => saccoAdminPaymentController.getPaymentStats(req, res));

// SACCO Admin Routes
router.get('/routes', authMiddleware(['sacco_admin']), (req, res) => saccoAdminRoutesController.getRoutes(req, res));
router.post('/routes', authMiddleware(['sacco_admin']), (req, res) => saccoAdminRoutesController.createRoute(req, res));
router.put('/routes/:id', authMiddleware(['sacco_admin']), (req, res) => saccoAdminRoutesController.updateRoute(req, res));
router.delete('/routes/:id', authMiddleware(['sacco_admin']), (req, res) => saccoAdminRoutesController.deleteRoute(req, res));

router.use('/routes', authMiddleware(['sacco_admin']), routesRouter);

export default router;

