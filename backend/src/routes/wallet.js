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

router.post('/mpesa/manual', debugMiddleware, authMiddleware(), async (req, res) => {
  console.log('📝 Manual M-Pesa route accessed:', {
    headers: {
      auth: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    },
    user: req.user,
    body: req.body
  });

  try {
    await mpesaController.postManualTransaction(req, res);
  } catch (error) {
    console.error('Manual M-Pesa transaction error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      amount: req.body.amount
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// QR code payment routes
router.post('/qr-generate', debugMiddleware, authMiddleware(), mpesaAuthMiddleware, async (req, res) => {
  try {
    if (!mpesaController) {
      return res.status(500).json({ 
        success: false,
        message: 'Service unavailable' 
      });
    }

    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const qrResult = await mpesaController.generateQRCode(amount);
    res.json(qrResult);
  } catch (error) {
    console.error('QR generation route error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate QR code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/qr-status/:reference', debugMiddleware, authMiddleware(), mpesaAuthMiddleware, async (req, res) => {
  try {
    if (!mpesaController) {
      return res.status(500).json({ 
        success: false,
        message: 'Service unavailable' 
      });
    }

    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Reference is required'
      });
    }

    const status = await mpesaController.checkQRStatus(reference);
    res.json(status);
  } catch (error) {
    console.error('QR status check route error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check QR status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
