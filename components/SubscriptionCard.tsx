import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useSubscriptionManager, SubscriptionPlan, SubscriptionStatus } from '../hooks/useSubscriptionManager';
import Button from './ui/Button';

interface SubscriptionCardProps {
  creatorAddress: string;
  creatorName: string;
  creatorAvatar?: string;
  compact?: boolean; // For smaller displays
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  creatorAddress,
  creatorName,
  creatorAvatar,
  compact = false,
  onSubscriptionChange
}) => {
  const { account, isConnected } = useWallet();
  const {
    getCreatorPlan,
    subscribe,
    getSubscriptionStatus,
    isLoading,
    error
  } = useSubscriptionManager();

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load plan and subscription status
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!creatorAddress) return;

      try {
        if (isMounted) {
          setLocalError(null);
        }
        
        // Load creator's plan
        const creatorPlan = await getCreatorPlan(creatorAddress);
        if (isMounted) {
          setPlan(creatorPlan);
        }

        // Load user's subscription status if connected
        if (account && isConnected) {
          const status = await getSubscriptionStatus(creatorAddress, account);
          if (isMounted) {
            setSubscriptionStatus(status);
            onSubscriptionChange?.(status?.isActive || false);
          }
        }
      } catch (err: any) {
        console.error('Error loading subscription data:', err);
        if (isMounted) {
          setLocalError(err.message);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [creatorAddress, account, isConnected]); // Removed function dependencies to prevent infinite loops

  const handleSubscribe = useCallback(async () => {
    if (!account || !isConnected) {
      setLocalError('Please connect your wallet to subscribe');
      return;
    }

    setIsSubscribing(true);
    setLocalError(null);

    try {
      const txHash = await subscribe(creatorAddress);
      console.log('Subscription transaction:', txHash);

      // Refresh subscription status
      const newStatus = await getSubscriptionStatus(creatorAddress, account);
      setSubscriptionStatus(newStatus);
      onSubscriptionChange?.(newStatus?.isActive || false);

    } catch (err: any) {
      console.error('Subscription error:', err);
      setLocalError(err.message);
    } finally {
      setIsSubscribing(false);
    }
  }, [account, isConnected, creatorAddress, subscribe, getSubscriptionStatus, onSubscriptionChange]);

  if (!plan) {
    return compact ? null : (
      <div className="bg-card p-4 rounded-lg border border-border">
        <p className="text-sm text-text-secondary text-center">
          No subscription plan available
        </p>
      </div>
    );
  }

  const displayError = localError || error;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
        <div className="flex items-center space-x-2">
          {creatorAvatar && (
            <img 
              src={creatorAvatar} 
              alt={creatorName}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div>
            <p className="text-sm font-medium">{creatorName}</p>
            <p className="text-xs text-text-secondary">
              {plan.priceEth} ETH/{plan.durationDays}d
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {subscriptionStatus?.isActive ? (
            <div className="text-xs">
              <span className="text-green-400">✅ Active</span>
              <p className="text-text-secondary">
                {subscriptionStatus.daysRemaining}d left
              </p>
            </div>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={isSubscribing || isLoading || !isConnected}
              variant="primary"
              className="text-xs px-3 py-1"
            >
              {isSubscribing ? 'Subscribing...' : 'Subscribe'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-2xl border border-border">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        {creatorAvatar && (
          <img 
            src={creatorAvatar} 
            alt={creatorName}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="font-satoshi font-bold text-lg">{creatorName}</h3>
          <p className="text-sm text-text-secondary">Creator Subscription</p>
        </div>
      </div>

      {/* Plan Details */}
      <div className="bg-background/50 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">Price</span>
          <span className="font-bold text-primary">{plan.priceEth} ETH</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Duration</span>
          <span className="font-medium">{plan.durationDays} days</span>
        </div>
      </div>

      {/* Subscription Status */}
      {subscriptionStatus && (
        <div className="bg-background/50 p-4 rounded-lg mb-4">
          <h4 className="font-medium mb-2">Your Subscription</h4>
          {subscriptionStatus.isActive ? (
            <div className="space-y-1">
              <p className="text-green-400 font-medium">✅ Active</p>
              <p className="text-sm text-text-secondary">
                {subscriptionStatus.daysRemaining} days remaining
              </p>
              <p className="text-xs text-text-secondary">
                Expires: {new Date(subscriptionStatus.expiresAt * 1000).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-red-400">❌ Not subscribed</p>
          )}
        </div>
      )}

      {/* Error Display */}
      {displayError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{displayError}</p>
        </div>
      )}

      {/* Action Button */}
      {!subscriptionStatus?.isActive && (
        <Button
          onClick={handleSubscribe}
          disabled={isSubscribing || isLoading || !isConnected}
          variant="primary"
          className="w-full"
        >
          {!isConnected 
            ? 'Connect Wallet to Subscribe'
            : isSubscribing 
            ? 'Subscribing...' 
            : `Subscribe for ${plan.priceEth} ETH`
          }
        </Button>
      )}

      {/* Renew Button */}
      {subscriptionStatus?.isActive && (
        <Button
          onClick={handleSubscribe}
          disabled={isSubscribing || isLoading}
          variant="secondary"
          className="w-full"
        >
          {isSubscribing ? 'Renewing...' : `Renew for ${plan.priceEth} ETH`}
        </Button>
      )}
    </div>
  );
};

export default SubscriptionCard;