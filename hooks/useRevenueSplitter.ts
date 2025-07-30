import { useState, useCallback } from 'react';
import { useContractManager } from './useContractManager';
import { useWallet } from '../lib/WalletProvider';
import { TokenBalance } from '../types';

interface RevenueSplitEvent {
  payer: string;
  creator: string;
  total: string;
  creatorShare: string;
  fee: string;
  txHash: string;
  timestamp: number;
}

interface EarningsData {
  totalEarnings: TokenBalance[];
  availableBalance: TokenBalance[];
  recentSplits: RevenueSplitEvent[];
}

export const useRevenueSplitter = () => {
  const { account, chainId } = useWallet();
  const contractManager = useContractManager();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const splitRevenue = useCallback(async (creatorAddress: string, amount: string): Promise<string> => {
    if (!contractManager || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError('');

      const result = await contractManager.executeTransaction(
        'revenueSplitter',
        'split',
        [creatorAddress],
        { value: amount }
      );

      return result.hash;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to split revenue';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contractManager, account]);

  const getCreatorEarnings = useCallback(async (creatorAddress: string): Promise<EarningsData> => {
    try {
      setLoading(true);
      setError('');

      // If contract manager is not available, return mock data for testing
      if (!contractManager || !chainId) {
        console.warn('Contract manager not available, returning mock data');
        
        // Return mock data with some balances for testing
        const mockAvailableBalance: TokenBalance[] = [
          {
            amount: '1000000000000000000', // 1 ETH in wei
            token: 'ETH',
            decimals: 18,
            symbol: 'ETH'
          },
          {
            amount: '5000000000000000000000', // 5000 LIB tokens
            token: 'LIB',
            decimals: 18,
            symbol: 'LIB',
            icon: '🗽'
          },
          {
            amount: '100000000', // 100 USDC
            token: 'USDC',
            decimals: 6,
            symbol: 'USDC'
          }
        ];

        return {
          totalEarnings: mockAvailableBalance,
          availableBalance: mockAvailableBalance,
          recentSplits: []
        };
      }

      // Try to get contracts, but don't fail if they're not available
      let revenueSplitter = null;
      let libertyToken = null;
      
      try {
        revenueSplitter = contractManager.getContract('revenueSplitter', chainId);
        libertyToken = contractManager.getContract('libertyToken', chainId);
      } catch (contractError) {
        console.warn('Contracts not available:', contractError);
      }

      const recentSplits: RevenueSplitEvent[] = [];
      let totalEarningsWei = BigInt(0);

      // Only try to get events if contract is available
      if (revenueSplitter && contractManager.provider) {
        try {
          const currentBlock = await contractManager.provider.getBlockNumber();
          const blocksPerDay = 6400; // Approximate blocks per day
          const fromBlock = Math.max(0, currentBlock - (90 * blocksPerDay)); // Last 90 days

          const filter = revenueSplitter.filters.Split(null, creatorAddress);
          const events = await revenueSplitter.queryFilter(filter, fromBlock);

          for (const event of events) {
            try {
              const block = await event.getBlock();
              const splitEvent: RevenueSplitEvent = {
                payer: event.args.payer,
                creator: event.args.creator,
                total: event.args.total.toString(),
                creatorShare: event.args.creatorShare.toString(),
                fee: event.args.fee.toString(),
                txHash: event.transactionHash,
                timestamp: block.timestamp * 1000
              };
              
              recentSplits.push(splitEvent);
              totalEarningsWei += BigInt(event.args.creatorShare.toString());
            } catch (eventError) {
              console.warn('Error processing event:', eventError);
            }
          }
        } catch (eventsError) {
          console.warn('Error fetching events:', eventsError);
        }
      }

      // Get current wallet balance
      let ethBalance = '0';
      if (contractManager.provider) {
        try {
          const balance = await contractManager.provider.getBalance(creatorAddress);
          ethBalance = balance.toString();
        } catch (balanceError) {
          console.warn('Error fetching ETH balance:', balanceError);
        }
      }
      
      // Get LIB token balance
      let libBalance = '0';
      if (libertyToken) {
        try {
          const balance = await libertyToken.balanceOf(creatorAddress);
          libBalance = balance.toString();
        } catch (libError) {
          console.warn('Error fetching LIB balance:', libError);
        }
      }

      const totalEarnings: TokenBalance[] = [
        {
          amount: totalEarningsWei.toString(),
          token: 'ETH',
          decimals: 18,
          symbol: 'ETH'
        }
      ];

      const availableBalance: TokenBalance[] = [
        {
          amount: ethBalance,
          token: 'ETH',
          decimals: 18,
          symbol: 'ETH'
        },
        {
          amount: libBalance,
          token: 'LIB',
          decimals: 18,
          symbol: 'LIB',
          icon: '🗽'
        }
      ];

      return {
        totalEarnings,
        availableBalance,
        recentSplits: recentSplits.sort((a, b) => b.timestamp - a.timestamp)
      };
    } catch (err: any) {
      console.error('Error in getCreatorEarnings:', err);
      const errorMessage = err.message || 'Failed to fetch earnings data';
      setError(errorMessage);
      
      // Return empty data instead of throwing
      return {
        totalEarnings: [],
        availableBalance: [],
        recentSplits: []
      };
    } finally {
      setLoading(false);
    }
  }, [contractManager, chainId]);

  const getPlatformFee = useCallback(async (): Promise<number> => {
    if (!contractManager || !chainId) {
      return 1000; // Default 10% in basis points
    }

    try {
      const revenueSplitter = contractManager.getContract('revenueSplitter', chainId);
      if (!revenueSplitter) {
        return 1000;
      }

      const fee = await revenueSplitter.PLATFORM_FEE();
      return parseInt(fee.toString());
    } catch (err) {
      console.error('Error fetching platform fee:', err);
      return 1000; // Default fallback
    }
  }, [contractManager, chainId]);

  const calculateSplit = useCallback(async (totalAmount: string): Promise<{
    creatorShare: string;
    platformFee: string;
    feePercentage: number;
  }> => {
    const feeInBasisPoints = await getPlatformFee();
    const feePercentage = feeInBasisPoints / 100; // Convert basis points to percentage
    
    const totalAmountBigInt = BigInt(totalAmount);
    const platformFeeBigInt = (totalAmountBigInt * BigInt(feeInBasisPoints)) / BigInt(10000);
    const creatorShareBigInt = totalAmountBigInt - platformFeeBigInt;

    return {
      creatorShare: creatorShareBigInt.toString(),
      platformFee: platformFeeBigInt.toString(),
      feePercentage
    };
  }, [getPlatformFee]);

  const listenToSplitEvents = useCallback((callback: (event: RevenueSplitEvent) => void) => {
    if (!contractManager || !chainId) {
      console.warn('Cannot listen to events: Contract manager not available');
      return;
    }

    const revenueSplitter = contractManager.getContract('revenueSplitter', chainId);
    if (!revenueSplitter) {
      console.warn('RevenueSplitter contract not found');
      return;
    }

    const handleSplitEvent = async (payer: string, creator: string, total: any, creatorShare: any, fee: any, event: any) => {
      try {
        const block = await event.getBlock();
        const splitEvent: RevenueSplitEvent = {
          payer,
          creator,
          total: total.toString(),
          creatorShare: creatorShare.toString(),
          fee: fee.toString(),
          txHash: event.transactionHash,
          timestamp: block.timestamp * 1000
        };
        callback(splitEvent);
      } catch (err) {
        console.error('Error processing split event:', err);
      }
    };

    revenueSplitter.on('Split', handleSplitEvent);

    // Return cleanup function
    return () => {
      revenueSplitter.off('Split', handleSplitEvent);
    };
  }, [contractManager, chainId]);

  return {
    splitRevenue,
    getCreatorEarnings,
    getPlatformFee,
    calculateSplit,
    listenToSplitEvents,
    loading,
    error
  };
};