import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useCrossChainBridge, ChainInfo, BridgeFeeEstimate } from '../hooks/useCrossChainBridge';
// import { getAllTokens, formatTokenAmount } from '../lib/tokenConfig';
import Button from './ui/Button';
import TokenSelector from './TokenSelector';

interface BridgeFormData {
  sourceChain: number;
  destinationChain: number;
  token: string;
  amount: string;
}

const CrossChainBridge: React.FC = () => {
  const { account, chainId, switchNetwork } = useWallet();
  const {
    supportedChains,
    isLoading,
    error,
    estimateBridgeFee,
    initiateBridge
  } = useCrossChainBridge();

  const [formData, setFormData] = useState<BridgeFormData>({
    sourceChain: chainId || 1,
    destinationChain: 137,
    token: 'LIB',
    amount: ''
  });

  const [feeEstimate, setFeeEstimate] = useState<BridgeFeeEstimate | null>(null);
  const [estimatingFee, setEstimatingFee] = useState(false);
  const [bridging, setBridging] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Update source chain when wallet chain changes
  useEffect(() => {
    if (chainId && chainId !== formData.sourceChain) {
      setFormData(prev => ({ ...prev, sourceChain: chainId }));
    }
  }, [chainId]);

  // Auto-estimate fees when form data changes
  useEffect(() => {
    if (formData.amount && parseFloat(formData.amount) > 0) {
      estimateFees();
    } else {
      setFeeEstimate(null);
    }
  }, [formData]);

  const estimateFees = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;

    try {
      setEstimatingFee(true);
      const estimate = await estimateBridgeFee(
        formData.sourceChain,
        formData.destinationChain,
        formData.token,
        formData.amount
      );
      setFeeEstimate(estimate);
    } catch (err) {
      console.error('Error estimating fees:', err);
      setFeeEstimate(null);
    } finally {
      setEstimatingFee(false);
    }
  };

  const handleInputChange = (field: keyof BridgeFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSwapChains = () => {
    setFormData(prev => ({
      ...prev,
      sourceChain: prev.destinationChain,
      destinationChain: prev.sourceChain
    }));
  };

  const handleMaxAmount = () => {
    // In a real implementation, this would get the actual token balance
    const mockBalance = '100.0';
    setFormData(prev => ({ ...prev, amount: mockBalance }));
  };

  const handleBridge = async () => {
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    if (chainId !== formData.sourceChain) {
      try {
        await switchNetwork(formData.sourceChain);
      } catch (err) {
        alert('Please switch to the source chain to continue');
        return;
      }
    }

    setShowConfirmation(true);
  };

  const confirmBridge = async () => {
    try {
      setBridging(true);
      const transactionId = await initiateBridge(
        formData.sourceChain,
        formData.destinationChain,
        formData.token,
        formData.amount
      );
      
      alert(`Bridge initiated! Transaction ID: ${transactionId}`);
      setShowConfirmation(false);
      
      // Reset form
      setFormData(prev => ({ ...prev, amount: '' }));
      setFeeEstimate(null);
    } catch (err) {
      console.error('Bridge failed:', err);
      alert(`Bridge failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBridging(false);
    }
  };

  const getChainInfo = (chainId: number): ChainInfo | undefined => {
    return supportedChains.find(chain => chain.chainId === chainId);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const sourceChainInfo = getChainInfo(formData.sourceChain);
  const destChainInfo = getChainInfo(formData.destinationChain);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-card p-4 sm:p-6 rounded-2xl">
        <h2 className="text-xl sm:text-2xl font-satoshi font-bold mb-4 sm:mb-6">Cross-Chain Bridge</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Source Chain */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              From Chain
            </label>
            <select
              value={formData.sourceChain}
              onChange={(e) => handleInputChange('sourceChain', parseInt(e.target.value))}
              className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-primary focus:outline-none"
            >
              {supportedChains.map(chain => (
                <option key={chain.chainId} value={chain.chainId}>
                  {chain.icon} {chain.name}
                </option>
              ))}
            </select>
            {sourceChainInfo && chainId !== formData.sourceChain && (
              <p className="text-yellow-400 text-xs mt-1">
                ⚠️ Please switch to {sourceChainInfo.name} to continue
              </p>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapChains}
              className="p-2 bg-background border border-border rounded-lg hover:border-primary transition-colors"
              title="Swap chains"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Destination Chain */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              To Chain
            </label>
            <select
              value={formData.destinationChain}
              onChange={(e) => handleInputChange('destinationChain', parseInt(e.target.value))}
              className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-primary focus:outline-none"
            >
              {supportedChains
                .filter(chain => chain.chainId !== formData.sourceChain)
                .map(chain => (
                  <option key={chain.chainId} value={chain.chainId}>
                    {chain.icon} {chain.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Token
            </label>
            <TokenSelector
              selectedToken={formData.token}
              onTokenSelect={(token) => handleInputChange('token', token)}
            />
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.0"
                className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 pr-12 sm:pr-16 text-sm sm:text-base text-white focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleMaxAmount}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-primary text-xs sm:text-sm hover:text-primary/80"
              >
                MAX
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-text-secondary mt-1 gap-1 sm:gap-0">
              <span>Balance: 100.0 {formData.token}</span>
              <span>≈ $150.00</span>
            </div>
          </div>

          {/* Fee Estimate */}
          {(feeEstimate || estimatingFee) && (
            <div className="bg-background/50 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Bridge Details</h3>
              {estimatingFee ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-border rounded w-3/4"></div>
                  <div className="h-4 bg-border rounded w-1/2"></div>
                  <div className="h-4 bg-border rounded w-2/3"></div>
                </div>
              ) : feeEstimate && (
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Network Fee:</span>
                    <span className="text-right">{feeEstimate.networkFee} {feeEstimate.token}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Bridge Fee:</span>
                    <span className="text-right">{feeEstimate.bridgeFee} {feeEstimate.token}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium border-t border-border pt-2">
                    <span>Total Fee:</span>
                    <span className="text-red-400 text-right">{feeEstimate.totalFee} {feeEstimate.token}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Estimated Time:</span>
                    <span className="text-right">{formatDuration(feeEstimate.estimatedTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">You'll Receive:</span>
                    <span className="text-green-400 text-right">
                      {(parseFloat(formData.amount) - parseFloat(feeEstimate.totalFee)).toFixed(6)} {feeEstimate.token}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bridge Button */}
          <Button
            variant="primary"
            onClick={handleBridge}
            disabled={!account || !formData.amount || parseFloat(formData.amount) <= 0 || isLoading}
            className="w-full"
          >
            {!account ? 'Connect Wallet' : 
             chainId !== formData.sourceChain ? `Switch to ${sourceChainInfo?.name}` :
             isLoading ? 'Processing...' : 'Bridge Tokens'}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && feeEstimate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-4 sm:p-6 max-w-md w-full mx-4">
            <h3 className="text-lg sm:text-xl font-satoshi font-bold mb-3 sm:mb-4">Confirm Bridge Transaction</h3>
            
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 text-sm sm:text-base">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">From:</span>
                <span className="flex items-center gap-1 sm:gap-2 text-right">
                  <span className="text-xs sm:text-sm">{sourceChainInfo?.icon}</span>
                  <span className="truncate">{sourceChainInfo?.name}</span>
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">To:</span>
                <span className="flex items-center gap-1 sm:gap-2 text-right">
                  <span className="text-xs sm:text-sm">{destChainInfo?.icon}</span>
                  <span className="truncate">{destChainInfo?.name}</span>
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Amount:</span>
                <span className="text-right">{formData.amount} {formData.token}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Total Fee:</span>
                <span className="text-red-400 text-right">{feeEstimate.totalFee} {feeEstimate.token}</span>
              </div>
              
              <div className="flex items-center justify-between font-medium">
                <span>You'll Receive:</span>
                <span className="text-green-400 text-right">
                  {(parseFloat(formData.amount) - parseFloat(feeEstimate.totalFee)).toFixed(6)} {feeEstimate.token}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Estimated Time:</span>
                <span className="text-right">{formatDuration(feeEstimate.estimatedTime)}</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6">
              <p className="text-yellow-400 text-xs sm:text-sm">
                ⚠️ Please ensure you have enough {sourceChainInfo?.symbol} for gas fees on the source chain.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmation(false)}
                disabled={bridging}
                className="flex-1 text-sm sm:text-base py-2 sm:py-3"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmBridge}
                disabled={bridging}
                className="flex-1 text-sm sm:text-base py-2 sm:py-3"
              >
                {bridging ? 'Bridging...' : 'Confirm Bridge'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossChainBridge;