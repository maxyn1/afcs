import WalletController from './walletController.js';

class MpesaController {
  constructor(pool) {
    this.pool = pool;
    this.walletController = new WalletController(pool);
  }

  async mpesaCallback(req, res) {
    try {
      const callbackData = req.body;
      console.log('Received M-Pesa callback data:', JSON.stringify(callbackData, null, 2));

      // Extract relevant data from callback
      const resultCode = callbackData.Body.stkCallback.ResultCode;
      const resultDesc = callbackData.Body.stkCallback.ResultDesc;
      const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;

      console.log('Extracted callback details:', {
        resultCode,
        resultDesc,
        checkoutRequestId
      });

      if (resultCode === 0) {
        // Payment successful
        const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata;
        console.log('Callback metadata:', JSON.stringify(callbackMetadata, null, 2));

        const amountObj = callbackMetadata.Item.find(item => item.Name === 'Amount');
        const amount = amountObj ? amountObj.Value : 0;

        const phoneObj = callbackMetadata.Item.find(item => item.Name === 'PhoneNumber');
        const phoneNumber = phoneObj ? phoneObj.Value : null;

        const accountReferenceObj = callbackMetadata.Item.find(item => item.Name === 'AccountReference');
        const accountReference = accountReferenceObj ? accountReferenceObj.Value : null;

        console.log('Parsed payment details:', {
          amount,
          phoneNumber,
          checkoutRequestId,
          accountReference
        });

        // Parse userId from accountReference (expected format: WalletTopUp-userId)
        let userId = null;
        if (!accountReference) {
          console.error('AccountReference is missing in callback data');
          return res.status(400).json({ ResultCode: 1, ResultDesc: 'AccountReference is missing in callback data' });
        }

        if (!accountReference.startsWith('WalletTopUp-')) {
          console.error(`Invalid AccountReference format: ${accountReference}. Expected format: WalletTopUp-userId`);
          return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid AccountReference format' });
        }

        userId = accountReference.split('WalletTopUp-')[1];
        if (!userId) {
          console.error('UserId portion is empty in AccountReference:', accountReference);
          return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid UserId in AccountReference' });
        }

        // Update wallet balance and insert transaction record
        const connection = await this.pool.getConnection();
        try {
          await connection.beginTransaction();

          // Update user balance
          await connection.query(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [amount, userId]
          );

          // Insert transaction record
          await connection.query(
            `INSERT INTO wallet_transactions 
              (user_id, amount, transaction_type, description, transaction_time, payment_method, status) 
             VALUES (?, ?, 'credit', 'M-Pesa Wallet TopUp', NOW(), 'mpesa', 'completed')`,
            [userId, amount]
          );

          await connection.commit();
          console.log('Wallet updated successfully for user:', userId);
        } catch (dbError) {
          await connection.rollback();
          console.error('Database error updating wallet:', dbError);
          return res.status(500).json({ ResultCode: 1, ResultDesc: 'Database error' });
        } finally {
          connection.release();
        }

        console.log('M-Pesa payment successful for CheckoutRequestID:', {
          checkoutRequestId,
          amount,
          phoneNumber,
          userId
        });

        res.json({ ResultCode: 0, ResultDesc: 'Success' });
      } else {
        console.log('Payment failed with details:', {
          resultCode,
          resultDesc,
          checkoutRequestId,
          fullCallback: callbackData
        });
        res.json({ ResultCode: 0, ResultDesc: 'Failure handled' });
      }
    } catch (error) {
      console.error('Error handling M-Pesa callback:', {
        error: error.message,
        stack: error.stack,
        requestBody: req.body
      });
      res.status(500).json({ ResultCode: 1, ResultDesc: 'Internal Server Error' });
    }
  }
}

export default MpesaController;
