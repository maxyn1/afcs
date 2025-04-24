class WalletController {
  constructor(pool) {
    this.pool = pool;
  }

  async getBalance(req, res) {
    try {
      const [user] = await this.pool.query(
        'SELECT balance FROM users WHERE id = ?',
        [req.user.userId]
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
        [req.user.userId]
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
      const mpesaService = await import('../services/mpesaService.js').then(m => m.default);
      const token = req.mpesaToken;
      const mpesaResponse = await mpesaService.initiateSTKPush(phoneNumber, amount, `WalletTopUp-${req.user.userId}`, token);

      // Optionally, you can store the transaction initiation details here for tracking

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
}

export default WalletController;
