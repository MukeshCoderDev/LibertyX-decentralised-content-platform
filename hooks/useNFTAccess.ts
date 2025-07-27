import { useState, useCallback } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from './useContractManager';
import { ethers } from 'ethers';
import { NFTTier, NFTHolding, NFTTierStats } from '../types';

export interface UseNFTAccessReturn {
  // Tier management (for creators)
  createTier: (uri: string, maxSupply: number, priceEth: string) => Promise<string>;
  getCreatorTiers: (creatorAddress: string) => Promise<NFTTier[]>;
  getTierStats: (creatorAddress: string) => Promise<NFTTierStats[]>;
  
  // NFT minting (for fans)
  mintNFT: (tierId: number, amount: number) => Promise<string>;
  getUserNFTs: (userAddress: string) => Promise<NFTHolding[]>;
  checkNFTAccess: (userAddress: string, tierId: number) => Promise<boolean>;
  
  // State
  isLoading: boolean;
  error: string | null;
}

export const useNFTAccess = (): UseNFTAccessReturn => {
  const { account } = useWallet();
  const contractManager = useContractManager();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTier = useCallback(async (
    uri: string, 
    maxSupply: number, 
    priceEth: string
  ): Promise<string> => {
    if (!contractManager || !account) {
      throw new Error('Wallet not connected or contract manager not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const priceWei = ethers.parseEther(priceEth);

      const result = await contractManager.executeTransaction(
        'nftAccess',
        'createTier',
        [uri, maxSupply, priceWei.toString()]
      );

      return result.hash;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create NFT tier';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractManager, account]);

  const getCreatorTiers = useCallback(async (creatorAddress: string): Promise<NFTTier[]> => {
    if (!contractManager) {
      console.log('Contract manager not available for getCreatorTiers');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const nftContract = contractManager.getContract('nftAccess', contractManager.currentChainId!);
      
      if (!nftContract) {
        throw new Error('NFT Access contract not available');
      }

      // Get the next ID to know how many tiers exist
      const nextId = await nftContract.nextId();
      const tiers: NFTTier[] = [];

      // Check each tier to see if it belongs to this creator
      for (let i = 1; i < nextId; i++) {
        try {
          const creator = await nftContract.creatorOf(i);
          if (creator.toLowerCase() === creatorAddress.toLowerCase()) {
            const uri = await nftContract.uri(i);
            // Note: The contract doesn't store maxSupply or price, so we'll use placeholder values
            // In a real implementation, you'd want to store this data or emit it in events
            tiers.push({
              id: i,
              creatorAddress: creator,
              uri: uri,
              maxSupply: 1000, // Placeholder - would need to be stored in contract
              currentSupply: 0, // Would need to track this
              priceWei: '0', // Placeholder - would need to be stored in contract
              priceEth: '0',
              isActive: true
            });
          }
        } catch (tierError) {
          // Tier doesn't exist or error accessing it, skip
          continue;
        }
      }

      return tiers;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get creator tiers';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractManager]);

  const getTierStats = useCallback(async (creatorAddress: string): Promise<NFTTierStats[]> => {
    if (!contractManager) {
      console.log('Contract manager not available for getTierStats');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const tiers = await getCreatorTiers(creatorAddress);
      const stats: NFTTierStats[] = [];

      for (const tier of tiers) {
        // In a real implementation, you'd query events or have additional contract methods
        // to get accurate statistics. For now, we'll return placeholder data.
        stats.push({
          tierId: tier.id,
          holderCount: 0, // Would need to be calculated from events
          totalMinted: 0, // Would need to be calculated from events
          maxSupply: tier.maxSupply,
          revenue: '0',
          revenueEth: '0'
        });
      }

      return stats;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get tier statistics';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractManager, getCreatorTiers]);

  const mintNFT = useCallback(async (tierId: number, amount: number): Promise<string> => {
    if (!contractManager || !account) {
      throw new Error('Wallet not connected or contract manager not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Note: The current contract doesn't enforce price payment in the mint function
      // In a production version, you'd want to modify the contract to handle pricing
      const result = await contractManager.executeTransaction(
        'nftAccess',
        'mint',
        [tierId, amount]
      );

      return result.hash;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to mint NFT';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractManager, account]);

  const getUserNFTs = useCallback(async (userAddress: string): Promise<NFTHolding[]> => {
    if (!contractManager) {
      console.log('Contract manager not available for getUserNFTs');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const nftContract = contractManager.getContract('nftAccess', contractManager.currentChainId!);
      
      if (!nftContract) {
        throw new Error('NFT Access contract not available');
      }

      const nextId = await nftContract.nextId();
      const holdings: NFTHolding[] = [];

      // Limit the number of tiers to check to prevent blocking
      const maxTiersToCheck = Math.min(Number(nextId), 50);

      // Check balance for each tier with async batching to prevent blocking
      const batchSize = 5;
      for (let i = 1; i < maxTiersToCheck; i += batchSize) {
        const batch = [];
        
        for (let j = i; j < Math.min(i + batchSize, maxTiersToCheck); j++) {
          batch.push(
            (async () => {
              try {
                const balance = await nftContract.balanceOf(userAddress, j);
                if (balance > 0) {
                  const creator = await nftContract.creatorOf(j);
                  const uri = await nftContract.uri(j);
                  
                  return {
                    tierId: j,
                    amount: Number(balance),
                    tier: {
                      id: j,
                      creatorAddress: creator,
                      uri: uri,
                      maxSupply: 1000, // Placeholder
                      currentSupply: 0, // Placeholder
                      priceWei: '0', // Placeholder
                      priceEth: '0',
                      isActive: true
                    }
                  };
                }
                return null;
              } catch (balanceError) {
                // Error checking balance for this tier, skip
                return null;
              }
            })()
          );
        }
        
        // Process batch and yield control to prevent blocking
        const batchResults = await Promise.all(batch);
        holdings.push(...batchResults.filter(result => result !== null) as NFTHolding[]);
        
        // Yield control to prevent blocking the main thread
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      return holdings;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get user NFTs';
      setError(errorMessage);
      console.error('getUserNFTs error:', errorMessage);
      return []; // Return empty array instead of throwing to prevent blocking
    } finally {
      setIsLoading(false);
    }
  }, [contractManager]);

  const checkNFTAccess = useCallback(async (userAddress: string, tierId: number): Promise<boolean> => {
    if (!contractManager) {
      console.log('Contract manager not available for checkNFTAccess');
      return false;
    }

    try {
      const nftContract = contractManager.getContract('nftAccess', contractManager.currentChainId!);
      
      if (!nftContract) {
        console.log('NFT Access contract not available');
        return false;
      }

      try {
        const balance = await nftContract.balanceOf(userAddress, tierId);
        return Number(balance) > 0;
      } catch (accessError: any) {
        console.log('Error checking NFT access, defaulting to false:', accessError);
        return false;
      }
    } catch (err: any) {
      console.error('Error checking NFT access:', err);
      return false;
    }
  }, [contractManager]);

  return {
    createTier,
    getCreatorTiers,
    getTierStats,
    mintNFT,
    getUserNFTs,
    checkNFTAccess,
    isLoading,
    error
  };
};