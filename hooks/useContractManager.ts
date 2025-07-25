import { useContext, useMemo } from 'react';
import { WalletContext, WalletContextType } from '../lib/WalletProvider';
import ContractManager from '../lib/ContractManager';
import { getChainByChainId } from '../lib/blockchainConfig';

export const useContractManager = (): ContractManager | null => {
  const walletContext = useContext(WalletContext);
  
  if (!walletContext) {
    console.error('useContractManager must be used within a WalletProvider');
    return null;
  }

  const { signer, provider, chainId, isConnected } = walletContext;

  const contractManager = useMemo(() => {
    console.log('useContractManager: Creating contract manager');
    console.log('- isConnected:', isConnected);
    console.log('- chainId:', chainId);
    console.log('- signer available:', !!signer);
    console.log('- provider available:', !!provider);

    if (!isConnected || !chainId || (!signer && !provider)) {
      console.log('useContractManager: Not ready to create contract manager');
      return null;
    }

    const chain = getChainByChainId(chainId);
    if (!chain) {
      console.error(`useContractManager: Unsupported chain ID: ${chainId}`);
      return null;
    }

    try {
      // Prefer signer over provider for write operations
      const signerOrProvider = signer || provider;
      const manager = new ContractManager(signerOrProvider!, chainId);
      console.log('useContractManager: Contract manager created successfully');
      return manager;
    } catch (error) {
      console.error('useContractManager: Failed to create contract manager:', error);
      return null;
    }
  }, [chainId, isConnected, !!signer, !!provider]); // Use boolean flags instead of objects

  return contractManager;
};