import { useState, useCallback, useEffect } from 'react';
import Arweave from 'arweave';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

interface WalletData {
  address: string;
  balance: string;
  isValid: boolean;
  keyfile: any;
}

interface UploadCostEstimate {
  fileSize: number;
  estimatedCost: string;
  hasSufficientFunds: boolean;
  recommendedFunding?: string;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate wallet file format
  const validateWalletFile = useCallback(async (file: File): Promise<any> => {
    try {
      const text = await file.text();
      const keyfile = JSON.parse(text);
      
      // Check if it's a valid JWK format
      const requiredFields = ['kty', 'n', 'e', 'd', 'p', 'q', 'dp', 'dq', 'qi'];
      const hasAllFields = requiredFields.every(field => keyfile.hasOwnProperty(field));
      
      if (!hasAllFields) {
        throw new Error('Invalid wallet file format. Please ensure you\'re using a valid Arweave keyfile.');
      }
      
      return keyfile;
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON file. Please upload a valid Arweave wallet file.');
      }
      throw error;
    }
  }, []);

  // Load wallet from file
  const loadWallet = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔑 Loading wallet file...');
      
      // Validate wallet format
      const keyfile = await validateWalletFile(file);
      
      // Get wallet address
      const address = await arweave.wallets.jwkToAddress(keyfile);
      console.log('📍 Wallet address:', address);
      
      // Get balance
      const balanceWinston = await arweave.wallets.getBalance(address);
      const balance = arweave.ar.winstonToAr(balanceWinston);
      console.log('💰 Wallet balance:', balance, 'AR');
      
      const walletData: WalletData = {
        address,
        balance,
        isValid: true,
        keyfile
      };
      
      setWallet(walletData);
      console.log('✅ Wallet loaded successfully');
      
      return walletData;
    } catch (error: any) {
      console.error('❌ Failed to load wallet:', error);
      setError(error.message || 'Failed to load wallet');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [validateWalletFile]);

  // Estimate upload cost
  const estimateUploadCost = useCallback(async (fileSize: number): Promise<UploadCostEstimate> => {
    try {
      const costWinston = await arweave.transactions.getPrice(fileSize);
      const estimatedCost = arweave.ar.winstonToAr(costWinston);
      
      const hasSufficientFunds = wallet ? 
        parseFloat(wallet.balance) >= parseFloat(estimatedCost) : false;
      
      const recommendedFunding = !hasSufficientFunds ? 
        (parseFloat(estimatedCost) * 1.1).toFixed(4) : undefined; // 10% buffer
      
      return {
        fileSize,
        estimatedCost,
        hasSufficientFunds,
        recommendedFunding
      };
    } catch (error: any) {
      console.error('Failed to estimate cost:', error);
      throw new Error('Unable to estimate upload cost. Please try again.');
    }
  }, [wallet]);

  // Refresh wallet balance
  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    
    try {
      setIsLoading(true);
      const balanceWinston = await arweave.wallets.getBalance(wallet.address);
      const balance = arweave.ar.winstonToAr(balanceWinston);
      
      setWallet(prev => prev ? { ...prev, balance } : null);
      console.log('🔄 Balance refreshed:', balance, 'AR');
    } catch (error: any) {
      console.error('Failed to refresh balance:', error);
      setError('Failed to refresh balance');
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  // Clear wallet data
  const clearWallet = useCallback(() => {
    console.log('🧹 Clearing wallet data');
    setWallet(null);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-clear wallet on component unmount
  useEffect(() => {
    return () => {
      if (wallet) {
        console.log('🧹 Auto-clearing wallet on unmount');
        setWallet(null);
      }
    };
  }, [wallet]);

  return {
    // State
    wallet,
    isLoading,
    error,
    
    // Computed
    isWalletLoaded: !!wallet,
    walletAddress: wallet?.address,
    walletBalance: wallet?.balance,
    
    // Actions
    loadWallet,
    estimateUploadCost,
    refreshBalance,
    clearWallet,
    clearError
  };
};