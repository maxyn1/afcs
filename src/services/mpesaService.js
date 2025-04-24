import axios from 'axios';
import { config } from '../config/config.js';

class MpesaService {
  constructor() {
    // Debug config values
    console.log('Initializing MPesa Service with config:', {
      consumerKey: config.mpesa?.consumerKey ? 'Present' : 'Missing',
      consumerSecret: config.mpesa?.consumerSecret ? 'Present' : 'Missing',
      businessShortCode: config.mpesa?.businessShortCode,
      passkey: config.mpesa?.passkey ? 'Present' : 'Missing',
      callbackURL: config.mpesa?.callbackURL,
    });

    if (!config.mpesa) {
      throw new Error('MPesa configuration is missing');
    }

    this.consumerKey = config.mpesa.consumerKey;
    this.consumerSecret = config.mpesa.consumerSecret;
    this.businessShortCode = config.mpesa.businessShortCode;
    this.passkey = config.mpesa.passkey;
    this.callbackURL = config.mpesa.callbackURL;
    this.token = null;

    console.log('MPesa Service initialized with callback URL:', this.callbackURL);
  }

  async getAuthToken() {
    try {
      console.log('Requesting MPesa auth token...');
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      console.log('Generated auth header (Base64):', auth);

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
        hasToken: !!response.data.access_token,
        tokenLength: response.data.access_token?.length
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

  async initiateSTKPush(phoneNumber, amount, accountReference) {
    const token = await this.getAuthToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);
    const password = Buffer.from(
      `${this.businessShortCode}${this.passkey}${timestamp}`
    ).toString('base64');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: this.businessShortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackURL,
        AccountReference: accountReference,
        TransactionDesc: 'Fare Payment'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }
}

export default new MpesaService();
