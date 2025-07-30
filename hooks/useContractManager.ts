import { useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { WalletContext } from '../lib/WalletProvider';
import ContractManager from '../lib/ContractManager';
import { getChainByChainId } from '../lib/blockchainConfig';
import { Chain, TransactionResult } from '../lib/web3-types';
import { ContractHealthReport } from '../lib/ContractHealthChecker';

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
  isContractAvailable: (contractName: keyof Chain['contracts']) => Promise<boolean>;
  getContractHealth: (contractName: keyof Chain['contracts']) => Promise<any>;
  refreshHealthReport: () => Promise<ContractHealthReport | null>;
  checkCriticalContracts: () => Promise<{ available: boolean; missing: string[] }>;
  healthReport: ContractHealthReport | null;
  isHealthy: boolean;
  currentChainId: number | null;
  manager: ContractManager | null;
  contracts: any; // Add contracts property
}

export const useContractManager = (): ContractManagerHook => {
  const walletContext = useContext(WalletContext);
  const [healthReport, setHealthReport] = useState<ContractHealthReport | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);
  
  if (!walletContext) {
    console.error('useContractManager must be used within a WalletProvider');
    return {
      executeTransaction: async () => { throw new Error('Wallet not connected'); },
      listenToEvents: () => {},
      getContract: () => null,
      isContractAvailable: async () => false,
      getContractHealth: async () => null,
      refreshHealthReport: async () => null,
      checkCriticalContracts: async () => ({ available: false, missing: [] }),
      healthReport: null,
      isHealthy: false,
      currentChainId: null,
      manager: null,
      contracts: null
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

  // Health monitoring
  const updateHealthStatus = useCallback(async () => {
    if (!contractManager) return;

    try {
      const report = await contractManager.refreshHealthReport();
      setHealthReport(report);
      
      if (report) {
        const criticalContracts = ['subscriptionManager', 'nftAccess', 'creatorRegistry'];
        const healthy = criticalContracts.every(contract => 
          report[contract]?.isDeployed && report[contract]?.isResponding
        );
        setIsHealthy(healthy);
      }
    } catch (error) {
      console.error('Failed to update health status:', error);
      setIsHealthy(false);
    }
  }, [contractManager]);

  // Monitor health periodically
  useEffect(() => {
    if (!contractManager) return;

    // Initial health check only - disable periodic monitoring to prevent blinking
    updateHealthStatus();

    // Disabled periodic monitoring temporarily
    // const interval = setInterval(updateHealthStatus, 30000);
    // return () => clearInterval(interval);
  }, [contractManager]);

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
    isContractAvailable: async (contractName) => {
      if (!contractManager) return false;
      return contractManager.isContractAvailable(contractName);
    },
    getContractHealth: async (contractName) => {
      if (!contractManager) return null;
      return contractManager.getContractHealth(contractName);
    },
    refreshHealthReport: async () => {
      if (!contractManager) return null;
      const report = await contractManager.refreshHealthReport();
      setHealthReport(report);
      return report;
    },
    checkCriticalContracts: async () => {
      if (!contractManager) return { available: false, missing: [] };
      return contractManager.checkCriticalContracts();
    },
    healthReport,
    isHealthy,
    currentChainId: chainId,
    manager: contractManager,
    contracts: contractManager?.contracts || null
  };
};