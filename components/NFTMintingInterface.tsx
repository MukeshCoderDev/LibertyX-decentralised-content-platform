import React, { useState, useEffect } from 'react';
import { useNFTAccess } from '../hooks/useNFTAccess';
import { NFTTier } from '../types';
import Button from './ui/Button';

interface NFTMintingInterfaceProps {
  creatorAddress: string;
  onSuccess?: (txHash: string) => void;
}

const NFTMintingInterface: React.FC<NFTMintingInterfaceProps> = ({ 
  creatorAddress, 
  onSuccess 
}) => {
  const { getCreatorTiers, mintNFT, isLoading, error } = useNFTAccess();
  const [tiers, setTiers] = useState<NFTTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<NFTTier | null>(null);
  const [mintAmount, setMintAmount] = useState(1);
  const [loadingTiers, setLoadingTiers] = useState(true);

  useEffect(() => {
    const loadTiers = async () => {
      try {
        setLoadingTiers(true);
        const creatorTiers = await getCreatorTiers(creatorAddress);
        setTiers(creatorTiers);
        if (creatorTiers.length > 0) {
          setSelectedTier(creatorTiers[0]);
        }
      } catch (err) {
        console.error('Error loading NFT tiers:', err);
      } finally {
        setLoadingTiers(false);
      }
    };

    if (creatorAddress) {
      loadTiers();
    }
  }, [creatorAddress, getCreatorTiers]);

  const handleMint = async () => {
    if (!selectedTier) {
      alert('Please select an NFT tier');
      return;
    }

    if (mintAmount <= 0) {
      alert('Mint amount must be greater than 0');
      return;
    }

    try {
      const txHash = await mintNFT(selectedTier.id, mintAmount);
      
      if (onSuccess) {
        onSuccess(txHash);
      }
      
      alert(`NFT minting initiated! Transaction hash: ${txHash}`);
    } catch (err: any) {
      console.error('Error minting NFT:', err);
      alert(`Failed to mint NFT: ${err.message}`);
    }
  };

  const parseMetadata = (uri: string) => {
    try {
      if (uri.startsWith('data:application/json;base64,')) {
        const base64Data = uri.replace('data:application/json;base64,', '');
        return JSON.parse(atob(base64Data));
      }
      return null;
    } catch {
      return null;
    }
  };

  if (loadingTiers) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-border rounded mb-4"></div>
          <div className="h-32 bg-border rounded"></div>
        </div>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <p className="text-text-secondary">This creator hasn't created any NFT access tiers yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-2xl">
      <h3 className="text-xl font-satoshi font-bold mb-6">Mint NFT Access</h3>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4">
          {error}
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
                        Max Supply: {tier.maxSupply}
                      </span>
                    </div>
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

      {/* Total Cost */}
      {selectedTier && (
        <div className="mb-6 p-4 bg-background rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Cost:</span>
            <span className="text-lg font-bold text-primary">
              {(parseFloat(selectedTier.priceEth) * mintAmount).toFixed(4)} ETH
            </span>
          </div>
        </div>
      )}

      {/* Mint Button */}
      <Button
        onClick={handleMint}
        variant="primary"
        disabled={isLoading || !selectedTier}
        className="w-full"
      >
        {isLoading ? 'Minting...' : `Mint ${mintAmount} NFT${mintAmount > 1 ? 's' : ''}`}
      </Button>
    </div>
  );
};

export default NFTMintingInterface;