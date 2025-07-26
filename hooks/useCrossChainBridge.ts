import { useState, useCallback, useRef, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from './useContractManager';

export interface ChainInfo {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
  icon: string;
  bridgeContract?: string;
  supportedTokens: string[];
}

export interface BridgeTransaction {
  id: string;
  sourceChain: number;
  destinationChain: number;
  token: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'completed' | 'failed';
  txHash: string;
  destinationTxHash?: string;
  estimatedTime: number;
  fees: {
    amount: string;
    token: string;
  };
  timestamp: number;
  userAddress: string;
}

export interface BridgeFeeEstimate {
  networkFee: string;
  bridgeFee: string;
  totalFee: string;
  estimatedTime: number;
  token: string;
}

interface CrossChainBridgeHook {
  supportedChains: ChainInfo[];
  bridgeHistory: BridgeTransaction[];
  activeBridges: BridgeTransaction[];
  isLoading: boolean;
  error: string | null;
  getSupportedChains: () => ChainInfo[];
  estimateBridgeFee: (sourceChain: number, destChain: number, token: string, amount: string) => Promise<BridgeFeeEstimate>;
  initiateBridge: (sourceChain: number, destChain: number, token: string, amount: string) => Promise<string>;
  trackBridgeStatus: (transactionId: string) => Promise<BridgeTransaction>;
  getBridgeHistory: (userAddress: string) => Promise<BridgeTransaction[]>;
  cancelBridge: (transactionId: string) => Promise<boolean>;
  retryFailedBridge: (transactionId: string) => Promise<string>;
}

const SUPPORTED_CHAINS: ChainInfo[] = [
  {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    blockExplorer: 'https://etherscan.io',
    icon: '⟠',
    bridgeContract: '0x1234567890123456789012345678901234567890',
    supportedTokens: ['ETH', 'LIB', 'USDC', 'USDT']
  },
  {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    icon: '⬟',
    bridgeContract: '0x2345678901234567890123456789012345678901',
    supportedTokens: ['MATIC', 'LIB', 'USDC', 'USDT']
  },
  {
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    icon: '🟡',
    bridgeContract: '0x3456789012345678901234567890123456789012',
    supportedTokens: ['BNB', 'LIB', 'USDC', 'USDT']
  },
  {
    chainId: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    icon: '🔵',
    bridgeContract: '0x4567890123456789012345678901234567890123',
    supportedTokens: ['ETH', 'LIB', 'USDC', 'USDT']
  },
  {
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    icon: '🔴',
    bridgeContract: '0x5678901234567890123456789012345678901234',
    supportedTokens: ['ETH', 'LIB', 'USDC', 'USDT']
  },
  {
    chainId: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    icon: '🔺',
    bridgeContract: '0x6789012345678901234567890123456789012345',
    supportedTokens: ['AVAX', 'LIB', 'USDC', 'USDT']
  }
];

export const useCrossChainBridge = (): CrossChainBridgeHook => {
  const { account, chainId } = useWallet();
  const contractManager = useContractManager();
  
  const [bridgeHistory, setBridgeHistory] = useState<BridgeTransaction[]>([]);
  const [activeBridges, setActiveBridges] = useState<BridgeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bridgeCache = useRef<Map<string, any>>(new Map());
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Load bridge history on mount
  useEffect(() => {
    if (account) {
      loadBridgeHistory();
      startStatusMonitoring();
    }
    
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, [account]);

  const loadBridgeHistory = useCallback(async () => {
    if (!account) return;

    try {
      const history = await getBridgeHistory(account);
      setBridgeHistory(history);
      
      // Filter active bridges
      const active = history.filter(bridge => 
        bridge.status === 'pending' || bridge.status === 'confirmed'
      );
      setActiveBridges(active);
    } catch (err) {
      console.error('Error loading bridge history:', err);
    }
  }, [account]);

  const startStatusMonitoring = useCallback(() => {
    statusCheckInterval.current = setInterval(async () => {
      if (activeBridges.length === 0) return;

      try {
        const updatedBridges = await Promise.all(
          activeBridges.map(bridge => trackBridgeStatus(bridge.id))
        );

        setActiveBridges(updatedBridges.filter(bridge => 
          bridge.status === 'pending' || bridge.status === 'confirmed'
        ));

        // Update history with completed bridges
        setBridgeHistory(prev => {
          const updated = [...prev];
          updatedBridges.forEach(updatedBridge => {
            const index = updated.findIndex(b => b.id === updatedBridge.id);
            if (index !== -1) {
              updated[index] = updatedBridge;
            }
          });
          return updated;
        });
      } catch (err) {
        console.error('Error monitoring bridge status:', err);
      }
    }, 30000); // Check every 30 seconds
  }, [activeBridges]);

  const getSupportedChains = useCallback((): ChainInfo[] => {
    return SUPPORTED_CHAINS;
  }, []);

  const estimateBridgeFee = useCallback(async (
    sourceChain: number,
    destChain: number,
    token: string,
    amount: string
  ): Promise<BridgeFeeEstimate> => {
    try {
      setIsLoading(true);
      setError(null);

      const cacheKey = `fee-${sourceChain}-${destChain}-${token}-${amount}`;
      const cached = bridgeCache.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.data;
      }

      // Simulate fee calculation based on chain and amount
      const baseAmount = parseFloat(amount);
      const sourceChainInfo = SUPPORTED_CHAINS.find(c => c.chainId === sourceChain);
      const destChainInfo = SUPPORTED_CHAINS.find(c => c.chainId === destChain);

      if (!sourceChainInfo || !destChainInfo) {
        throw new Error('Unsupported chain');
      }

      // Calculate fees based on chain complexity and congestion
      const networkFeeMultiplier = {
        1: 0.005,    // Ethereum - highest fees
        137: 0.001,  // Polygon - low fees
        56: 0.002,   // BSC - medium fees
        42161: 0.003, // Arbitrum - medium fees
        10: 0.003,   // Optimism - medium fees
        43114: 0.002 // Avalanche - medium fees
      };

      const bridgeFeePercentage = 0.003; // 0.3% bridge fee
      const networkFee = baseAmount * (networkFeeMultiplier[sourceChain as keyof typeof networkFeeMultiplier] || 0.005);
      const bridgeFee = baseAmount * bridgeFeePercentage;
      const totalFee = networkFee + bridgeFee;

      // Estimate time based on chain combination
      const estimatedTime = sourceChain === 1 || destChain === 1 ? 
        15 * 60 : // 15 minutes for Ethereum
        5 * 60;   // 5 minutes for other chains

      const estimate: BridgeFeeEstimate = {
        networkFee: networkFee.toFixed(6),
        bridgeFee: bridgeFee.toFixed(6),
        totalFee: totalFee.toFixed(6),
        estimatedTime,
        token
      };

      // Cache the result
      bridgeCache.current.set(cacheKey, {
        data: estimate,
        timestamp: Date.now()
      });

      return estimate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to estimate bridge fee';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initiateBridge = useCallback(async (
    sourceChain: number,
    destChain: number,
    token: string,
    amount: string
  ): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!account) {
        throw new Error('Wallet not connected');
      }

      // Validate chains and token
      const sourceChainInfo = SUPPORTED_CHAINS.find(c => c.chainId === sourceChain);
      const destChainInfo = SUPPORTED_CHAINS.find(c => c.chainId === destChain);

      if (!sourceChainInfo || !destChainInfo) {
        throw new Error('Unsupported chain');
      }

      if (!sourceChainInfo.supportedTokens.includes(token)) {
        throw new Error(`Token ${token} not supported on ${sourceChainInfo.name}`);
      }

      // Generate transaction ID
      const transactionId = `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate bridge initiation
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Get fee estimate
      const feeEstimate = await estimateBridgeFee(sourceChain, destChain, token, amount);

      // Create bridge transaction record
      const bridgeTransaction: BridgeTransaction = {
        id: transactionId,
        sourceChain,
        destinationChain: destChain,
        token,
        amount,
        status: 'pending',
        txHash: mockTxHash,
        estimatedTime: feeEstimate.estimatedTime,
        fees: {
          amount: feeEstimate.totalFee,
          token
        },
        timestamp: Date.now(),
        userAddress: account
      };

      // Add to active bridges
      setActiveBridges(prev => [...prev, bridgeTransaction]);
      setBridgeHistory(prev => [bridgeTransaction, ...prev]);

      // Store in localStorage for persistence
      const storedHistory = JSON.parse(localStorage.getItem('bridgeHistory') || '[]');
      storedHistory.unshift(bridgeTransaction);
      localStorage.setItem('bridgeHistory', JSON.stringify(storedHistory.slice(0, 100))); // Keep last 100

      // Emit event for real-time updates
      window.dispatchEvent(new CustomEvent('bridgeInitiated', {
        detail: bridgeTransaction
      }));

      return transactionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate bridge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [account, estimateBridgeFee]);

  const trackBridgeStatus = useCallback(async (transactionId: string): Promise<BridgeTransaction> => {
    try {
      // Get transaction from history or active bridges
      let transaction = bridgeHistory.find(t => t.id === transactionId) ||
                       activeBridges.find(t => t.id === transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Simulate status progression
      const now = Date.now();
      const elapsed = now - transaction.timestamp;
      const estimatedCompletion = transaction.estimatedTime * 1000;

      let newStatus = transaction.status;
      let destinationTxHash = transaction.destinationTxHash;

      if (transaction.status === 'pending' && elapsed > estimatedCompletion * 0.3) {
        newStatus = 'confirmed';
      }

      if (transaction.status === 'confirmed' && elapsed > estimatedCompletion) {
        newStatus = 'completed';
        destinationTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      }

      // Small chance of failure for realism
      if (elapsed > estimatedCompletion * 1.5 && Math.random() < 0.05) {
        newStatus = 'failed';
      }

      const updatedTransaction: BridgeTransaction = {
        ...transaction,
        status: newStatus,
        destinationTxHash
      };

      return updatedTransaction;
    } catch (err) {
      console.error('Error tracking bridge status:', err);
      throw err;
    }
  }, [bridgeHistory, activeBridges]);

  const getBridgeHistory = useCallback(async (userAddress: string): Promise<BridgeTransaction[]> => {
    try {
      // Load from localStorage first
      const storedHistory = JSON.parse(localStorage.getItem('bridgeHistory') || '[]');
      const userHistory = storedHistory.filter((tx: BridgeTransaction) => 
        tx.userAddress.toLowerCase() === userAddress.toLowerCase()
      );

      // In a real implementation, this would query the bridge contracts
      // and indexing services for complete transaction history

      return userHistory;
    } catch (err) {
      console.error('Error getting bridge history:', err);
      return [];
    }
  }, []);

  const cancelBridge = useCallback(async (transactionId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const transaction = activeBridges.find(t => t.id === transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Can only cancel pending transactions');
      }

      // Simulate cancellation
      const updatedTransaction: BridgeTransaction = {
        ...transaction,
        status: 'failed'
      };

      // Update state
      setActiveBridges(prev => prev.filter(t => t.id !== transactionId));
      setBridgeHistory(prev => prev.map(t => 
        t.id === transactionId ? updatedTransaction : t
      ));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel bridge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [activeBridges]);

  const retryFailedBridge = useCallback(async (transactionId: string): Promise<string> => {
    try {
      const transaction = bridgeHistory.find(t => t.id === transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'failed') {
        throw new Error('Can only retry failed transactions');
      }

      // Create new bridge transaction with same parameters
      return await initiateBridge(
        transaction.sourceChain,
        transaction.destinationChain,
        transaction.token,
        transaction.amount
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry bridge';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [bridgeHistory, initiateBridge]);

  return {
    supportedChains: SUPPORTED_CHAINS,
    bridgeHistory,
    activeBridges,
    isLoading,
    error,
    getSupportedChains,
    estimateBridgeFee,
    initiateBridge,
    trackBridgeStatus,
    getBridgeHistory,
    cancelBridge,
    retryFailedBridge
  };
};