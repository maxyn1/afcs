import express from 'express';
import MpesaController from '../controllers/mpesaController.js';
import { connectDB } from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
let mpesaController;

// Initialize controller
(async () => {
  try {
    const pool = await connectDB();
    mpesaController = new MpesaController(pool);
  } catch (error) {
    console.error('Failed to initialize mpesa controller:', error);
  }
})();

// Debugging middleware that logs raw body
const debugCallback = (req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    data += chunk;
  });

  req.on('end', function() {
    try {
      req.rawBody = data;
      if (data) {
        req.body = JSON.parse(data);
      }
      console.log('📞 M-Pesa Callback received:', {
        timestamp: new Date().toISOString(),
        headers: req.headers,
        rawBody: req.rawBody,
        parsedBody: req.body
      });
    } catch (e) {
      console.error('Error parsing callback body:', e);
    }
    next();
  });
};

// Test endpoint to verify callback URL is accessible
router.get('/callback', (req, res) => {
  res.status(200).json({ 
    message: 'MPESA callback URL is active and working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Manual testing callback route - requires authentication
router.post('/manual-callback', authMiddleware(), debugCallback, async (req, res) => {
  try {
    if (!mpesaController) {
      console.error('M-Pesa controller not initialized');
      return res.status(500).json({ 
        ResultCode: 1,
        ResultDesc: 'Service unavailable' 
      });
    }
    await mpesaController.mpesaCallback(req, res);
  } catch (error) {
    console.error('Manual callback route error:', error);
    res.status(500).json({ 
      ResultCode: 1,
      ResultDesc: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Official Safaricom M-Pesa callback route - no auth needed
router.post('/callback', debugCallback, async (req, res) => {
  try {
    if (!mpesaController) {
      console.error('M-Pesa controller not initialized');
      return res.status(500).json({ 
        ResultCode: 1,
        ResultDesc: 'Service unavailable' 
      });
    }
    console.log('Processing official M-Pesa callback:', {
      headers: req.headers,
      body: req.body
    });
    await mpesaController.mpesaCallback(req, res);
  } catch (error) {
    console.error('Callback route error:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      rawBody: req.rawBody
    });
    res.status(500).json({ 
      ResultCode: 1,
      ResultDesc: 'Internal server error' 
    });
  }
});

export default router;
