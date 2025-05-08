import api from './api';

interface TransactionQueue {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  data: any;
}

class WalletService {
  private static instance: WalletService;
  private transactionQueue: TransactionQueue[] = [];
  private processingQueue = false;
  private BATCH_SIZE = 10;
  private BATCH_INTERVAL = 1000; // 1 second
  private queueTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  private async processBatch(batch: TransactionQueue[]) {
    try {
      const responses = await Promise.allSettled(
        batch.map(item => {
          const { amount, phoneNumber, paymentMethod } = item.data;
          return api.post('/wallet/topup', { amount, phoneNumber, payment_method: paymentMethod });
        })
      );

      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          batch[index].resolve(result.value.data);
        } else {
          batch[index].reject(result.reason);
        }
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }

  private async processQueue() {
    if (this.processingQueue) return;

    this.processingQueue = true;
    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout);
      this.queueTimeout = null;
    }

    while (this.transactionQueue.length > 0) {
      const batch = this.transactionQueue.splice(0, this.BATCH_SIZE);
      await this.processBatch(batch);
    }

    this.processingQueue = false;
  }

  private queueTransaction(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.transactionQueue.push({ resolve, reject, data });

      if (this.transactionQueue.length >= this.BATCH_SIZE) {
        this.processQueue();
      } else if (!this.queueTimeout) {
        this.queueTimeout = setTimeout(() => this.processQueue(), this.BATCH_INTERVAL);
      }
    });
  }

  async getBalance(): Promise<number> {
    try {
      const response = await api.get('/wallet/balance');
      return response.data.balance;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  }

  async getTransactions(page = 1, limit = 10): Promise<any> {
    try {
      const response = await api.get('/wallet/transactions', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async topUp(amount: number, phoneNumber: string, paymentMethod = 'mpesa'): Promise<any> {
    return this.queueTransaction({ amount, phoneNumber, paymentMethod });
  }

  async generateQRCode(amount: number): Promise<any> {
    try {
      const response = await api.post('/wallet/qr-generate', { amount });
      return response.data;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  async checkQRStatus(reference: string): Promise<any> {
    try {
      const response = await api.get(`/wallet/qr-status/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Error checking QR status:', error);
      throw error;
    }
  }

  async validateMpesaTransaction(transactionId: string, phoneNumber: string, amount: number): Promise<any> {
    try {
      const response = await api.post('/wallet/mpesa/manual', {
        transactionId,
        phoneNumber,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error validating M-Pesa transaction:', error);
      throw error;
    }
  }
}

export default WalletService.getInstance();