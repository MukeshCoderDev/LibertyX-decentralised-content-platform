import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useNFTAccess } from '../hooks/useNFTAccess';
import { NFTHolding } from '../types';

const UserNFTCollection: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { getUserNFTs } = useNFTAccess();
  const [nftHoldings, setNftHoldings] = useState<NFTHolding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserNFTs = async () => {
      if (!account || !isConnected) {
        setNftHoldings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const holdings = await getUserNFTs(account);
        setNftHoldings(holdings);
      } catch (err) {
        console.error('Error loading user NFTs:', err);
        setNftHoldings([]);
      } finally {
        setLoading(false);
      }
    };

    // Use setTimeout to prevent blocking the main thread
    const timeoutId = setTimeout(() => {
      loadUserNFTs();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [account, isConnected]); // Remove getUserNFTs to prevent infinite loops

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

  if (!isConnected) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h3 className="text-lg font-bold mb-2">Connect Your Wallet</h3>
        <p className="text-text-secondary">
          Connect your wallet to view your NFT collection
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-border rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-32 bg-border rounded"></div>
                <div className="h-4 bg-border rounded"></div>
                <div className="h-3 bg-border rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (nftHoldings.length === 0) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <div className="text-4xl mb-4">🎨</div>
        <h3 className="text-lg font-bold mb-2">No NFTs Yet</h3>
        <p className="text-text-secondary">
          You don't own any creator access NFTs yet. Browse creators to find exclusive NFT tiers!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-2xl">
      <h3 className="text-xl font-satoshi font-bold mb-6">Your NFT Collection</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nftHoldings.map((holding) => {
          const metadata = parseMetadata(holding.tier.uri);
          return (
            <div
              key={`${holding.tierId}-${holding.tier.creatorAddress}`}
              className="bg-background p-4 rounded-lg border border-border"
            >
              {metadata?.image && (
                <img
                  src={metadata.image}
                  alt={metadata.name || `Tier ${holding.tierId}`}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              
              <div className="space-y-2">
                <h4 className="font-semibold">
                  {metadata?.name || `NFT Tier #${holding.tierId}`}
                </h4>
                
                {metadata?.description && (
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {metadata.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">
                    Creator: {holding.tier.creatorAddress.substring(0, 6)}...
                    {holding.tier.creatorAddress.substring(holding.tier.creatorAddress.length - 4)}
                  </span>
                  <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-medium">
                    Owned: {holding.amount}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Tier #{holding.tierId}</span>
                    <span>✨ Access NFT</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Total NFTs: {nftHoldings.reduce((sum, holding) => sum + holding.amount, 0)}
        </p>
      </div>
    </div>
  );
};

export default UserNFTCollection;