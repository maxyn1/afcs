import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import WalletController from '../controllers/walletController.js';
import { connectDB } from '../config/database.js';

const router = express.Router();
let walletController;

// Initialize controller
(async () => {
  try {
    const pool = await connectDB();
    walletController = new WalletController(pool);
  } catch (error) {
    console.error('Failed to initialize wallet controller:', error);
  }
})();

// Routes
router.get('/balance', authMiddleware(), (req, res) => walletController.getBalance(req, res));
router.get('/transactions', authMiddleware(), (req, res) => walletController.getTransactions(req, res));
router.post('/topup', authMiddleware(), (req, res) => walletController.topUp(req, res));

export default router;
