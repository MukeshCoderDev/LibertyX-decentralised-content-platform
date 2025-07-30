import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNFTAccess } from '../hooks/useNFTAccess';
import { useContractManager } from '../hooks/useContractManager';
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
  const contractManager = useContractManager();
  const [tiers, setTiers] = useState<NFTTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMintInterface, setShowMintInterface] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAvailable, setContractAvailable] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading NFT tiers...');
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const contractCheckCache = useRef<{ [key: string]: { result: boolean; timestamp: number } }>({});

  // Check contract availability with caching
  const checkContractAvailability = useCallback(async () => {
    if (!contractManager) return false;

    const cacheKey = `nftAccess_${contractManager.currentChainId}`;
    const cached = contractCheckCache.current[cacheKey];
    const now = Date.now();
    
    // Use cached result if less than 10 seconds old
    if (cached && (now - cached.timestamp) < 10000) {
      setContractAvailable(cached.result);
      return cached.result;
    }

    try {
      const isAvailable = await contractManager.isContractAvailable('nftAccess');
      
      // Cache the result
      contractCheckCache.current[cacheKey] = {
        result: isAvailable,
        timestamp: now
      };
      
      setContractAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('Error checking NFT contract availability:', error);
      setContractAvailable(false);
      return false;
    }
  }, [contractManager]);

  // Retry logic with exponential backoff
  const retryOperation = useCallback(async (operation: () => Promise<void>, maxRetries: number = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        setRetryCount(0);
        return;
      } catch (error: any) {
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        setRetryCount(attempt);
        setLoadingMessage(`Retrying... (${attempt}/${maxRetries})`);
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  // Load NFT tiers - stable version
  const loadTiers = useCallback(async () => {
    if (!creatorAddress || loadingRef.current || !mountedRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setLoadingMessage('Checking NFT contract availability...');

    try {
      // Add a small delay to prevent rapid re-renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!mountedRef.current) return;

      // Check if contract is available
      const isAvailable = await checkContractAvailability();
      
      if (!mountedRef.current) return;
      
      if (!isAvailable) {
        setError('NFT access contract is not deployed or not responding. Please check your network connection or try again later.');
        setTiers([]);
        setContractAvailable(false);
        return;
      }

      setContractAvailable(true);
      setLoadingMessage('Loading NFT tiers...');

      // Load tiers
      const creatorTiers = await getCreatorTiers(creatorAddress);
      
      if (!mountedRef.current) return;
      
      setTiers(creatorTiers);

    } catch (err: any) {
      if (!mountedRef.current) return;
      
      console.error('Error loading creator NFT tiers:', err);
      setError(err.message || 'Failed to load NFT tiers. Please try again.');
      setTiers([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMessage('Loading NFT tiers...');
      }
      loadingRef.current = false;
    }
  }, [creatorAddress, getCreatorTiers, checkContractAvailability]);

  useEffect(() => {
    mountedRef.current = true;
    loadTiers();
    
    return () => {
      mountedRef.current = false;
    };
  }, [creatorAddress]);

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
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>{loadingMessage}</span>
          </div>
          {retryCount > 0 && (
            <div className="text-sm text-text-secondary">
              Retry attempt {retryCount}/3
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-red-400 text-sm">{error}</p>
              {contractAvailable === false && (
                <div className="mt-2 text-xs text-red-300">
                  <p>Possible solutions:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Check your network connection</li>
                    <li>Make sure you're connected to Sepolia testnet</li>
                    <li>Try refreshing the page</li>
                  </ul>
                </div>
              )}
            </div>
            <Button
              onClick={loadTiers}
              variant="secondary"
              size="sm"
              className="ml-4 text-xs"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (tiers.length === 0 && contractAvailable) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <div className="text-4xl mb-4">🎨</div>
        <h3 className="text-lg font-bold mb-2">No NFT Tiers Available</h3>
        <p className="text-text-secondary mb-4">
          {creatorName} hasn't created any NFT access tiers yet.
        </p>
        <div className="text-sm text-text-secondary">
          <p>NFT tiers allow creators to offer exclusive content to NFT holders.</p>
          <p className="mt-1">Check back later or contact the creator directly.</p>
        </div>
        <Button
          onClick={loadTiers}
          variant="secondary"
          className="mt-4"
        >
          Refresh
        </Button>
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