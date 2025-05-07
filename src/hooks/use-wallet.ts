import { useState, useEffect, useCallback, useRef } from 'react';
import walletService from '../services/walletService';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  reference?: string;
}

interface WalletState {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
  page: number;
  hasMore: boolean;
}

interface UseWalletReturn extends WalletState {
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  topUp: (amount: number, phoneNumber: string) => Promise<any>;
  generateQR: (amount: number) => Promise<any>;
  checkQRStatus: (reference: string) => Promise<any>;
}

const POLL_INTERVAL = 30000; // 30 seconds
const PAGE_SIZE = 10;

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    balance: 0,
    transactions: [],
    loading: true,
    error: null,
    page: 1,
    hasMore: true
  });

  const pollingRef = useRef<NodeJS.Timeout>();
  const pendingTransactionsRef = useRef<Set<string>>(new Set());

  const fetchBalance = useCallback(async () => {
    try {
      const balance = await walletService.getBalance();
      setState(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setState(prev => ({ ...prev, error: error as Error }));
    }
  }, []);

  const fetchTransactions = useCallback(async (page: number, replace = false) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await walletService.getTransactions(page, PAGE_SIZE);
      
      setState(prev => ({
        ...prev,
        transactions: replace ? response.transactions : [...prev.transactions, ...response.transactions],
        hasMore: (response.transactions?.length || 0) === PAGE_SIZE,
        page,
        loading: false
      }));

      // Update pending transactions set
      const pendingTxns = (response.transactions || [])
        .filter(tx => tx.status === 'pending')
        .map(tx => tx.reference);
      
      pendingTransactionsRef.current = new Set([
        ...Array.from(pendingTransactionsRef.current),
        ...pendingTxns
      ]);

    } catch (error) {
      console.error('Error fetching transactions:', error);
      setState(prev => ({ 
        ...prev, 
        error: error as Error,
        loading: false 
      }));
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      if (pendingTransactionsRef.current.size === 0) {
        clearInterval(pollingRef.current);
        pollingRef.current = undefined;
        return;
      }

      // Check status of pending transactions
      const pendingPromises = Array.from(pendingTransactionsRef.current).map(async reference => {
        try {
          const status = await walletService.checkQRStatus(reference);
          if (status.status === 'completed') {
            pendingTransactionsRef.current.delete(reference);
            await fetchBalance();
            await fetchTransactions(1, true);
          }
        } catch (error) {
          console.error(`Error checking transaction ${reference}:`, error);
        }
      });

      await Promise.all(pendingPromises);
    }, POLL_INTERVAL);
  }, [fetchBalance, fetchTransactions]);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    await Promise.all([
      fetchBalance(),
      fetchTransactions(1, true)
    ]);
    startPolling();
  }, [fetchBalance, fetchTransactions, startPolling]);

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;
    await fetchTransactions(state.page + 1);
  }, [state.loading, state.hasMore, state.page, fetchTransactions]);

  const topUp = useCallback(async (amount: number, phoneNumber: string) => {
    try {
      const result = await walletService.topUp(amount, phoneNumber);
      if (result.CheckoutRequestID) {
        pendingTransactionsRef.current.add(result.accountReference);
        startPolling();
      }
      return result;
    } catch (error) {
      console.error('Error initiating top-up:', error);
      throw error;
    }
  }, [startPolling]);

  const generateQR = useCallback(async (amount: number) => {
    try {
      const result = await walletService.generateQRCode(amount);
      if (result.success && result.reference) {
        pendingTransactionsRef.current.add(result.reference);
        startPolling();
      }
      return result;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }, [startPolling]);

  const checkQRStatus = useCallback(async (reference: string) => {
    try {
      const result = await walletService.checkQRStatus(reference);
      if (result.status === 'completed') {
        pendingTransactionsRef.current.delete(reference);
        await refresh();
      }
      return result;
    } catch (error) {
      console.error('Error checking QR status:', error);
      throw error;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [refresh]);

  return {
    ...state,
    refresh,
    loadMore,
    topUp,
    generateQR,
    checkQRStatus
  };
}