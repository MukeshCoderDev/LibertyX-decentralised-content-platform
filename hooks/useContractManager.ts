import { useContext, useMemo } from 'react';
import { WalletContext } from '../lib/WalletProvider';
import ContractManager from '../lib/ContractManager';
import { getChainByChainId } from '../lib/blockchainConfig';
import { Chain, TransactionResult } from '../lib/web3-types';

interface ContractManagerHook {
  executeTransaction: (
    contractName: keyof Chain['contracts'],
    method: string,
    params: any[],
    options?: { value?: string }
  ) => Promise<TransactionResult>;
  listenToEvents: (
    contractName: keyof Chain['contracts'],
    eventName: string,
    callback: Function
  ) => void;
  getContract: (contractName: keyof Chain['contracts'], chainId: number) => any;
  manager: ContractManager | null;
}

export const useContractManager = (): ContractManagerHook => {
  const walletContext = useContext(WalletContext);
  
  if (!walletContext) {
    console.error('useContractManager must be used within a WalletProvider');
    return {
      executeTransaction: async () => { throw new Error('Wallet not connected'); },
      listenToEvents: () => {},
      getContract: () => null,
      manager: null
    };
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

  return {
    executeTransaction: async (contractName, method, params, options) => {
      if (!contractManager) {
        throw new Error('Contract manager not initialized');
      }
      return contractManager.executeTransaction(contractName, method, params, options);
    },
    listenToEvents: (contractName, eventName, callback) => {
      if (!contractManager) {
        console.warn('Contract manager not initialized, cannot listen to events');
        return;
      }
      contractManager.listenToEvents(contractName, eventName, callback);
    },
    getContract: (contractName, chainId) => {
      if (!contractManager) {
        return null;
      }
      return contractManager.getContract(contractName, chainId);
    },
    manager: contractManager
  };
};