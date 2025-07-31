import React, { useState, useEffect, memo, useCallback } from 'react';
import { ContentCardData, Page, NavigationProps } from '../types';
import { useWallet } from '../lib/WalletProvider';
import { useSubscriptionManager } from '../hooks/useSubscriptionManager';
import { useNFTAccess } from '../hooks/useNFTAccess';
import { useContractManager } from '../hooks/useContractManager';
import HeartIcon from './icons/HeartIcon';
import PriceDisplay from './PriceDisplay';
import { MessageCircle, Share2, Flag } from 'lucide-react';
import { LockBadge, LockBadgeText } from './ui/LockBadge';
import { Identicon } from './ui/Identicon';
import { 
  shouldDisableSubscribeButton, 
  getInsufficientBalanceTooltip
} from '../utils/validation';

interface ContentCardProps extends NavigationProps {
  item: ContentCardData & {
    creatorAddress?: string;
    accessLevel?: 'public' | 'subscription' | 'nft' | 'premium';
    nftTierRequired?: number;
  };
}

const ContentCard: React.FC<ContentCardProps> = memo(({ item, onNavigate }) => {
  const { account, isConnected, balance } = useWallet();
  const { checkAccess } = useSubscriptionManager();
  const { checkNFTAccess } = useNFTAccess();
  const { executeTransaction } = useContractManager();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [commentCount, _setCommentCount] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasAccess, setHasAccess] = useState(true); // Default to true for public content
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Get subscription price from item (assuming it's available)
  const subscriptionPrice = item.price?.amount ? parseFloat(item.price.amount) : 10; // Default price
  
  // Check if user can afford subscription
  const canAffordSubscription = !shouldDisableSubscribeButton(balance, subscriptionPrice, 'LIB');
  const insufficientBalanceTooltip = getInsufficientBalanceTooltip(balance, subscriptionPrice, 'LIB');

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

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConnected || !account) return;

    try {
      // Submit like/unlike to blockchain
      await executeTransaction('contentRegistry', 'likeContent', [
        item.id,
        !isLiked
      ]);
      
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      console.error('Failed to like content:', error);
    }
  }, [isLiked, likeCount, isConnected, account, executeTransaction, item.id]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  }, []);

  const handleReport = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Open report modal or navigate to moderation page
    console.log('Report content:', item.id);
  }, [item.id]);

  const shareContent = useCallback(async (platform: string) => {
    const shareUrl = `${window.location.origin}/content/${item.id}`;
    const shareText = `Check out this content by ${item.creatorName} on LibertyX!`;

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'discord') {
      // Copy to clipboard for Discord
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Link copied to clipboard! Paste it in Discord.');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }

    // Record share action on blockchain
    if (isConnected && account) {
      try {
        await executeTransaction('contentRegistry', 'shareContent', [
          item.id,
          platform
        ]);
      } catch (error) {
        console.error('Failed to record share:', error);
      }
    }

    setShowShareModal(false);
  }, [item.id, item.creatorName, isConnected, account, executeTransaction]);

  const handleClick = useCallback(() => {
    if ((item.accessLevel === 'subscription' || item.accessLevel === 'nft' || item.accessLevel === 'premium') && !hasAccess) {
      // Don't navigate if user doesn't have required access
      return;
    }
    onNavigate(Page.Watch);
  }, [item.accessLevel, hasAccess, onNavigate]);

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
        {item.accessLevel && item.accessLevel !== 'public' && (
          <LockBadge
            accessType={item.accessLevel}
            hasAccess={hasAccess}
            isLoading={isCheckingAccess}
            tier={item.nftTierRequired}
            size="medium"
          />
        )}
        <PriceDisplay 
          price={item.price} 
          size="medium" 
          animate={true}
        />
      </div>

      {/* Social Actions */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {/* Like */}
        <div
          className="flex items-center gap-2 text-white bg-black/40 p-2 rounded-full cursor-pointer transition-colors hover:bg-black/60"
          onClick={handleLike}
        >
          <HeartIcon className={`w-5 h-5 ${isLiked ? 'text-primary' : 'text-white'}`} />
          <span className="font-bold text-sm">{likeCount.toLocaleString()}</span>
        </div>

        {/* Comments */}
        <div className="flex items-center gap-2 text-white bg-black/40 p-2 rounded-full">
          <MessageCircle className="w-5 h-5" />
          <span className="font-bold text-sm">{commentCount.toLocaleString()}</span>
        </div>

        {/* Share */}
        <div
          className="flex items-center gap-2 text-white bg-black/40 p-2 rounded-full cursor-pointer transition-colors hover:bg-black/60"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5" />
        </div>

        {/* Report */}
        <div
          className="flex items-center gap-2 text-white bg-black/40 p-2 rounded-full cursor-pointer transition-colors hover:bg-red-500/60"
          onClick={handleReport}
        >
          <Flag className="w-4 h-4" />
        </div>
      </div>

      {/* Creator Info */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        {item.creatorAvatar ? (
          <img 
            src={item.creatorAvatar} 
            alt={item.creatorName} 
            className="w-12 h-12 rounded-full border-2 border-primary object-cover" 
          />
        ) : (
          <Identicon 
            address={item.creatorAddress || account || '0x0000000000000000000000000000000000000000'} 
            size="medium"
            className="border-2 border-primary"
          />
        )}
        <div>
          <h3 className="font-satoshi font-bold text-white text-lg">{item.creatorName}</h3>
          {item.accessLevel && item.accessLevel !== 'public' && (
            <LockBadgeText
              accessType={item.accessLevel}
              hasAccess={hasAccess}
              tier={item.nftTierRequired}
            />
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
                <p className="font-bold">Subscribe Required</p>
                <p className="text-sm opacity-75">Subscribe to {item.creatorName}</p>
                {isConnected && (
                  <div className="mt-4 relative">
                    <button
                      disabled={!canAffordSubscription}
                      onMouseEnter={() => !canAffordSubscription && setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className={`
                        px-4 py-2 rounded-md font-medium transition-colors
                        ${canAffordSubscription 
                          ? 'bg-primary text-white hover:bg-primary-dark' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      Subscribe Now
                    </button>
                    {showTooltip && !canAffordSubscription && insufficientBalanceTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-md whitespace-nowrap">
                        {insufficientBalanceTooltip}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {item.accessLevel === 'nft' && (
              <>
                <div className="text-4xl mb-2">🎨</div>
                <p className="font-bold">Need NFT Tier #{item.nftTierRequired || 1}</p>
                <p className="text-sm opacity-75">Own NFT Tier #{item.nftTierRequired || 1} to access</p>
              </>
            )}
            {item.accessLevel === 'premium' && (
              <>
                <div className="text-4xl mb-2">💎</div>
                <p className="font-bold">Premium Required</p>
                <p className="text-sm opacity-75">Subscribe or own NFT to access</p>
                {isConnected && (
                  <div className="mt-4 relative">
                    <button
                      disabled={!canAffordSubscription}
                      onMouseEnter={() => !canAffordSubscription && setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className={`
                        px-4 py-2 rounded-md font-medium transition-colors
                        ${canAffordSubscription 
                          ? 'bg-primary text-white hover:bg-primary-dark' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      Get Premium Access
                    </button>
                    {showTooltip && !canAffordSubscription && insufficientBalanceTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-md whitespace-nowrap">
                        {insufficientBalanceTooltip}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.stopPropagation();
            setShowShareModal(false);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Share Content</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => shareContent('twitter')}
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
              >
                <span>🐦</span>
                <span>Twitter</span>
              </button>
              <button
                onClick={() => shareContent('telegram')}
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
              >
                <span>✈️</span>
                <span>Telegram</span>
              </button>
              <button
                onClick={() => shareContent('discord')}
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
              >
                <span>🎮</span>
                <span>Discord</span>
              </button>
              <button
                onClick={() => shareContent('copy')}
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
              >
                <span>📋</span>
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ContentCard;
