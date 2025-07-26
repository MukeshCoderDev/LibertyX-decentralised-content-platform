import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { formatEther, parseEther } from 'viem';
import { useTransactionNotifications } from './NotificationSystem';

interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  totalCost: bigint;
  estimationSuccess: boolean;
  error?: string;
}

interface GasEstimatorProps {
  onGasEstimate: (estimate: GasEstimate) => void;
  transactionData?: {
    to: string;
    data?: string;
    value?: bigint;
  };
  className?: string;
}

export const GasEstimator: React.FC<GasEstimatorProps> = ({
  onGasEstimate,
  transactionData,
  className = ''
}) => {
  const { account, currentChain, balance } = useWallet();
  const { notifyGasEstimationFailed, notifyNetworkCongestion } = useTransactionNotifications();
  
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [selectedGasOption, setSelectedGasOption] = useState<'slow' | 'standard' | 'fast'>('standard');
  const [customGasPrice, setCustomGasPrice] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Gas price multipliers for different speed options
  const gasMultipliers = {
    slow: 0.8,
    standard: 1.0,
    fast: 1.5
  };

  const estimateGas = useCallback(async () => {
    if (!account || !transactionData || !currentChain) return;

    setIsEstimating(true);
    
    try {
      // This would typically use your Web3 provider to estimate gas
      // For now, we'll simulate the estimation
      const baseGasLimit = BigInt(21000); // Basic transfer
      const baseGasPrice = parseEther('0.00000002'); // 20 gwei
      
      // Simulate different gas prices based on network conditions
      const networkMultiplier = Math.random() > 0.7 ? 2.0 : 1.0; // Simulate congestion
      const adjustedGasPrice = BigInt(Math.floor(Number(baseGasPrice) * networkMultiplier));
      
      const estimate: GasEstimate = {
        gasLimit: baseGasLimit,
        gasPrice: adjustedGasPrice,
        totalCost: baseGasLimit * adjustedGasPrice,
        estimationSuccess: true
      };

      // Check if user has sufficient balance for gas
      const ethBalance = balance.find(b => b.symbol === currentChain.nativeCurrency.symbol);
      if (ethBalance && BigInt(ethBalance.balance) < estimate.totalCost) {
        estimate.estimationSuccess = false;
        estimate.error = 'Insufficient funds for gas fees';
      }

      // Notify about network congestion
      if (networkMultiplier > 1.5) {
        notifyNetworkCongestion('2-5 minutes');
      }

      setGasEstimate(estimate);
      onGasEstimate(estimate);
      
    } catch (error: any) {
      const failedEstimate: GasEstimate = {
        gasLimit: BigInt(0),
        gasPrice: BigInt(0),
        totalCost: BigInt(0),
        estimationSuccess: false,
        error: error.message || 'Gas estimation failed'
      };
      
      setGasEstimate(failedEstimate);
      onGasEstimate(failedEstimate);
      
      notifyGasEstimationFailed(() => {
        // Retry with higher gas limit
        estimateGas();
      });
    } finally {
      setIsEstimating(false);
    }
  }, [account, transactionData, currentChain, balance, onGasEstimate, notifyGasEstimationFailed, notifyNetworkCongestion]);

  useEffect(() => {
    if (transactionData) {
      estimateGas();
    }
  }, [estimateGas, transactionData]);

  const getAdjustedGasPrice = useCallback((option: 'slow' | 'standard' | 'fast') => {
    if (!gasEstimate) return BigInt(0);
    return BigInt(Math.floor(Number(gasEstimate.gasPrice) * gasMultipliers[option]));
  }, [gasEstimate]);

  const getEstimatedTime = (option: 'slow' | 'standard' | 'fast') => {
    switch (option) {
      case 'slow': return '5-10 min';
      case 'standard': return '2-5 min';
      case 'fast': return '< 2 min';
    }
  };

  const handleGasOptionChange = (option: 'slow' | 'standard' | 'fast') => {
    setSelectedGasOption(option);
    if (gasEstimate) {
      const adjustedPrice = getAdjustedGasPrice(option);
      const updatedEstimate: GasEstimate = {
        ...gasEstimate,
        gasPrice: adjustedPrice,
        totalCost: gasEstimate.gasLimit * adjustedPrice
      };
      onGasEstimate(updatedEstimate);
    }
  };

  const handleCustomGasPrice = () => {
    if (!gasEstimate || !customGasPrice) return;
    
    try {
      const customPrice = parseEther(customGasPrice);
      const updatedEstimate: GasEstimate = {
        ...gasEstimate,
        gasPrice: customPrice,
        totalCost: gasEstimate.gasLimit * customPrice
      };
      onGasEstimate(updatedEstimate);
    } catch (error) {
      console.error('Invalid custom gas price:', error);
    }
  };

  if (!transactionData) return null;

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-text-primary">Gas Estimation</h4>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-primary hover:underline"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {isEstimating ? (
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Estimating gas...</span>
        </div>
      ) : gasEstimate?.estimationSuccess ? (
        <div className="space-y-3">
          {/* Gas Speed Options */}
          <div className="grid grid-cols-3 gap-2">
            {(['slow', 'standard', 'fast'] as const).map((option) => {
              const gasPrice = getAdjustedGasPrice(option);
              const totalCost = gasEstimate.gasLimit * gasPrice;
              
              return (
                <button
                  key={option}
                  onClick={() => handleGasOptionChange(option)}
                  className={`p-2 rounded-lg border text-xs transition-colors ${
                    selectedGasOption === option
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium capitalize">{option}</div>
                  <div className="text-text-secondary mt-1">
                    {formatEther(totalCost).slice(0, 8)} ETH
                  </div>
                  <div className="text-text-secondary">
                    ~{getEstimatedTime(option)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="border-t border-border pt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Gas Limit
                </label>
                <input
                  type="text"
                  value={gasEstimate.gasLimit.toString()}
                  readOnly
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Custom Gas Price (ETH)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customGasPrice}
                    onChange={(e) => setCustomGasPrice(e.target.value)}
                    placeholder={formatEther(gasEstimate.gasPrice)}
                    className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleCustomGasPrice}
                    className="px-3 py-2 bg-primary text-white text-xs rounded hover:bg-primary-dark transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Total Cost Summary */}
          <div className="bg-background rounded-lg p-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Estimated Total Cost:</span>
              <span className="font-medium text-text-primary">
                {formatEther(gasEstimate.totalCost).slice(0, 10)} ETH
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-red-400">
          <p>Gas estimation failed</p>
          {gasEstimate?.error && (
            <p className="text-xs mt-1 opacity-80">{gasEstimate.error}</p>
          )}
          <button
            onClick={estimateGas}
            className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
          >
            Retry Estimation
          </button>
        </div>
      )}
    </div>
  );
};