import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import WalletController from '../controllers/walletController.js';
import MpesaController from '../controllers/mpesaController.js';
import { connectDB } from '../config/database.js';
import { mpesaAuthMiddleware } from '../middleware/mpesaAuthMiddleware.js';

const router = express.Router();
let walletController;
let mpesaController;

// Debug middleware
const debugMiddleware = (req, res, next) => {
  console.log('---DEBUG REQUEST---');
  console.log('Route:', req.path);
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('User:', req.user); // From auth middleware
  next();
};

// Initialize controllers
(async () => {
  try {
    const pool = await connectDB();
    walletController = new WalletController(pool);
    mpesaController = new MpesaController(pool);
  } catch (error) {
    console.error('Failed to initialize controllers:', error);
  }
})();

// Routes with debug middleware
router.get('/balance', debugMiddleware, authMiddleware(), async (req, res) => {
  try {
    await walletController.getBalance(req, res);
  } catch (error) {
    console.error('Balance route error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/transactions', debugMiddleware, authMiddleware(), async (req, res) => {
  try {
    await walletController.getTransactions(req, res);
  } catch (error) {
    console.error('Transactions route error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/topup', debugMiddleware, authMiddleware(), mpesaAuthMiddleware, async (req, res) => {
  try {
    await walletController.topUp(req, res);
  } catch (error) {
    console.error('Top-up route error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      amount: req.body.amount
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/mpesa/callback', debugMiddleware, async (req, res) => {
  try {
    await mpesaController.mpesaCallback(req, res);
  } catch (error) {
    console.error('M-Pesa callback error:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Internal Server Error' });
  }
});

router.get('/mpesa/callback', debugMiddleware, (req, res) => {
  res.status(200).send('M-Pesa callback endpoint is active');
});

export default router;
