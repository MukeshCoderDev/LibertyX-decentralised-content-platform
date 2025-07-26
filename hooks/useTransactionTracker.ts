import { useState, useCallback, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../lib/WalletProvider';

interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  requiredConfirmations: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  blockNumber?: number;
  timestamp?: number;
  error?: string;
}

interface PendingTransaction {
  hash: string;
  description: string;
  onConfirmed?: (receipt: ethers.providers.TransactionReceipt) => void;
  onFailed?: (error: string) => void;
  requiredConfirmations: number;
}

interface TransactionTrackerHook {
  pendingTransactions: Map<string, TransactionStatus>;
  trackTransaction: (
    hash: string, 
    description: string, 
    options?: {
      requiredConfirmations?: number;
      onConfirmed?: (receipt: ethers.providers.TransactionReceipt) => void;
      onFailed?: (error: string) => void;
    }
  ) => void;
  getTransactionStatus: (hash: string) => TransactionStatus | null;
  clearTransaction: (hash: string) => void;
  clearAllTransactions: () => void;
  isTransactionPending: (hash: string) => boolean;
}

export const useTransactionTracker = (): TransactionTrackerHook => {
  const { provider } = useWallet();
  const [pendingTransactions, setPendingTransactions] = useState<Map<string, TransactionStatus>>(new Map());
  const trackingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingTxs = useRef<Map<string, PendingTransaction>>(new Map());

  const trackTransaction = useCallback((
    hash: string,
    description: string,
    options: {
      requiredConfirmations?: number;
      onConfirmed?: (receipt: ethers.providers.TransactionReceipt) => void;
      onFailed?: (error: string) => void;
    } = {}
  ) => {
    if (!provider) {
      console.warn('Provider not available for transaction tracking');
      return;
    }

    const requiredConfirmations = options.requiredConfirmations || 1;

    // Store pending transaction info
    pendingTxs.current.set(hash, {
      hash,
      description,
      onConfirmed: options.onConfirmed,
      onFailed: options.onFailed,
      requiredConfirmations
    });

    // Initialize transaction status
    const initialStatus: TransactionStatus = {
      hash,
      status: 'pending',
      confirmations: 0,
      requiredConfirmations
    };

    setPendingTransactions(prev => new Map(prev.set(hash, initialStatus)));

    // Start tracking
    const trackingInterval = setInterval(async () => {
      try {
        const receipt = await provider.getTransactionReceipt(hash);
        
        if (receipt) {
          const currentBlock = await provider.getBlockNumber();
          const confirmations = currentBlock - receipt.blockNumber + 1;
          
          const updatedStatus: TransactionStatus = {
            hash,
            status: confirmations >= requiredConfirmations ? 'confirmed' : 'pending',
            confirmations,
            requiredConfirmations,
            gasUsed: receipt.gasUsed.toString(),
            effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
            blockNumber: receipt.blockNumber,
            timestamp: Date.now()
          };

          setPendingTransactions(prev => new Map(prev.set(hash, updatedStatus)));

          // Check if transaction is confirmed
          if (confirmations >= requiredConfirmations) {
            const pendingTx = pendingTxs.current.get(hash);
            if (pendingTx?.onConfirmed) {
              pendingTx.onConfirmed(receipt);
            }

            // Dispatch custom event for UI updates
            window.dispatchEvent(new CustomEvent('transactionConfirmed', {
              detail: { hash, receipt, description }
            }));

            // Clear tracking
            clearInterval(trackingInterval);
            trackingIntervals.current.delete(hash);
            pendingTxs.current.delete(hash);
          }
        } else {
          // Check if transaction failed
          try {
            const tx = await provider.getTransaction(hash);
            if (!tx) {
              throw new Error('Transaction not found');
            }
          } catch (error) {
            const failedStatus: TransactionStatus = {
              hash,
              status: 'failed',
              confirmations: 0,
              requiredConfirmations,
              error: 'Transaction not found or failed'
            };

            setPendingTransactions(prev => new Map(prev.set(hash, failedStatus)));

            const pendingTx = pendingTxs.current.get(hash);
            if (pendingTx?.onFailed) {
              pendingTx.onFailed('Transaction failed');
            }

            // Dispatch custom event for UI updates
            window.dispatchEvent(new CustomEvent('transactionFailed', {
              detail: { hash, error: 'Transaction failed', description }
            }));

            // Clear tracking
            clearInterval(trackingInterval);
            trackingIntervals.current.delete(hash);
            pendingTxs.current.delete(hash);
          }
        }
      } catch (error) {
        console.error(`Error tracking transaction ${hash}:`, error);
        
        const failedStatus: TransactionStatus = {
          hash,
          status: 'failed',
          confirmations: 0,
          requiredConfirmations,
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        setPendingTransactions(prev => new Map(prev.set(hash, failedStatus)));

        const pendingTx = pendingTxs.current.get(hash);
        if (pendingTx?.onFailed) {
          pendingTx.onFailed(error instanceof Error ? error.message : 'Unknown error');
        }

        // Clear tracking
        clearInterval(trackingInterval);
        trackingIntervals.current.delete(hash);
        pendingTxs.current.delete(hash);
      }
    }, 3000); // Check every 3 seconds

    trackingIntervals.current.set(hash, trackingInterval);

    // Auto-clear after 10 minutes if still pending
    setTimeout(() => {
      if (trackingIntervals.current.has(hash)) {
        clearInterval(trackingInterval);
        trackingIntervals.current.delete(hash);
        pendingTxs.current.delete(hash);
        
        setPendingTransactions(prev => {
          const newMap = new Map(prev);
          newMap.delete(hash);
          return newMap;
        });
      }
    }, 10 * 60 * 1000); // 10 minutes

  }, [provider]);

  const getTransactionStatus = useCallback((hash: string): TransactionStatus | null => {
    return pendingTransactions.get(hash) || null;
  }, [pendingTransactions]);

  const clearTransaction = useCallback((hash: string) => {
    // Clear tracking interval
    const interval = trackingIntervals.current.get(hash);
    if (interval) {
      clearInterval(interval);
      trackingIntervals.current.delete(hash);
    }

    // Clear pending transaction
    pendingTxs.current.delete(hash);

    // Remove from state
    setPendingTransactions(prev => {
      const newMap = new Map(prev);
      newMap.delete(hash);
      return newMap;
    });
  }, []);

  const clearAllTransactions = useCallback(() => {
    // Clear all intervals
    trackingIntervals.current.forEach(interval => clearInterval(interval));
    trackingIntervals.current.clear();

    // Clear all pending transactions
    pendingTxs.current.clear();

    // Clear state
    setPendingTransactions(new Map());
  }, []);

  const isTransactionPending = useCallback((hash: string): boolean => {
    const status = pendingTransactions.get(hash);
    return status?.status === 'pending' || false;
  }, [pendingTransactions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      trackingIntervals.current.forEach(interval => clearInterval(interval));
      trackingIntervals.current.clear();
    };
  }, []);

  return {
    pendingTransactions,
    trackTransaction,
    getTransactionStatus,
    clearTransaction,
    clearAllTransactions,
    isTransactionPending
  };
};