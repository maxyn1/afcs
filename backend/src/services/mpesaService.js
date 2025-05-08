import axios from 'axios';
import { config } from '../config/config.js';
import QRCode from 'qrcode';

class MpesaService {
  constructor(pool = null) {
    if (!config.mpesa) {
      throw new Error('MPesa configuration is missing');
    }

    this.pool = pool;
    this.pendingTransactions = new Map();
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY = 2000; // 2 seconds

    // Validate URL format and presence
    if (!config.mpesa.CallBackURL) {
      throw new Error('MPESA callback URL is not configured');
    }

    try {
      const callbackUrl = new URL(config.mpesa.CallBackURL);
      if (callbackUrl.protocol !== 'https:') {
        throw new Error('MPESA callback URL must use HTTPS protocol');
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Invalid MPESA callback URL format: ${config.mpesa.CallBackURL}`);
      }
      throw error;
    }

    this.consumerKey = config.mpesa.consumerKey;
    this.consumerSecret = config.mpesa.consumerSecret;
    this.businessShortCode = config.mpesa.businessShortCode;
    this.passkey = config.mpesa.passkey;
    this.CallBackURL = config.mpesa.CallBackURL;
    this.token = null;
    this.tokenExpiry = null;

    // Initialize batching queue
    this.batchQueue = [];
    this.batchTimeout = null;
    this.BATCH_SIZE = 10;
    this.BATCH_TIMEOUT = 1000; // 1 second

    console.log('MPesa Service initialized with callback URL:', this.CallBackURL);
  }

  async getAuthToken(force = false) {
    const now = Date.now();
    
    // Check if we have a valid cached token
    if (!force && this.token && this.tokenExpiry && now < this.tokenExpiry) {
      return this.token;
    }

    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      const response = await this.retryRequest(
        () => axios.get(
          'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
          {
            headers: { Authorization: `Basic ${auth}` }
          }
        )
      );

      this.token = response.data.access_token;
      // Set token expiry to 50 minutes (tokens are valid for 1 hour)
      this.tokenExpiry = now + (50 * 60 * 1000);
      return this.token;
    } catch (error) {
      console.error('Error getting auth token:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async retryRequest(requestFn, retries = this.MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        
        // Check if we should retry based on error type
        if (error.response?.status === 401) {
          // Token expired, get a new one
          await this.getAuthToken(true);
        }
        
        console.log(`Retrying request (${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
  }

  generateTransactionReference() {
    const date = new Date();
    const formattedDate = String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') +
      date.getFullYear().toString().slice(-2);
    const randomNum = Math.floor(100 + Math.random() * 900);
    const reference = `TRX${formattedDate}${randomNum}`;
    
    return reference;
  }

  formatPhoneNumber(phoneNumber) {
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (phoneNumber.startsWith('0')) {
      return '254' + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('254')) {
      return phoneNumber;
    } else if (phoneNumber.startsWith('+254')) {
      return phoneNumber.substring(1);
    }
    return '254' + phoneNumber;
  }

  async processBatch(transactions) {
    const token = await this.getAuthToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${this.businessShortCode}${this.passkey}${timestamp}`
    ).toString('base64');

    const requests = transactions.map(({ phoneNumber, amount, userId }) => ({
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      payload: {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: this.formatPhoneNumber(phoneNumber),
        PartyB: this.businessShortCode,
        PhoneNumber: this.formatPhoneNumber(phoneNumber),
        CallBackURL: this.CallBackURL,
        AccountReference: this.generateTransactionReference(),
        TransactionDesc: "Wallet TopUp"
      }
    }));

    const results = await Promise.allSettled(
      requests.map(({ headers, payload }, index) =>
        this.retryRequest(() =>
          axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            payload,
            { headers }
          )
        ).then(async (response) => {
          const transaction = transactions[index];
          if (this.pool) {
            const connection = await this.pool.getConnection();
            try {
              await connection.query(
                `INSERT INTO mpesa_transactions (
                  id, merchant_request_id, checkout_request_id, 
                  account_reference, transaction_type, amount,
                  phone_number, user_id, status
                ) VALUES (UUID(), ?, ?, ?, 'stk_push', ?, ?, ?, 'pending')`,
                [
                  response.data.MerchantRequestID,
                  response.data.CheckoutRequestID,
                  payload.AccountReference,
                  transaction.amount,
                  transaction.phoneNumber,
                  transaction.userId
                ]
              );
            } finally {
              connection.release();
            }
          }
          return { ...response.data, accountReference: payload.AccountReference };
        })
      )
    );

    return results.map((result, index) => ({
      phoneNumber: transactions[index].phoneNumber,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  queueTransaction(phoneNumber, amount, userId) {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ phoneNumber, amount, userId, resolve, reject });

      if (this.batchQueue.length >= this.BATCH_SIZE) {
        this.processBatchQueue();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.processBatchQueue(), this.BATCH_TIMEOUT);
      }
    });
  }

  async processBatchQueue() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batchQueue.length === 0) return;

    const currentBatch = this.batchQueue.splice(0, this.BATCH_SIZE);
    const transactions = currentBatch.map(({ phoneNumber, amount, userId }) => ({
      phoneNumber, amount, userId
    }));

    try {
      const results = await this.processBatch(transactions);
      results.forEach((result, index) => {
        if (result.success) {
          currentBatch[index].resolve(result.data);
        } else {
          currentBatch[index].reject(result.error);
        }
      });
    } catch (error) {
      currentBatch.forEach(({ reject }) => reject(error));
    }
  }

  async initiateSTKPush(phoneNumber, amount, userId) {
    return this.queueTransaction(phoneNumber, amount, userId);
  }

  // Existing QR code methods remain unchanged
  async generateQRCode(amount) {
    try {
      const reference = this.generateTransactionReference();
      const token = await this.getAuthToken();

      const payload = {
        MerchantName: "Kenya AFCS",
        RefNo: reference,
        Amount: Math.round(amount),
        TrxCode: "PB",
        CPI: this.businessShortCode,
        Size: "300"
      };

      const response = await this.retryRequest(() =>
        axios.post(
          'https://sandbox.safaricom.co.ke/mpesa/qrcode/v1/generate',
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      return {
        success: true,
        qrCode: response.data.QRCode,
        reference: reference
      };
    } catch (error) {
      console.error('QR generation error:', error);
      throw error;
    }
  }

  async checkQRStatus(reference) {
    try {
      const token = await this.getAuthToken();
      
      const response = await this.retryRequest(() =>
        axios.get(
          `https://sandbox.safaricom.co.ke/mpesa/qrcode/v1/query/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      );

      return {
        status: response.data.ResultCode === "0" ? "completed" : "pending",
        resultDesc: response.data.ResultDesc
      };
    } catch (error) {
      console.error('QR status check error:', error);
      throw error;
    }
  }
}

// Export a factory function instead of an instance
export const createMpesaService = (pool) => new MpesaService(pool);
