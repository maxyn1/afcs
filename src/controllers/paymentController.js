import { AppError } from '../utils/errorHandler.js';

class PaymentController {
  constructor(pool) {
    this.pool = pool;
  }

  async makePayment(req, res) {
    const { saccoId, vehicleId, route, amount } = req.body;
    const userId = req.user.userId;

    if (!saccoId || !vehicleId || !route || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment details' });
    }

    try {
      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();

        // Check if user exists
        const [userResult] = await connection.query(
          'SELECT balance FROM users WHERE id = ?',
          [userId]
        );

        if (userResult.length === 0) {
          throw new AppError('User not found', 404);
        }

        const currentBalance = userResult[0].balance;

        if (currentBalance < amount) {
          return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Deduct amount from user balance
        const [updateResult] = await connection.query(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [amount, userId]
        );

        if (updateResult.affectedRows === 0) {
          throw new AppError('Failed to update user balance', 500);
        }

        // Insert payment transaction record
        await connection.query(
          `INSERT INTO wallet_transactions 
            (user_id, amount, transaction_type, description, transaction_time, payment_method, status, reference) 
           VALUES (?, ?, 'debit', 'Payment for route', NOW(), 'balance', 'completed', ?)`,
          [userId, amount, `Payment-${Date.now()}`]
        );

        await connection.commit();

        res.json({ message: 'Payment successful', newBalance: currentBalance - amount });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
    }
  }
}

export default PaymentController;
