import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from './useContractManager';
import { useBlockchainEvents } from './useBlockchainEvents';
import { debounce } from '../utils/debounce';

interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  decimals: number;
  usdValue?: number;
}

interface RealTimeBalancesHook {
  balances: TokenBalance[];
  isLoading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  getTokenBalance: (tokenSymbol: string) => TokenBalance | null;
}

export const useRealTimeBalances = (): RealTimeBalancesHook => {
  const { account, provider, chainId } = useWallet();
  const contractManager = useContractManager();
  const contracts = contractManager?.contracts;
  const { subscribeToEvent } = useBlockchainEvents();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalances = useCallback(async () => {
    if (!account || !provider) {
      setBalances([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newBalances: TokenBalance[] = [];

      // Get native token balance (ETH, MATIC, BNB, etc.)
      const nativeBalance = await provider.getBalance(account);
      const nativeSymbol = getNativeTokenSymbol(chainId);
      
      newBalances.push({
        token: 'native',
        symbol: nativeSymbol,
        balance: ethers.formatEther(nativeBalance),
        decimals: 18
      });

      // Get LIB token balance
      if (contracts.libertyToken) {
        try {
          const libBalance = await contracts.libertyToken.balanceOf(account);
          const libDecimals = await contracts.libertyToken.decimals();
          
          newBalances.push({
            token: 'LIB',
            symbol: 'LIB',
            balance: ethers.formatUnits(libBalance, libDecimals),
            decimals: libDecimals
          });
        } catch (err) {
          console.warn('Failed to fetch LIB balance:', err);
        }
      }

      // Get other supported token balances based on network
      const supportedTokens = getSupportedTokens(chainId);
      
      for (const tokenInfo of supportedTokens) {
        try {
          const tokenContract = new ethers.Contract(
            tokenInfo.address,
            ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
            provider
          );
          
          const balance = await tokenContract.balanceOf(account);
          const decimals = await tokenContract.decimals();
          
          newBalances.push({
            token: tokenInfo.address,
            symbol: tokenInfo.symbol,
            balance: ethers.formatUnits(balance, decimals),
            decimals: decimals
          });
        } catch (err) {
          console.warn(`Failed to fetch ${tokenInfo.symbol} balance:`, err);
        }
      }

      setBalances(newBalances);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to fetch token balances');
    } finally {
      setIsLoading(false);
    }
  }, [account, provider, chainId, contracts]);

  const getTokenBalance = useCallback((tokenSymbol: string): TokenBalance | null => {
    return balances.find(balance => balance.symbol === tokenSymbol) || null;
  }, [balances]);

  // Set up real-time balance updates with debouncing
  useEffect(() => {
    if (!account) return;

    let refreshTimeout: NodeJS.Timeout;
    
    // Debounced refresh function to prevent excessive updates
    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        refreshBalances();
      }, 2000); // Wait 2 seconds before refreshing
    };

    // Listen for token transfer events to update balances
    const handleTokenTransfer = (event: any) => {
      // Only refresh if the transfer involves the current user
      const eventDetail = event.detail;
      if (eventDetail && 
          (eventDetail.from?.toLowerCase() === account.toLowerCase() || 
           eventDetail.to?.toLowerCase() === account.toLowerCase())) {
        debouncedRefresh();
      }
    };

    // Subscribe to custom events from blockchain events hook
    window.addEventListener('tokenTransfer', handleTokenTransfer);
    
    // Set up periodic balance refresh (every 2 minutes instead of 30 seconds)
    const intervalId = setInterval(refreshBalances, 120000);

    return () => {
      window.removeEventListener('tokenTransfer', handleTokenTransfer);
      clearInterval(intervalId);
      clearTimeout(refreshTimeout);
    };
  }, [account, refreshBalances]);

  // Initial balance fetch
  useEffect(() => {
    if (account && provider) {
      refreshBalances();
    }
  }, [account, provider, chainId, refreshBalances]);

  return {
    balances,
    isLoading,
    error,
    refreshBalances,
    getTokenBalance
  };
};

// Helper functions
function getNativeTokenSymbol(chainId: number | null): string {
  switch (chainId) {
    case 1: // Ethereum Mainnet
    case 11155111: // Sepolia
      return 'ETH';
    case 137: // Polygon
    case 80001: // Mumbai
      return 'MATIC';
    case 56: // BSC
    case 97: // BSC Testnet
      return 'BNB';
    case 42161: // Arbitrum
      return 'ETH';
    case 10: // Optimism
      return 'ETH';
    case 43114: // Avalanche
      return 'AVAX';
    default:
      return 'ETH';
  }
}

function getSupportedTokens(chainId: number | null): Array<{address: string, symbol: string}> {
  // Return supported token addresses for each network
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return [
        { address: '0xA0b86a33E6441b8C4505E2E2E7C5C8C4C8C4C8C4', symbol: 'USDC' },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT' }
      ];
    case 137: // Polygon
      return [
        { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC' },
        { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT' }
      ];
    case 56: // BSC
      return [
        { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC' },
        { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT' }
      ];
    default:
      return [];
  }
}