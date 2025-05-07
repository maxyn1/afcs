import express from 'express';
import MpesaController from '../controllers/mpesaController.js';
import { connectDB } from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { mpesaAuthMiddleware } from '../middleware/mpesaAuthMiddleware.js';

const router = express.Router();
let mpesaController;
let pool;

// Initialize controller
(async () => {
  try {
    pool = await connectDB();
    mpesaController = new MpesaController(pool);
  } catch (error) {
    console.error('Failed to initialize mpesa controller:', error);
  }
})();

// Raw body parser middleware for M-Pesa callbacks
const parseRawBody = (req, res, next) => {
  if (req.method === 'POST' && req.path === '/callback') {
    if (req.body instanceof Buffer) {
      try {
        const rawBody = req.body.toString('utf8');
        req.rawBody = rawBody;
        req.body = JSON.parse(rawBody);
        console.log('📦 Parsed M-Pesa callback body:', {
          raw: rawBody,
          parsed: req.body
        });
      } catch (error) {
        console.error('Error parsing M-Pesa callback body:', error);
        return res.status(400).json({
          ResultCode: 1,
          ResultDesc: "Invalid JSON payload"
        });
      }
    }
  }
  next();
};

// Test endpoint to verify callback URL is accessible
router.get('/callback', (req, res) => {
  res.status(200).json({
    message: 'MPESA callback URL is active and working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// M-Pesa callback route
router.post('/callback', parseRawBody, async (req, res) => {
  try {
    if (!mpesaController) {
      console.error('M-Pesa controller not initialized');
      return res.status(503).json({
        ResultCode: 1,
        ResultDesc: 'Service temporarily unavailable'
      });
    }

    if (!req.body?.Body?.stkCallback) {
      console.error('Invalid callback data structure:', req.body);
      return res.status(400).json({
        ResultCode: 1,
        ResultDesc: "Invalid callback data structure"
      });
    }

    await mpesaController.mpesaCallback(req, res);
  } catch (error) {
    console.error('Callback route error:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        ResultCode: 1,
        ResultDesc: "Internal server error"
      });
    }
  }
});

// STK Push initiation route
router.post('/stk', authMiddleware(), mpesaAuthMiddleware, async (req, res) => {
  try {
    if (!mpesaController) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable'
      });
    }

    const { phoneNumber, amount } = req.body;
    const userId = req.user.id;

    if (!phoneNumber || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number and amount are required'
      });
    }

    const result = await mpesaController.initiateSTKPush(phoneNumber, amount, userId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('STK Push route error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// QR code generation route
router.post('/generate-qr', authMiddleware(), mpesaAuthMiddleware, async (req, res) => {
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
      message: error.message
    });
  }
});

// QR status check route
router.get('/qr-status/:reference', authMiddleware(), mpesaAuthMiddleware, async (req, res) => {
  try {
    if (!mpesaController) {
      return res.status(500).json({
        success: false,
        message: 'Service unavailable'
      });
    }
    const { reference } = req.params;
    const status = await mpesaController.checkQRStatus(reference);
    res.json(status);
  } catch (error) {
    console.error('QR status check route error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
