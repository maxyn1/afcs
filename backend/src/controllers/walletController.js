import { createMpesaService } from '../services/mpesaService.js';

class WalletController {
  constructor(pool) {
    this.pool = pool;
    this.mpesaService = createMpesaService(pool);
  }

  async getBalance(req, res) {
    try {
      const [user] = await this.pool.query(
        'SELECT balance FROM users WHERE id = ?',
        [req.user.id]
      );

      if (user.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ balance: user[0].balance });
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      res.status(500).json({ message: 'Error fetching wallet balance' });
    }
  }

  async getTransactions(req, res) {
    try {
      const [transactions] = await this.pool.query(
        `SELECT * FROM wallet_transactions 
         WHERE user_id = ? 
         ORDER BY transaction_time DESC 
         LIMIT 10`,
        [req.user.id]
      );
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Error fetching transactions' });
    }
  }

  async topUp(req, res) {
    const { amount, payment_method = 'mpesa', phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required for M-Pesa payment' });
    }

    try {
      const mpesaResponse = await this.mpesaService.initiateSTKPush(
        phoneNumber, 
        amount, 
        req.user.id
      );

      res.json({
        message: 'STK Push initiated',
        checkoutRequestId: mpesaResponse.CheckoutRequestID || mpesaResponse.CheckoutRequestId || null,
        response: mpesaResponse
      });
    } catch (error) {
      console.error('M-Pesa STK Push initiation error:', error);
      res.status(500).json({ message: 'Error initiating M-Pesa payment' });
    }
  }

  async updateBalance(connection, userId, amount, type, transactionType, description) {
    if (!connection || !userId || !amount || !type || !transactionType) {
      throw new Error('Missing required parameters for updating balance');
    }

    // Insert transaction record
    await connection.query(
      `INSERT INTO wallet_transactions (
        user_id, 
        amount, 
        transaction_type, 
        description, 
        status
      ) VALUES (?, ?, ?, ?, ?)`,
      [userId, amount, type, description || transactionType, 'completed']
    );

    // Update user balance
    const operator = type === 'credit' ? '+' : '-';
    await connection.query(
      `UPDATE users SET balance = balance ${operator} ? WHERE id = ?`,
      [amount, userId]
    );
  }
}

export default WalletController;
