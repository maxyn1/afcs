import { AppError } from '../utils/errorHandler.js';

class PaymentController {
  constructor(pool) {
    this.pool = pool;
  }

  async makePayment(req, res) {
    console.log('Received payment request:', {
      body: req.body,
      user: req.user,
      timestamp: new Date().toISOString()
    });

    const { saccoId, vehicleId, route, amount } = req.body;
    const userId = req.user?.userId || req.user?.id; // Handle both formats

    // Validate inputs
    if (!userId) {
      console.error('Payment validation failed: Missing user ID');
      return res.status(400).json({ 
        message: 'User ID is required',
        details: req.user ? 'User object present but missing ID' : 'No user object found'
      });
    }

    if (!saccoId || !vehicleId || !route || !amount || amount <= 0) {
      console.error('Payment validation failed:', {
        saccoId: !saccoId ? 'missing' : 'present',
        vehicleId: !vehicleId ? 'missing' : 'present',
        route: !route ? 'missing' : 'present',
        amount: !amount ? 'missing' : amount <= 0 ? 'invalid' : 'valid',
        userId
      });
      return res.status(400).json({ 
        message: 'Invalid payment details',
        details: {
          saccoId: !saccoId ? 'missing' : 'ok',
          vehicleId: !vehicleId ? 'missing' : 'ok',
          route: !route ? 'missing' : 'ok',
          amount: !amount ? 'missing' : amount <= 0 ? 'must be positive' : 'ok'
        }
      });
    }

    try {
      const connection = await this.pool.getConnection();
      console.log('Database connection established');

      try {
        await connection.beginTransaction();
        console.log('Transaction started');

        // Check if user exists and get balance
        const [userResult] = await connection.query(
          'SELECT balance FROM users WHERE id = ?',
          [userId]
        );

        if (userResult.length === 0) {
          console.error('User not found:', userId);
          throw new AppError('User not found', 404);
        }

        const currentBalance = userResult[0].balance;
        console.log('Current balance:', {
          userId,
          balance: currentBalance,
          requiredAmount: amount
        });

        if (currentBalance < amount) {
          console.error('Insufficient balance:', {
            userId,
            currentBalance,
            requiredAmount: amount
          });
          return res.status(400).json({ 
            message: 'Insufficient balance',
            details: {
              currentBalance,
              requiredAmount: amount,
              shortfall: amount - currentBalance
            }
          });
        }

        // Deduct amount from user balance
        const [updateResult] = await connection.query(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [amount, userId]
        );

        if (updateResult.affectedRows === 0) {
          console.error('Balance update failed:', {
            userId,
            amount,
            updateResult
          });
          throw new AppError('Failed to update user balance', 500);
        }

        console.log('Balance updated successfully');

        // Insert payment transaction record
        const transactionRef = `Payment-${Date.now()}`;
        await connection.query(
          `INSERT INTO wallet_transactions 
            (user_id, amount, transaction_type, description, transaction_time, payment_method, status, reference) 
           VALUES (?, ?, 'payment', ?, NOW(), 'balance', 'completed', ?)`,
          [userId, amount, `Payment for route ${route}`, transactionRef]
        );

        console.log('Transaction record inserted:', {
          userId,
          amount,
          reference: transactionRef
        });

        await connection.commit();
        console.log('Transaction committed successfully');

        res.json({ 
          message: 'Payment successful', 
          newBalance: currentBalance - amount,
          transactionRef
        });
      } catch (error) {
        console.error('Payment processing error:', {
          error: error.message,
          stack: error.stack,
          userId,
          amount
        });
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Payment error:', {
        message: error.message,
        stack: error.stack,
        type: error.name,
        code: error.code
      });
      res.status(error.statusCode || 500).json({ 
        message: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

export default PaymentController;
