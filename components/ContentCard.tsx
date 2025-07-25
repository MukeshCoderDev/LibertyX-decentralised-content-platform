import React, { useState, useEffect } from 'react';
import { ContentCardData, Page, NavigationProps } from '../types';
import { useWallet } from '../lib/WalletProvider';
import { useSubscriptionManager } from '../hooks/useSubscriptionManager';
import HeartIcon from './icons/HeartIcon';

interface ContentCardProps extends NavigationProps {
  item: ContentCardData & {
    creatorAddress?: string;
    accessLevel?: 'public' | 'subscription' | 'nft' | 'premium';
  };
}

const ContentCard: React.FC<ContentCardProps> = ({ item, onNavigate }) => {
  const { account, isConnected } = useWallet();
  const { checkAccess } = useSubscriptionManager();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasAccess, setHasAccess] = useState(true); // Default to true for public content
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  // Check subscription access for subscription-gated content
  useEffect(() => {
    const checkSubscriptionAccess = async () => {
      // Skip subscription checks if not subscription content
      if (item.accessLevel !== 'subscription') {
        setHasAccess(true);
        return;
      }

      // Skip if missing required data
      if (!item.creatorAddress || !account || !isConnected) {
        setHasAccess(false);
        return;
      }

      // Skip if checkAccess function is not available
      if (!checkAccess) {
        console.log('Subscription manager not available, defaulting to no access');
        setHasAccess(false);
        return;
      }

      setIsCheckingAccess(true);
      try {
        const access = await checkAccess(item.creatorAddress, account);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking subscription access:', error);
        setHasAccess(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkSubscriptionAccess();
  }, [item.accessLevel, item.creatorAddress, account, isConnected, checkAccess]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleClick = () => {
    if (item.accessLevel === 'subscription' && !hasAccess) {
      // Don't navigate if user doesn't have subscription access
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
          {item.accessLevel === 'subscription' && !hasAccess && (
            <p className="text-xs text-orange-300">Subscription required</p>
          )}
        </div>
      </div>

      {/* Subscription Overlay for locked content */}
      {item.accessLevel === 'subscription' && !hasAccess && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl mb-2">🔒</div>
            <p className="font-bold">Subscription Required</p>
            <p className="text-sm opacity-75">Subscribe to {item.creatorName}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCard;
