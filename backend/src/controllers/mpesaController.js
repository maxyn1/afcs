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
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ M-Pesa transactions table ready');
    } catch (error) {
      console.error('Error creating M-Pesa transactions table:', error);
      throw error;
    }
  }

  validateCredentials() {
    const requiredCredentials = ['consumerKey', 'consumerSecret', 'passkey', 'businessShortCode'];
    const missingCredentials = requiredCredentials.filter(cred => !config.mpesa?.[cred]);
    
    if (missingCredentials.length > 0) {
      throw new Error(`Missing M-Pesa credentials: ${missingCredentials.join(', ')}`);
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

      // Validate required fields
      if (!phoneNumber || !amount || !transactionId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: phoneNumber, amount, and transactionId are required'
        });
      }

      // Format phone number to match database format (0XXXXXXXXX)
      const formattedPhone = this.mpesaService.formatPhoneNumber(phoneNumber).replace(/^254/, '0');

      // Update wallet balance and insert transaction record
      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();

        // Get user by phone number
        const [userResult] = await connection.query(
          'SELECT id, balance FROM users WHERE phone = ?',
          [formattedPhone]
        );

        if (userResult.length === 0) {
          throw new Error(`User not found with phone: ${formattedPhone}`);
        }

        const userId = userResult[0].id;
        console.log('Found user:', { userId, phoneNumber: formattedPhone });

        // Check if transaction already exists
        const [existingTx] = await connection.query(
          'SELECT id FROM wallet_transactions WHERE reference = ?',
          [transactionId]
        );

        if (existingTx.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Transaction already processed'
          });
        }

        // Insert transaction record
        await connection.query(
          `INSERT INTO wallet_transactions 
            (user_id, amount, transaction_type, description, transaction_time, payment_method, status, reference) 
           VALUES (?, ?, 'credit', 'M-Pesa Manual TopUp', ?, 'mpesa', 'completed', ?)`,
          [userId, amount, transactionDate || new Date(), transactionId]
        );

        // Update user balance
        const [updateResult] = await connection.query(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [amount, userId]
        );

        if (updateResult.affectedRows === 0) {
          throw new Error(`Failed to update balance for user: ${userId}`);
        }

        await connection.commit();
        console.log('Manual transaction processed successfully:', {
          userId,
          amount,
          transactionId,
          newBalance: userResult[0].balance + amount
        });

        return res.json({
          success: true,
          message: 'Transaction processed successfully',
          data: {
            userId,
            amount,
            transactionId,
            newBalance: userResult[0].balance + amount
          }
        });

      } catch (dbError) {
        await connection.rollback();
        console.error('Database error:', {
          error: dbError.message,
          stack: dbError.stack,
          phoneNumber: formattedPhone
        });
        return res.status(500).json({
          success: false,
          message: 'Database error',
          error: dbError.message
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error processing manual transaction:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
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
      console.log('Processing M-Pesa callback - Raw Body:', JSON.stringify(req.body, null, 2));
      const callbackData = req.body;
      
      if (!callbackData?.Body?.stkCallback) {
        console.error('Invalid callback data structure:', callbackData);
        return res.status(400).json({
          ResultCode: 1,
          ResultDesc: 'Invalid callback data structure'
        });
      }

      const resultCode = callbackData.Body.stkCallback.ResultCode;
      const resultDesc = callbackData.Body.stkCallback.ResultDesc;
      const merchantRequestId = callbackData.Body.stkCallback.MerchantRequestID;
      const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;

      // Start transaction
      const connection = await this.pool.getConnection();
      await connection.beginTransaction();

      try {
        if (resultCode === 0) {
          // Payment successful
          const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata;
          if (!callbackMetadata?.Item) {
            throw new Error('Missing callback metadata');
          }

          const amountObj = callbackMetadata.Item.find(item => item.Name === 'Amount');
          const phoneObj = callbackMetadata.Item.find(item => item.Name === 'PhoneNumber');
          const mpesaReceiptObj = callbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');
          const transactionDateObj = callbackMetadata.Item.find(item => item.Name === 'TransactionDate');

          const amount = amountObj ? amountObj.Value : 0;
          const phoneNumber = phoneObj ? phoneObj.Value.toString() : null;
          const mpesaReceiptNumber = mpesaReceiptObj ? mpesaReceiptObj.Value : null;

          // Update transaction record
          await connection.query(
            `UPDATE mpesa_transactions 
             SET status = ?, 
                 result_code = ?,
                 result_desc = ?,
                 completion_time = CURRENT_TIMESTAMP,
                 mpesa_receipt_number = ?
             WHERE checkout_request_id = ?`,
            ['completed', resultCode.toString(), resultDesc, mpesaReceiptNumber, checkoutRequestId]
          );

          // Get user_id from the transaction
          const [txnRows] = await connection.query(
            'SELECT user_id FROM mpesa_transactions WHERE checkout_request_id = ?',
            [checkoutRequestId]
          );

          if (txnRows.length > 0) {
            // Update user's wallet balance
            await this.walletController.updateBalance(
              connection,
              txnRows[0].user_id,
              amount,
              'credit',
              'mpesa_payment',
              `M-Pesa payment - ${mpesaReceiptNumber}`
            );
          }

          await connection.commit();
          console.log('M-Pesa transaction processed successfully:', {
            checkoutRequestId,
            amount,
            mpesaReceiptNumber
          });
        } else {
          // Payment failed
          await connection.query(
            `UPDATE mpesa_transactions 
             SET status = ?, 
                 result_code = ?,
                 result_desc = ?,
                 completion_time = CURRENT_TIMESTAMP
             WHERE checkout_request_id = ?`,
            ['failed', resultCode.toString(), resultDesc, checkoutRequestId]
          );
          await connection.commit();
          console.log('M-Pesa transaction failed:', {
            checkoutRequestId,
            resultCode,
            resultDesc
          });
        }

        return res.json({
          ResultCode: 0,
          ResultDesc: "Callback processed successfully"
        });
      } catch (error) {
        await connection.rollback();
        console.error('Error processing M-Pesa callback:', error);
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('M-Pesa callback error:', error);
      return res.status(500).json({
        ResultCode: 1,
        ResultDesc: "Internal server error"
      });
    }
  }
}

export default MpesaController;
