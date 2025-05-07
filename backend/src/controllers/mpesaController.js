import WalletController from './walletController.js';
import { config } from '../config/config.js';
import { createMpesaService } from '../services/mpesaService.js';

class MpesaController {
  constructor(pool) {
    this.pool = pool;
    this.walletController = new WalletController(pool);
    this.mpesaService = createMpesaService(pool);
    this.validateCredentials();
    this.createMpesaTransactionTable();
    this.pendingCallbacks = new Map();
    this.BATCH_SIZE = 10;
    this.BATCH_TIMEOUT = 1000; // 1 second
    this.batchTimeout = null;
  }

  validateCredentials() {
    const requiredCredentials = ['consumerKey', 'consumerSecret', 'passkey', 'businessShortCode'];
    const missingCredentials = requiredCredentials.filter(cred => !config.mpesa?.[cred]);
    
    if (missingCredentials.length > 0) {
      throw new Error(`Missing M-Pesa credentials: ${missingCredentials.join(', ')}`);
    }
  }

  async createMpesaTransactionTable() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS mpesa_transactions (
          id VARCHAR(36) PRIMARY KEY,
          merchant_request_id VARCHAR(50),
          checkout_request_id VARCHAR(50),
          account_reference VARCHAR(50) NOT NULL,
          transaction_type ENUM('stk_push', 'qr_payment') NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          phone_number VARCHAR(15) NOT NULL,
          user_id VARCHAR(36),
          status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
          result_code VARCHAR(5),
          result_desc TEXT,
          transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completion_time TIMESTAMP NULL,
          mpesa_receipt_number VARCHAR(50),
          INDEX idx_account_reference (account_reference),
          INDEX idx_checkout_request_id (checkout_request_id),
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_transaction_time (transaction_time)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ M-Pesa transactions table ready');
    } catch (error) {
      console.error('Error creating M-Pesa transactions table:', error);
      throw error;
    }
  }

  queueCallback(callbackData) {
    return new Promise((resolve, reject) => {
      const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;
      this.pendingCallbacks.set(checkoutRequestId, { callbackData, resolve, reject });

      if (this.pendingCallbacks.size >= this.BATCH_SIZE) {
        this.processBatchCallbacks();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.processBatchCallbacks(), this.BATCH_TIMEOUT);
      }
    });
  }

  async processBatchCallbacks() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const callbacks = Array.from(this.pendingCallbacks.entries());
    this.pendingCallbacks.clear();

    if (callbacks.length === 0) return;

    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      const results = await Promise.allSettled(
        callbacks.map(([checkoutRequestId, { callbackData }]) =>
          this.processCallback(connection, callbackData)
        )
      );

      await connection.commit();

      results.forEach((result, index) => {
        const [checkoutRequestId, { resolve, reject }] = callbacks[index];
        if (result.status === 'fulfilled') {
          resolve(result.value);
        } else {
          reject(result.reason);
        }
      });
    } catch (error) {
      await connection.rollback();
      callbacks.forEach(([_, { reject }]) => reject(error));
    } finally {
      connection.release();
    }
  }

  async processCallback(connection, callbackData) {
    const resultCode = callbackData.Body.stkCallback.ResultCode;
    const resultDesc = callbackData.Body.stkCallback.ResultDesc;
    const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;

    if (resultCode === 0) {
      const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata;
      if (!callbackMetadata?.Item) {
        throw new Error('Missing callback metadata');
      }

      const amountObj = callbackMetadata.Item.find(item => item.Name === 'Amount');
      const phoneObj = callbackMetadata.Item.find(item => item.Name === 'PhoneNumber');
      const mpesaReceiptObj = callbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');

      const amount = amountObj ? amountObj.Value : 0;
      const phoneNumber = phoneObj ? phoneObj.Value.toString() : null;
      const mpesaReceiptNumber = mpesaReceiptObj ? mpesaReceiptObj.Value : null;

      // Update transaction status
      await connection.query(
        `UPDATE mpesa_transactions 
         SET status = 'completed', 
             result_code = ?,
             result_desc = ?,
             completion_time = CURRENT_TIMESTAMP,
             mpesa_receipt_number = ?
         WHERE checkout_request_id = ?`,
        [resultCode.toString(), resultDesc, mpesaReceiptNumber, checkoutRequestId]
      );

      // Get user_id and update wallet balance
      const [[txn]] = await connection.query(
        'SELECT user_id, amount FROM mpesa_transactions WHERE checkout_request_id = ?',
        [checkoutRequestId]
      );

      if (txn) {
        // Update balance and get new balance
        const newBalance = await this.walletController.updateBalance(
          connection,
          txn.user_id,
          amount,
          'credit',
          'mpesa_payment',
          `M-Pesa payment - ${mpesaReceiptNumber}`
        );

        // Get the Socket.IO instance
        const io = global.app?.get('io');
        if (io) {
          // Send real-time notification to the specific user
          io.to(`user:${txn.user_id}`).emit('paymentUpdate', {
            success: true,
            status: 'completed',
            balance: newBalance,
            transaction: {
              amount,
              type: 'credit',
              description: `M-Pesa payment - ${mpesaReceiptNumber}`,
              reference: mpesaReceiptNumber,
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      return { success: true, status: 'completed' };
    } else {
      // Update transaction as failed
      await connection.query(
        `UPDATE mpesa_transactions 
         SET status = 'failed', 
             result_code = ?,
             result_desc = ?,
             completion_time = CURRENT_TIMESTAMP
         WHERE checkout_request_id = ?`,
        [resultCode.toString(), resultDesc, checkoutRequestId]
      );

      // Get user_id to send notification
      const [[txn]] = await connection.query(
        'SELECT user_id FROM mpesa_transactions WHERE checkout_request_id = ?',
        [checkoutRequestId]
      );

      if (txn) {
        // Send failure notification through Socket.IO
        const io = global.app?.get('io');
        if (io) {
          io.to(`user:${txn.user_id}`).emit('paymentUpdate', {
            success: false,
            status: 'failed',
            error: resultDesc
          });
        }
      }

      return { success: false, status: 'failed', error: resultDesc };
    }
  }

  async generateQRCode(amount) {
    try {
      console.log('Generating QR code for amount:', amount);
      const qrResult = await this.mpesaService.generateQRCode(amount);
      console.log('QR code generated successfully:', {
        success: qrResult.success,
        hasQRCode: !!qrResult.qrCode,
        reference: qrResult.reference
      });
      return qrResult;
    } catch (error) {
      console.error('Error in QR code generation:', {
        error: error.message,
        stack: error.stack,
        amount
      });
      throw error;
    }
  }

  async checkQRStatus(reference) {
    try {
      console.log('Checking QR status for reference:', reference);
      const status = await this.mpesaService.checkQRStatus(reference);
      console.log('QR status check result:', status);
      return status;
    } catch (error) {
      console.error('Error checking QR status:', {
        error: error.message,
        stack: error.stack,
        reference
      });
      throw error;
    }
  }

  async postManualTransaction(req, res) {
    try {
      console.log('Processing manual M-Pesa transaction:', JSON.stringify(req.body, null, 2));
      const { phoneNumber, amount, transactionId, transactionDate } = req.body;

      if (!phoneNumber || !amount || !transactionId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: phoneNumber, amount, and transactionId are required'
        });
      }

      const formattedPhone = this.mpesaService.formatPhoneNumber(phoneNumber).replace(/^254/, '0');
      const connection = await this.pool.getConnection();

      try {
        await connection.beginTransaction();

        const [[user]] = await connection.query(
          'SELECT id, balance FROM users WHERE phone = ?',
          [formattedPhone]
        );

        if (!user) {
          throw new Error(`User not found with phone: ${formattedPhone}`);
        }

        const [[existingTx]] = await connection.query(
          'SELECT id FROM wallet_transactions WHERE reference = ?',
          [transactionId]
        );

        if (existingTx) {
          return res.status(409).json({
            success: false,
            message: 'Transaction already processed'
          });
        }

        // Insert transaction and update balance in a single transaction
        await Promise.all([
          connection.query(
            `INSERT INTO wallet_transactions 
              (user_id, amount, transaction_type, description, transaction_time, payment_method, status, reference) 
             VALUES (?, ?, 'credit', 'M-Pesa Manual TopUp', ?, 'mpesa', 'completed', ?)`,
            [user.id, amount, transactionDate || new Date(), transactionId]
          ),
          connection.query(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [amount, user.id]
          )
        ]);

        await connection.commit();

        return res.json({
          success: true,
          message: 'Transaction processed successfully',
          data: {
            userId: user.id,
            amount,
            transactionId,
            newBalance: user.balance + amount
          }
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error processing manual transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  async topUp(req, res) {
    try {
      const { phoneNumber, amount } = req.body;
      const userId = req.user.id;

      if (!phoneNumber || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and amount are required'
        });
      }

      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number'
        });
      }

      const result = await this.mpesaService.initiateSTKPush(phoneNumber, amount, userId);
      
      res.json({
        success: true,
        message: 'STK push initiated successfully',
        data: result
      });
    } catch (error) {
      console.error('Top-up error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async mpesaCallback(req, res) {
    try {
      // First, send immediate acknowledgment to Safaricom
      // This is crucial to prevent timeout issues with ngrok
      res.json({
        ResultCode: 0,
        ResultDesc: "Callback received successfully"
      });

      // Validate and extract callback data
      if (!req.body?.Body?.stkCallback) {
        console.error('Invalid callback data structure:', req.body);
        return;
      }

      const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = req.body.Body.stkCallback;
      
      // Start processing the callback asynchronously
      setImmediate(async () => {
        try {
          const connection = await this.pool.getConnection();
          
          try {
            await connection.beginTransaction();

            // Update transaction status immediately
            await connection.query(
              `UPDATE mpesa_transactions 
               SET status = ?, 
                   result_code = ?,
                   result_desc = ?,
                   completion_time = CURRENT_TIMESTAMP
               WHERE checkout_request_id = ?`,
              [ResultCode === 0 ? 'completed' : 'failed', ResultCode.toString(), ResultDesc, CheckoutRequestID]
            );

            if (ResultCode === 0 && CallbackMetadata?.Item) {
              const amountObj = CallbackMetadata.Item.find(item => item.Name === 'Amount');
              const mpesaReceiptObj = CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');
              
              if (amountObj && mpesaReceiptObj) {
                const amount = amountObj.Value;
                const mpesaReceiptNumber = mpesaReceiptObj.Value;

                // Get user_id and update wallet balance
                const [[txn]] = await connection.query(
                  'SELECT user_id, amount FROM mpesa_transactions WHERE checkout_request_id = ?',
                  [CheckoutRequestID]
                );

                if (txn) {
                  // Update M-Pesa receipt number
                  await connection.query(
                    'UPDATE mpesa_transactions SET mpesa_receipt_number = ? WHERE checkout_request_id = ?',
                    [mpesaReceiptNumber, CheckoutRequestID]
                  );

                  // Update wallet balance
                  const newBalance = await this.walletController.updateBalance(
                    connection,
                    txn.user_id,
                    amount,
                    'credit',
                    'mpesa_payment',
                    `M-Pesa payment - ${mpesaReceiptNumber}`
                  );

                  // Send real-time notification via Socket.IO
                  const io = global.app?.get('io');
                  if (io) {
                    io.to(`user:${txn.user_id}`).emit('paymentUpdate', {
                      success: true,
                      status: 'completed',
                      balance: newBalance,
                      transaction: {
                        amount,
                        type: 'credit',
                        description: `M-Pesa payment - ${mpesaReceiptNumber}`,
                        reference: mpesaReceiptNumber,
                        timestamp: new Date().toISOString()
                      }
                    });
                  }
                }
              }
            } else if (ResultCode !== 0) {
              // Handle failed transaction
              const [[txn]] = await connection.query(
                'SELECT user_id FROM mpesa_transactions WHERE checkout_request_id = ?',
                [CheckoutRequestID]
              );

              if (txn) {
                const io = global.app?.get('io');
                if (io) {
                  io.to(`user:${txn.user_id}`).emit('paymentUpdate', {
                    success: false,
                    status: 'failed',
                    error: ResultDesc
                  });
                }
              }
            }

            await connection.commit();
          } catch (error) {
            await connection.rollback();
            console.error('Error processing M-Pesa callback:', error);
          } finally {
            connection.release();
          }
        } catch (error) {
          console.error('Error getting database connection:', error);
        }
      });

    } catch (error) {
      console.error('Fatal M-Pesa callback error:', error);
      // Don't send response here as it's already been sent
    }
  }

  async processCallbackAsync(callbackData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await this.processCallback(connection, callbackData);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error in async callback processing:', error);
    } finally {
      connection.release();
    }
  }
}

export default MpesaController;
