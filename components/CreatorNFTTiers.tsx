import React, { useState, useEffect } from 'react';
import { useNFTAccess } from '../hooks/useNFTAccess';
import { NFTTier } from '../types';
import Button from './ui/Button';
import NFTMintingInterface from './NFTMintingInterface';

interface CreatorNFTTiersProps {
  creatorAddress: string;
  creatorName: string;
}

const CreatorNFTTiers: React.FC<CreatorNFTTiersProps> = ({ 
  creatorAddress, 
  creatorName 
}) => {
  const { getCreatorTiers } = useNFTAccess();
  const [tiers, setTiers] = useState<NFTTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMintInterface, setShowMintInterface] = useState(false);

  useEffect(() => {
    const loadTiers = async () => {
      try {
        setLoading(true);
        const creatorTiers = await getCreatorTiers(creatorAddress);
        setTiers(creatorTiers);
      } catch (err) {
        console.error('Error loading creator NFT tiers:', err);
      } finally {
        setLoading(false);
      }
    };

    if (creatorAddress) {
      loadTiers();
    }
  }, [creatorAddress, getCreatorTiers]);

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

  const handleMintSuccess = (txHash: string) => {
    setShowMintInterface(false);
    alert(`NFT minted successfully! Transaction hash: ${txHash}`);
  };

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-border rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-border rounded"></div>
            <div className="h-32 bg-border rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <div className="text-4xl mb-4">🎨</div>
        <h3 className="text-lg font-bold mb-2">No NFT Tiers Available</h3>
        <p className="text-text-secondary">
          {creatorName} hasn't created any NFT access tiers yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-satoshi font-bold">NFT Access Tiers</h3>
            <p className="text-text-secondary">
              Own NFTs to access exclusive content from {creatorName}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowMintInterface(!showMintInterface)}
          >
            {showMintInterface ? 'Hide Minting' : 'Mint NFT'}
          </Button>
        </div>

        {/* NFT Tiers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((tier) => {
            const metadata = parseMetadata(tier.uri);
            return (
              <div
                key={tier.id}
                className="bg-background p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                {metadata?.image && (
                  <img
                    src={metadata.image}
                    alt={metadata.name || `Tier ${tier.id}`}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                
                <div className="space-y-2">
                  <h4 className="font-semibold">
                    {metadata?.name || `NFT Tier #${tier.id}`}
                  </h4>
                  
                  {metadata?.description && (
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {metadata.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-primary font-bold">
                      {tier.priceEth} ETH
                    </span>
                    <span className="text-xs text-text-secondary">
                      Max: {tier.maxSupply}
                    </span>
                  </div>
                  
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((tier.currentSupply / tier.maxSupply) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-text-secondary text-center">
                    {tier.currentSupply} / {tier.maxSupply} minted
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Minting Interface */}
      {showMintInterface && (
        <NFTMintingInterface
          creatorAddress={creatorAddress}
          onSuccess={handleMintSuccess}
        />
      )}
    </div>
  );
};

export default CreatorNFTTiers;