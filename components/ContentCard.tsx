import React, { useState, useEffect } from 'react';
import { ContentCardData, Page, NavigationProps } from '../types';
import { useWallet } from '../lib/WalletProvider';
import { useSubscriptionManager } from '../hooks/useSubscriptionManager';
import { useNFTAccess } from '../hooks/useNFTAccess';
import HeartIcon from './icons/HeartIcon';

interface ContentCardProps extends NavigationProps {
  item: ContentCardData & {
    creatorAddress?: string;
    accessLevel?: 'public' | 'subscription' | 'nft' | 'premium';
    nftTierRequired?: number;
  };
}

const ContentCard: React.FC<ContentCardProps> = ({ item, onNavigate }) => {
  const { account, isConnected } = useWallet();
  const { checkAccess } = useSubscriptionManager();
  const { checkNFTAccess } = useNFTAccess();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasAccess, setHasAccess] = useState(true); // Default to true for public content
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  // Check access for gated content
  useEffect(() => {
    const checkContentAccess = async () => {
      // Public content is always accessible
      if (item.accessLevel === 'public' || !item.accessLevel) {
        setHasAccess(true);
        return;
      }

      // Skip if missing required data
      if (!account || !isConnected) {
        setHasAccess(false);
        return;
      }

      setIsCheckingAccess(true);
      try {
        let access = false;

        if (item.accessLevel === 'subscription') {
          // Check subscription access
          if (item.creatorAddress && checkAccess) {
            access = await checkAccess(item.creatorAddress, account);
          }
        } else if (item.accessLevel === 'nft') {
          // Check NFT access
          if (item.nftTierRequired && checkNFTAccess) {
            access = await checkNFTAccess(account, item.nftTierRequired);
          }
        } else if (item.accessLevel === 'premium') {
          // For premium content, check both subscription and NFT access
          if (item.creatorAddress && checkAccess) {
            access = await checkAccess(item.creatorAddress, account);
          }
          // If no subscription access, check NFT access as fallback
          if (!access && item.nftTierRequired && checkNFTAccess) {
            access = await checkNFTAccess(account, item.nftTierRequired);
          }
        }

        setHasAccess(access);
      } catch (error) {
        console.error('Error checking content access:', error);
        setHasAccess(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkContentAccess();
  }, [item.accessLevel, item.creatorAddress, item.nftTierRequired, account, isConnected, checkAccess, checkNFTAccess]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleClick = () => {
    if ((item.accessLevel === 'subscription' || item.accessLevel === 'nft' || item.accessLevel === 'premium') && !hasAccess) {
      // Don't navigate if user doesn't have required access
      return;
    }
    onNavigate(Page.Watch);
  };

  return (
    <div
      className={`relative aspect-[9/16] w-full bg-card rounded-2xl overflow-hidden transition-all duration-300 ${
        hasAccess || item.accessLevel === 'public' 
          ? 'cursor-pointer group hover:shadow-[0_0_20px_5px_rgba(255,0,80,0.3)] hover:-translate-y-2' 
          : 'cursor-not-allowed opacity-75'
      }`}
      onClick={handleClick}
    >
      <img
        src={item.thumbnail}
        alt={item.creatorName}
        onLoad={() => setIsImageLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isImageLoaded ? 'blur-0 scale-100' : 'blur-lg scale-110'}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>

      {/* Access Level Badge */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {item.accessLevel === 'subscription' && (
          <div className={`text-white text-xs font-bold px-2 py-1 rounded-full ${
            hasAccess ? 'bg-green-500' : 'bg-orange-500'
          }`}>
            {isCheckingAccess ? '...' : hasAccess ? '✓ Subscribed' : '🔒 Subscribe'}
          </div>
        )}
        {item.accessLevel === 'nft' && (
          <div className={`text-white text-xs font-bold px-2 py-1 rounded-full ${
            hasAccess ? 'bg-purple-500' : 'bg-orange-500'
          }`}>
            {isCheckingAccess ? '...' : hasAccess ? '✓ NFT Holder' : '🎨 NFT Required'}
          </div>
        )}
        {item.accessLevel === 'premium' && (
          <div className={`text-white text-xs font-bold px-2 py-1 rounded-full ${
            hasAccess ? 'bg-gold-500' : 'bg-orange-500'
          }`}>
            {isCheckingAccess ? '...' : hasAccess ? '✓ Premium' : '💎 Premium Only'}
          </div>
        )}
        <div className="bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
          ${item.price.toFixed(2)}
        </div>
      </div>

      {/* Like Count */}
      <div
        className="absolute top-4 left-4 flex items-center gap-2 text-white bg-black/40 p-2 rounded-full cursor-pointer transition-colors"
        onClick={handleLike}
      >
        <HeartIcon className={`w-6 h-6 ${isLiked ? 'text-primary' : 'text-white'}`} />
        <span className="font-bold text-sm">{likeCount.toLocaleString()}</span>
      </div>

      {/* Creator Info */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        <img src={item.creatorAvatar} alt={item.creatorName} className="w-12 h-12 rounded-full border-2 border-primary object-cover" />
        <div>
          <h3 className="font-satoshi font-bold text-white text-lg">{item.creatorName}</h3>
          {!hasAccess && item.accessLevel === 'subscription' && (
            <p className="text-xs text-orange-300">Subscription required</p>
          )}
          {!hasAccess && item.accessLevel === 'nft' && (
            <p className="text-xs text-purple-300">NFT required</p>
          )}
          {!hasAccess && item.accessLevel === 'premium' && (
            <p className="text-xs text-yellow-300">Premium access required</p>
          )}
        </div>
      </div>

      {/* Access Overlay for locked content */}
      {!hasAccess && item.accessLevel && item.accessLevel !== 'public' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center text-white">
            {item.accessLevel === 'subscription' && (
              <>
                <div className="text-4xl mb-2">🔒</div>
                <p className="font-bold">Subscription Required</p>
                <p className="text-sm opacity-75">Subscribe to {item.creatorName}</p>
              </>
            )}
            {item.accessLevel === 'nft' && (
              <>
                <div className="text-4xl mb-2">🎨</div>
                <p className="font-bold">NFT Required</p>
                <p className="text-sm opacity-75">Own NFT Tier #{item.nftTierRequired}</p>
              </>
            )}
            {item.accessLevel === 'premium' && (
              <>
                <div className="text-4xl mb-2">💎</div>
                <p className="font-bold">Premium Access Required</p>
                <p className="text-sm opacity-75">Subscribe or own NFT</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCard;
