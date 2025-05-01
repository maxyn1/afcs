import WalletController from './walletController.js';
import { config } from '../config/config.js';
import mpesaService from '../services/mpesaService.js';

class MpesaController {
  constructor(pool) {
    this.pool = pool;
    this.walletController = new WalletController(pool);
    this.validateCredentials();
  }

  validateCredentials() {
    const requiredCredentials = ['consumerKey', 'consumerSecret', 'passkey', 'businessShortCode'];
    const missingCredentials = requiredCredentials.filter(cred => !config.mpesa?.[cred]);
    
    if (missingCredentials.length > 0) {
      throw new Error(`Missing M-Pesa credentials: ${missingCredentials.join(', ')}`);
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
      const formattedPhone = mpesaService.formatPhoneNumber(phoneNumber).replace(/^254/, '0');

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
      const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;

      console.log('M-Pesa callback metadata:', {
        resultCode,
        resultDesc,
        checkoutRequestId,
        hasMetadata: !!callbackData.Body.stkCallback.CallbackMetadata
      });

      if (resultCode === 0) {
        // Payment successful
        const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata;

        if (!callbackMetadata?.Item) {
          console.error('Missing callback metadata. Full callback:', callbackData);
          return res.status(400).json({ 
            ResultCode: 1, 
            ResultDesc: 'Missing callback metadata' 
          });
        }

        const amountObj = callbackMetadata.Item.find(item => item.Name === 'Amount');
        const amount = amountObj ? amountObj.Value : 0;

        const phoneObj = callbackMetadata.Item.find(item => item.Name === 'PhoneNumber');
        const phoneNumber = phoneObj ? phoneObj.Value.toString() : null;

        const accountReferenceObj = callbackMetadata.Item.find(item => item.Name === 'AccountReference');
        const accountReference = accountReferenceObj ? accountReferenceObj.Value : null;

        console.log('Extracted payment details:', {
          amount,
          phoneNumber,
          accountReference
        });

        if (!phoneNumber) {
          console.error('Phone number missing in callback data');
          return res.status(400).json({ 
            ResultCode: 1, 
            ResultDesc: 'Phone number missing in callback data' 
          });
        }

        // Format phone number to match database format (0XXXXXXXXX)
        const formattedPhone = mpesaService.formatPhoneNumber(phoneNumber).replace(/^254/, '0');

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

          // Insert transaction record
          await connection.query(
            `INSERT INTO wallet_transactions 
              (user_id, amount, transaction_type, description, transaction_time, payment_method, status, reference) 
             VALUES (?, ?, 'credit', 'M-Pesa Wallet TopUp', NOW(), 'mpesa', 'completed', ?)`,
            [userId, amount, accountReference]
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
          console.log('Wallet updated successfully:', {
            userId,
            amount,
            newBalance: userResult[0].balance + amount
          });

          return res.json({ 
            ResultCode: 0, 
            ResultDesc: 'Success' 
          });
        } catch (dbError) {
          await connection.rollback();
          console.error('Database error:', {
            error: dbError.message,
            stack: dbError.stack,
            phoneNumber: formattedPhone
          });
          return res.status(500).json({ 
            ResultCode: 1, 
            ResultDesc: 'Database error' 
          });
        } finally {
          connection.release();
        }
      } else {
        // Payment failed
        console.log('Payment failed:', {
          resultCode,
          resultDesc,
          checkoutRequestId
        });

        return res.json({ 
          ResultCode: resultCode, 
          ResultDesc: resultDesc || 'Payment failed' 
        });
      }
    } catch (error) {
      console.error('Error handling M-Pesa callback:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.status(500).json({ 
        ResultCode: 1, 
        ResultDesc: 'Internal server error' 
      });
    }
  }
}

export default MpesaController;
