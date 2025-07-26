import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from './useContractManager';

interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  decimals: number;
  usdValue?: number;
}

interface StableBalancesHook {
  balances: TokenBalance[];
  isLoading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  getTokenBalance: (tokenSymbol: string) => TokenBalance | null;
}

export const useStableBalances = (): StableBalancesHook => {
  const { account, provider, chainId } = useWallet();
  const contractManager = useContractManager();
  const contracts = contractManager?.contracts;
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const balancesRef = useRef<TokenBalance[]>([]);

  const refreshBalances = useCallback(async () => {
    if (!account || !provider) {
      setBalances([]);
      balancesRef.current = [];
      return;
    }

    // Prevent too frequent updates (minimum 5 seconds between updates)
    const now = Date.now();
    if (now - lastUpdateRef.current < 5000) {
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
      if (contracts?.libertyToken) {
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

      // Only update state if balances actually changed significantly
      const hasSignificantChange = hasBalancesChanged(balancesRef.current, newBalances);
      if (hasSignificantChange) {
        setBalances(newBalances);
        balancesRef.current = newBalances;
      }
      
      lastUpdateRef.current = now;
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to fetch token balances');
    } finally {
      setIsLoading(false);
    }
  }, [account, provider, chainId, contracts]);

  const getTokenBalance = useCallback((tokenSymbol: string): TokenBalance | null => {
    return balancesRef.current.find(balance => balance.symbol === tokenSymbol) || null;
  }, []);

  // Initial balance fetch and periodic updates
  useEffect(() => {
    if (account && provider) {
      refreshBalances();
      
      // Set up periodic refresh every 2 minutes
      const intervalId = setInterval(refreshBalances, 120000);
      
      return () => {
        clearInterval(intervalId);
      };
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

// Helper function to check if balances changed significantly
function hasBalancesChanged(oldBalances: TokenBalance[], newBalances: TokenBalance[]): boolean {
  if (oldBalances.length !== newBalances.length) return true;
  
  for (let i = 0; i < newBalances.length; i++) {
    const oldBalance = oldBalances.find(b => b.symbol === newBalances[i].symbol);
    if (!oldBalance) return true;
    
    // Check if balance changed by more than 0.0001 (to avoid tiny fluctuations)
    const oldAmount = parseFloat(oldBalance.balance);
    const newAmount = parseFloat(newBalances[i].balance);
    const difference = Math.abs(oldAmount - newAmount);
    
    if (difference > 0.0001) return true;
  }
  
  return false;
}

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