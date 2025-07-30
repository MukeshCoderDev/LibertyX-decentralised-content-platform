import React, { useEffect, useState } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import Button from './ui/Button';

const NetworkValidator: React.FC = () => {
  const { chainId, switchNetwork } = useWallet();
  const { checkCriticalContracts } = useContractManager();
  const [contractsAvailable, setContractsAvailable] = useState<boolean | null>(null);
  const [supportedNetworks] = useState([11155111, 31337]); // Sepolia and localhost

  useEffect(() => {
    const checkContracts = async () => {
      if (!chainId) return;
      
      try {
        const { available } = await checkCriticalContracts();
        setContractsAvailable(available);
      } catch (error) {
        setContractsAvailable(false);
      }
    };

    checkContracts();
  }, [chainId, checkCriticalContracts]);

  const isNetworkSupported = chainId && supportedNetworks.includes(chainId);
  const shouldShowWarning = !isNetworkSupported || contractsAvailable === false;

  if (!shouldShowWarning) return null;

  const handleSwitchToSepolia = async () => {
    try {
      await switchNetwork(11155111); // Sepolia
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <span className="text-yellow-400 text-lg">⚠️</span>
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-400 mb-2">Network Compatibility Issue</h4>
          
          {!isNetworkSupported && (
            <div className="mb-3">
              <p className="text-sm text-yellow-300 mb-2">
                You're connected to an unsupported network. Please switch to Sepolia testnet.
              </p>
              <Button
                onClick={handleSwitchToSepolia}
                variant="secondary"
                size="sm"
              >
                Switch to Sepolia
              </Button>
            </div>
          )}

          {isNetworkSupported && contractsAvailable === false && (
            <div className="mb-3">
              <p className="text-sm text-yellow-300 mb-2">
                Some contracts are not available on this network. Subscription and NFT features may not work properly.
              </p>
              <div className="text-xs text-yellow-200">
                <p>Possible solutions:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Switch to a different network and back</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkValidator;