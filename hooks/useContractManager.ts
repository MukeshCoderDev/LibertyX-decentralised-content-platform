import { useContext } from 'react';
import { WalletContext, WalletContextType } from '../lib/WalletProvider'; // Import WalletContextType
import ContractManager from '../lib/ContractManager'; // Default export
import { getChainByChainId } from '../lib/blockchainConfig';

// This will hold the singleton instance of ContractManager
let contractManagerInstance: ContractManager | null = null;

export const useContractManager = (): ContractManager => {
  const { signer, provider, chainId } = useContext(WalletContext) as WalletContextType; // Cast to WalletContextType

  if (!chainId) {
    throw new Error('No chainId available. Please connect your wallet to a supported network.');
  }

  // Re-initialize ContractManager only if signer/provider/chainId changes
  // or if it hasn't been initialized yet.
  // This ensures we always have an up-to-date instance.
  if (!contractManagerInstance ||
      (signer && contractManagerInstance.signer !== signer) ||
      (provider && contractManagerInstance.provider !== provider) ||
      (chainId && contractManagerInstance.currentChainId !== chainId)) {
    
    const currentSignerOrProvider = signer || provider;
    if (!currentSignerOrProvider) {
      throw new Error('No signer or provider available to initialize ContractManager.');
    }

    // Ensure the chain is supported before initializing
    const chain = getChainByChainId(chainId);
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}. Please switch to a supported network.`);
    }

    contractManagerInstance = new ContractManager(currentSignerOrProvider, chainId);
  }

  return contractManagerInstance;
};