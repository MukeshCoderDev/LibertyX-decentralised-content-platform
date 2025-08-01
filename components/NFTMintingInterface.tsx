import React, { useState, useEffect, useCallback } from 'react';
import { useNFTAccess } from '../hooks/useNFTAccess';
import { useContractManager } from '../hooks/useContractManager';
import { useWallet } from '../lib/WalletProvider';
import { NFTTier } from '../types';
import Button from './ui/Button';
import { ethers } from 'ethers';

interface NFTMintingInterfaceProps {
  creatorAddress: string;
  onSuccess?: (txHash: string) => void;
}

const NFTMintingInterface: React.FC<NFTMintingInterfaceProps> = ({ 
  creatorAddress, 
  onSuccess 
}) => {
  const { getCreatorTiers, mintNFT, isLoading, error } = useNFTAccess();
  const contractManager = useContractManager();
  const { account, balance } = useWallet();
  const [tiers, setTiers] = useState<NFTTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<NFTTier | null>(null);
  const [mintAmount, setMintAmount] = useState(1);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [mintingError, setMintingError] = useState<string | null>(null);
  const [mintingSuccess, setMintingSuccess] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [contractAvailable, setContractAvailable] = useState<boolean | null>(null);

  // Check contract availability
  const checkContractAvailability = useCallback(async () => {
    if (!contractManager) return false;

    try {
      const isAvailable = await contractManager.isContractAvailable('nftAccess');
      setContractAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('Error checking NFT contract availability:', error);
      setContractAvailable(false);
      return false;
    }
  }, [contractManager]);

  // Load tiers with contract availability check
  const loadTiers = useCallback(async () => {
    if (!creatorAddress) return;

    try {
      setLoadingTiers(true);
      
      // Check contract availability first
      const isAvailable = await checkContractAvailability();
      if (!isAvailable) {
        setTiers([]);
        return;
      }

      const creatorTiers = await getCreatorTiers(creatorAddress);
      setTiers(creatorTiers);
      if (creatorTiers.length > 0) {
        setSelectedTier(creatorTiers[0]);
      }
    } catch (err) {
      console.error('Error loading NFT tiers:', err);
      setTiers([]);
    } finally {
      setLoadingTiers(false);
    }
  }, [creatorAddress, getCreatorTiers, checkContractAvailability]);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  // Estimate gas for minting
  const estimateGas = useCallback(async () => {
    if (!selectedTier || !contractManager || !account) return;

    try {
      const contract = contractManager.getContract('nftAccess', contractManager.currentChainId!);
      if (!contract) return;

      const totalCost = ethers.parseEther((parseFloat(selectedTier.priceEth) * mintAmount).toString());
      const gasEstimate = await contract.mint.estimateGas(selectedTier.id, mintAmount, { value: totalCost });
      const gasPrice = await provider?.getFeeData();
      
      if (gasPrice?.gasPrice) {
        const gasCost = gasEstimate * gasPrice.gasPrice;
        setGasEstimate(ethers.formatEther(gasCost));
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
      setGasEstimate(null);
    }
  }, [selectedTier, mintAmount, contractManager, account]);

  // Estimate gas when tier or amount changes
  useEffect(() => {
    estimateGas();
  }, [estimateGas]);

  // Validate minting parameters
  const validateMinting = useCallback(() => {
    if (!selectedTier) {
      return { valid: false, error: 'Please select an NFT tier' };
    }

    if (mintAmount <= 0) {
      return { valid: false, error: 'Mint amount must be greater than 0' };
    }

    if (mintAmount > 10) {
      return { valid: false, error: 'Maximum 10 NFTs per transaction' };
    }

    const totalCost = parseFloat(selectedTier.priceEth) * mintAmount;
    const ethBalance = balance?.find(b => b.symbol === 'ETH');
    const userBalance = ethBalance ? parseFloat(ethBalance.balance) : 0;
    const estimatedGas = gasEstimate ? parseFloat(gasEstimate) : 0.01; // Fallback estimate

    if (userBalance < totalCost + estimatedGas) {
      return { 
        valid: false, 
        error: `Insufficient balance. Need ${(totalCost + estimatedGas).toFixed(4)} ETH, have ${userBalance.toFixed(4)} ETH` 
      };
    }

    return { valid: true, error: null };
  }, [selectedTier, mintAmount, balance, gasEstimate]);

  const handleMint = async () => {
    setMintingError(null);
    setMintingSuccess(null);

    // Validate inputs
    const validation = validateMinting();
    if (!validation.valid) {
      setMintingError(validation.error!);
      return;
    }

    // Check contract availability
    const isAvailable = await checkContractAvailability();
    if (!isAvailable) {
      setMintingError('NFT contract is not available. Please check your network connection.');
      return;
    }

    try {
      const txHash = await mintNFT(selectedTier!.id, mintAmount);
      
      setMintingSuccess(`NFT minting successful! Transaction: ${txHash}`);
      
      if (onSuccess) {
        onSuccess(txHash);
      }
      
      // Refresh tiers to update supply
      setTimeout(() => {
        loadTiers();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error minting NFT:', err);
      let errorMessage = 'Failed to mint NFT';
      
      if (err.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for minting and gas fees';
      } else if (err.message.includes('!exists')) {
        errorMessage = 'NFT tier does not exist';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setMintingError(errorMessage);
    }
  };

  // Enhanced metadata parsing with IPFS support
  const parseMetadata = (uri: string) => {
    try {
      // Handle base64 encoded JSON
      if (uri.startsWith('data:application/json;base64,')) {
        const base64Data = uri.replace('data:application/json;base64,', '');
        return JSON.parse(atob(base64Data));
      }
      
      // Handle IPFS URLs
      if (uri.startsWith('ipfs://')) {
        // For now, return a placeholder - in production you'd fetch from IPFS
        return {
          name: 'IPFS NFT',
          description: 'Metadata stored on IPFS',
          image: null,
          ipfsUri: uri
        };
      }
      
      // Handle HTTP URLs (should fetch metadata)
      if (uri.startsWith('http')) {
        return {
          name: 'External NFT',
          description: 'Metadata stored externally',
          image: null,
          externalUri: uri
        };
      }
      
      return null;
    } catch {
      return null;
    }
  };

  if (loadingTiers) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="flex items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading NFT tiers...</span>
        </div>
      </div>
    );
  }

  if (contractAvailable === false) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">NFT contract is not available. Please check your network connection.</p>
          <Button
            onClick={loadTiers}
            variant="secondary"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <div className="text-4xl mb-4">🎨</div>
        <p className="text-text-secondary mb-4">This creator hasn't created any NFT access tiers yet.</p>
        <Button
          onClick={loadTiers}
          variant="secondary"
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-2xl">
      <h3 className="text-xl font-satoshi font-bold mb-6">Mint NFT Access</h3>
      
      {(error || mintingError) && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4">
          {error || mintingError}
        </div>
      )}

      {mintingSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg mb-4">
          {mintingSuccess}
        </div>
      )}

      {/* Tier Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Select NFT Tier</label>
        <div className="grid gap-3">
          {tiers.map((tier) => {
            const metadata = parseMetadata(tier.uri);
            return (
              <div
                key={tier.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTier?.id === tier.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedTier(tier)}
              >
                <div className="flex items-start gap-4">
                  {metadata?.image && (
                    <img
                      src={metadata.image}
                      alt={metadata.name || `Tier ${tier.id}`}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {metadata?.name || `NFT Tier #${tier.id}`}
                    </h4>
                    {metadata?.description && (
                      <p className="text-sm text-text-secondary mt-1">
                        {metadata.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-primary font-medium">
                        {tier.priceEth} ETH
                      </span>
                      <span className="text-text-secondary">
                        {tier.currentSupply}/{tier.maxSupply} minted
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-border rounded-full h-1 mt-2">
                      <div
                        className="bg-primary h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((tier.currentSupply / tier.maxSupply) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    
                    {tier.currentSupply >= tier.maxSupply && (
                      <span className="text-red-400 text-xs mt-1">Sold Out</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mint Amount */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Amount to Mint</label>
        <input
          type="number"
          value={mintAmount}
          onChange={(e) => setMintAmount(parseInt(e.target.value) || 1)}
          min="1"
          max="10"
          className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
          disabled={isLoading}
        />
        <p className="text-xs text-text-secondary mt-1">
          Maximum 10 NFTs per transaction
        </p>
      </div>

      {/* Payment Summary */}
      {selectedTier && (
        <div className="mb-6 p-4 bg-background rounded-lg border border-border">
          <h4 className="font-semibold mb-3">Payment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>NFT Price:</span>
              <span>{selectedTier.priceEth} ETH each</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{mintAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{(parseFloat(selectedTier.priceEth) * mintAmount).toFixed(4)} ETH</span>
            </div>
            {gasEstimate && (
              <div className="flex justify-between text-text-secondary">
                <span>Est. Gas Fee:</span>
                <span>~{parseFloat(gasEstimate).toFixed(4)} ETH</span>
              </div>
            )}
            <hr className="border-border" />
            <div className="flex justify-between font-bold text-primary">
              <span>Total Cost:</span>
              <span>
                {gasEstimate 
                  ? (parseFloat(selectedTier.priceEth) * mintAmount + parseFloat(gasEstimate)).toFixed(4)
                  : (parseFloat(selectedTier.priceEth) * mintAmount).toFixed(4)
                } ETH
              </span>
            </div>
          </div>
          
          {/* Balance check */}
          {balance && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between text-sm">
                <span>Your Balance:</span>
                <span className={
                  parseFloat(ethers.formatEther(balance)) < 
                  (parseFloat(selectedTier.priceEth) * mintAmount + (gasEstimate ? parseFloat(gasEstimate) : 0.01))
                    ? 'text-red-400' : 'text-green-400'
                }>
                  {parseFloat(ethers.formatEther(balance)).toFixed(4)} ETH
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mint Button */}
      <Button
        onClick={handleMint}
        variant="primary"
        disabled={
          isLoading || 
          !selectedTier || 
          !validateMinting().valid ||
          (selectedTier && selectedTier.currentSupply >= selectedTier.maxSupply)
        }
        className="w-full"
      >
        {isLoading 
          ? 'Minting...' 
          : selectedTier && selectedTier.currentSupply >= selectedTier.maxSupply
            ? 'Sold Out'
            : `Mint ${mintAmount} NFT${mintAmount > 1 ? 's' : ''}`
        }
      </Button>
      
      {/* Validation error display */}
      {!validateMinting().valid && (
        <p className="text-red-400 text-sm text-center mt-2">
          {validateMinting().error}
        </p>
      )}
    </div>
  );
};

export default NFTMintingInterface;