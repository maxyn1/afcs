import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { connectDB } from '../config/database.js';
import PaymentController from '../controllers/paymentController.js';

const router = express.Router();
let paymentController;

(async () => {
  try {
    const pool = await connectDB();
    paymentController = new PaymentController(pool);
  } catch (error) {
    console.error('Failed to initialize payment controller:', error);
  }
})();

router.post('/', authMiddleware(), async (req, res) => {
  try {
    await paymentController.makePayment(req, res);
  } catch (error) {
    console.error('Payment route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
