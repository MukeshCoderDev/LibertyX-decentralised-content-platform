import React, { useState, useEffect, useCallback } from 'react';
import { useContractManager } from '../hooks/useContractManager';
// import { ethers } from 'ethers';

interface NFTTierStats {
  id: number;
  name: string;
  holderCount: number;
  totalMinted: number;
  maxSupply: number;
  totalRevenue: string;
  mintingActivity: Array<{
    minter: string;
    amount: number;
    timestamp: number;
  }>;
}

interface NFTAnalyticsProps {
  creatorAddress: string;
}

const NFTAnalytics: React.FC<NFTAnalyticsProps> = ({ creatorAddress }) => {
  const contractManager = useContractManager();
  const [tierStats, setTierStats] = useState<NFTTierStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNFTAnalytics = useCallback(async () => {
    if (!contractManager || !creatorAddress) return;

    setLoading(true);
    setError(null);

    try {
      const contract = contractManager.getContract('nftAccess', contractManager.currentChainId!);
      if (!contract) {
        throw new Error('NFT contract not available');
      }

      // Get tier creation events
      const tierFilter = contract.filters.TierCreated(null, creatorAddress);
      const tierEvents = await contract.queryFilter(tierFilter, -10000);

      const stats: NFTTierStats[] = [];

      for (const event of tierEvents) {
        const tierId = Number(event.args[0]);
        const uri = event.args[2];
        
        // Parse metadata for name
        let name = `Tier #${tierId}`;
        try {
          if (uri.startsWith('data:application/json;base64,')) {
            const base64Data = uri.replace('data:application/json;base64,', '');
            const metadata = JSON.parse(atob(base64Data));
            name = metadata.name || name;
          }
        } catch (e) {
          // Use default name
        }

        // Get minting events for this tier
        const mintFilter = contract.filters.Minted(tierId);
        const mintEvents = await contract.queryFilter(mintFilter, -10000);

        const mintingActivity = mintEvents.map((mintEvent: any) => ({
          minter: mintEvent.args[1],
          amount: Number(mintEvent.args[2]),
          timestamp: Date.now() // In real implementation, get from block
        }));

        // Calculate stats
        const totalMinted = mintingActivity.reduce((sum: any, mint) => sum + mint.amount, 0);
        const uniqueHolders = new Set(mintingActivity.map((mint: any) => mint.minter));
        const holderCount = uniqueHolders.size;

        // Estimate revenue (simplified - would need price from tier creation)
        const totalRevenue = (totalMinted * 0.001).toFixed(4); // Placeholder

        stats.push({
          id: tierId,
          name,
          holderCount,
          totalMinted,
          maxSupply: Number(event.args[3]) || 1000, // From tier creation
          totalRevenue,
          mintingActivity: mintingActivity.slice(-5) // Last 5 mints
        });
      }

      setTierStats(stats);

    } catch (err: any) {
      console.error('Error loading NFT analytics:', err);
      setError(err.message || 'Failed to load NFT analytics');
    } finally {
      setLoading(false);
    }
  }, [contractManager, creatorAddress]);

  useEffect(() => {
    loadNFTAnalytics();
  }, [loadNFTAnalytics]);

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

  if (error) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load NFT analytics</p>
          <button
            onClick={loadNFTAnalytics}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (tierStats.length === 0) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-text-secondary">No NFT tiers created yet</p>
      </div>
    );
  }

  const totalHolders = new Set(
    tierStats.flatMap(tier => tier.mintingActivity.map(mint => mint.minter))
  ).size;
  const totalMinted = tierStats.reduce((sum, tier) => sum + tier.totalMinted, 0);
  const totalRevenue = tierStats.reduce((sum, tier) => sum + parseFloat(tier.totalRevenue), 0);

  return (
    <div className="bg-card p-6 rounded-2xl">
      <h3 className="text-xl font-satoshi font-bold mb-6">NFT Analytics</h3>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-background p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-primary">{totalHolders}</div>
          <div className="text-sm text-text-secondary">Unique Holders</div>
        </div>
        
        <div className="bg-background p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">{totalMinted}</div>
          <div className="text-sm text-text-secondary">Total Minted</div>
        </div>
        
        <div className="bg-background p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">{totalRevenue.toFixed(4)} ETH</div>
          <div className="text-sm text-text-secondary">Total Revenue</div>
        </div>
      </div>

      {/* Tier Performance */}
      <div className="space-y-4">
        <h4 className="font-semibold">Tier Performance</h4>
        {tierStats.map(tier => (
          <div key={tier.id} className="bg-background p-4 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h5 className="font-medium">{tier.name}</h5>
                <p className="text-sm text-text-secondary">Tier #{tier.id}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-primary">{tier.totalRevenue} ETH</div>
                <div className="text-xs text-text-secondary">Revenue</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="font-bold text-blue-400">{tier.holderCount}</div>
                <div className="text-xs text-text-secondary">Holders</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-400">{tier.totalMinted}</div>
                <div className="text-xs text-text-secondary">Minted</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-orange-400">{tier.maxSupply}</div>
                <div className="text-xs text-text-secondary">Max Supply</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-border rounded-full h-2 mb-3">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((tier.totalMinted / tier.maxSupply) * 100, 100)}%`
                }}
              ></div>
            </div>

            {/* Recent minting activity */}
            {tier.mintingActivity.length > 0 && (
              <div>
                <div className="text-xs text-text-secondary mb-2">Recent Activity</div>
                <div className="space-y-1">
                  {tier.mintingActivity.slice(-3).map((mint, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{mint.minter.slice(0, 6)}...{mint.minter.slice(-4)}</span>
                      <span>{mint.amount} minted</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NFTAnalytics;