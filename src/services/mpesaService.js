import axios from 'axios';
import { config } from '../config/config.js';
import QRCode from 'qrcode';

class MpesaService {
  constructor() {
    if (!config.mpesa) {
      throw new Error('MPesa configuration is missing');
    }

    // Validate URL format and presence
    if (!config.mpesa.CallBackURL) {
      throw new Error('MPESA callback URL is not configured. Please set MPESA_CALLBACK_URL in your environment variables.');
    }

    try {
      const callbackUrl = new URL(config.mpesa.CallBackURL);
      if (callbackUrl.protocol !== 'https:') {
        throw new Error('MPESA callback URL must use HTTPS protocol');
      }
      if (!callbackUrl.pathname.endsWith('/api/mpesa/callback')) {
        throw new Error('MPESA callback URL must end with /api/mpesa/callback');
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Invalid MPESA callback URL format: ${config.mpesa.CallBackURL}. Must be a valid HTTPS URL.`);
      }
      throw error;
    }

    this.consumerKey = config.mpesa.consumerKey;
    this.consumerSecret = config.mpesa.consumerSecret;
    this.businessShortCode = config.mpesa.businessShortCode;
    this.passkey = config.mpesa.passkey;
    this.CallBackURL = config.mpesa.CallBackURL;
    this.token = null;

    // Verify all required credentials are present
    const requiredFields = ['consumerKey', 'consumerSecret', 'businessShortCode', 'passkey', 'CallBackURL'];
    const missingFields = requiredFields.filter(field => !this[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required MPesa configuration: ${missingFields.join(', ')}`);
    }

    console.log('MPesa Service initialized with callback URL:', this.CallBackURL);
  }

  async getAuthToken() {
    try {
      console.log('Requesting MPesa auth token...');
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

      const response = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );

      console.log('Auth token response:', {
        status: response.status,
        hasToken: !!response.data.access_token
      });

      this.token = response.data.access_token;
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

  generateTransactionReference() {
    const date = new Date();
    // Format: MMDDYY (6 digits)
    const formattedDate = String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') +
      date.getFullYear().toString().slice(-2);
    
    // Generate a random 3-digit number (leaving room for the TRX prefix)
    const randomNum = Math.floor(100 + Math.random() * 900);
    // Create 12-character reference: TRX + MMDDYY + XXX
    const reference = `TRX${formattedDate}${randomNum}`;
    
    console.log('Generated transaction reference:', {
      reference,
      date: formattedDate,
      randomNum,
      length: reference.length
    });

    if (reference.length !== 12) {
      console.warn('Generated reference length warning:', {
        reference,
        actualLength: reference.length,
        expectedLength: 12
      });
    }

    return reference;
  }

  formatPhoneNumber(phoneNumber) {
    // Remove any spaces or special characters
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    // Convert to international format (254)
    if (phoneNumber.startsWith('0')) {
      return '254' + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('254')) {
      return phoneNumber;
    } else if (phoneNumber.startsWith('+254')) {
      return phoneNumber.substring(1);
    }
    
    // If no known format, assume it needs 254 prefix
    return '254' + phoneNumber;
  }

  async initiateSTKPush(phoneNumber, amount) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      console.log('Initiating STK Push with params:', {
        originalPhone: phoneNumber,
        formattedPhone,
        amount,
        CallBackURL: this.CallBackURL
      });

      const token = await this.getAuthToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, -3);
      const password = Buffer.from(
        `${this.businessShortCode}${this.passkey}${timestamp}`
      ).toString('base64');
      const accountReference = this.generateTransactionReference();

      console.log('Generated account reference for STK Push:', {
        accountReference,
        timestamp,
        length: accountReference.length,
        businessShortCode: this.businessShortCode
      });

      const payload = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount), // Safaricom requires whole numbers
        PartyA: formattedPhone,
        PartyB: this.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.CallBackURL,
        AccountReference: accountReference,
        TransactionDesc: "Wallet TopUp"
      };

      console.log('STK Push request payload:', {
        ...payload,
        Password: '[REDACTED]',
        AccountReference: accountReference
      });

      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('STK Push response:', {
        ...response.data,
        sentAccountReference: accountReference
      });
      
      return {
        ...response.data,
        accountReference
      };
    } catch (error) {
      console.error('STK Push error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        sentPayload: {
          ...payload,
          Password: '[REDACTED]',
          AccountReference: accountReference
        }
      });
      throw error;
    }
  }

  async generateQRCode(amount) {
    try {
      const reference = this.generateTransactionReference();
      const token = await this.getAuthToken();

      // Generate M-Pesa QR code payload according to Daraja API specs
      const payload = {
        MerchantName: "Kenya AFCS",
        RefNo: reference,
        Amount: Math.round(amount),
        TrxCode: "PB",
        CPI: this.businessShortCode,
        Size: "300"
      };

      // Call M-Pesa QR API
      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/qrcode/v1/generate',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // The QR code from Safaricom's API is already base64 encoded
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
      
      const response = await axios.get(
        `https://sandbox.safaricom.co.ke/mpesa/qrcode/v1/query/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
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

export default new MpesaService();
