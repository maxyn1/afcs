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
    const { amount, payment_method = 'mpesa' } = req.body;
    
    try {
      await this.pool.beginTransaction();

      await this.pool.query(
        `INSERT INTO wallet_transactions 
         (user_id, amount, transaction_type, payment_method, description) 
         VALUES (?, ?, 'top_up', ?, 'Wallet top up')`,
        [req.user.userId, amount, payment_method]
      );

      await this.pool.query(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amount, req.user.userId]
      );

      await this.pool.commit();
      res.json({ message: 'Top up successful' });
    } catch (error) {
      await this.pool.rollback();
      console.error('Top up error:', error);
      res.status(500).json({ message: 'Error processing top up' });
    }
  }
}

export default WalletController;
