import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useSubscriptionManager, SubscriptionPlan, SubscriptionStatus } from '../hooks/useSubscriptionManager';
import SubscriptionCard from './SubscriptionCard';
import Button from './ui/Button';

interface CreatorSubscriptionPlansProps {
  creatorAddress: string;
  creatorName: string;
  creatorAvatar?: string;
  isOwnProfile?: boolean;
}

const CreatorSubscriptionPlans: React.FC<CreatorSubscriptionPlansProps> = ({
  creatorAddress,
  creatorName,
  creatorAvatar,
  isOwnProfile = false
}) => {
  const { account, isConnected } = useWallet();
  const {
    getCreatorPlan,
    getSubscriptionStatus,
    isLoading,
    error
  } = useSubscriptionManager();

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [_subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showManagement, setShowManagement] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!creatorAddress) return;

      try {
        // Load creator's plan
        const creatorPlan = await getCreatorPlan(creatorAddress);
        setPlan(creatorPlan);

        // Load user's subscription status if connected and not own profile
        if (account && isConnected && !isOwnProfile) {
          const status = await getSubscriptionStatus(creatorAddress, account);
          setSubscriptionStatus(status);
        }
      } catch (err: any) {
        console.error('Error loading subscription data:', err);
      }
    };

    loadData();
  }, [creatorAddress, account, isConnected, isOwnProfile, getCreatorPlan, getSubscriptionStatus]);

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Loading subscription data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isOwnProfile) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-satoshi font-bold">Subscription Plan</h3>
          <Button
            onClick={() => setShowManagement(!showManagement)}
            variant="secondary"
            className="text-sm"
          >
            {showManagement ? 'Hide' : 'Manage'}
          </Button>
        </div>

        {plan ? (
          <div className="space-y-4">
            <div className="bg-background/50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Price</p>
                  <p className="font-bold text-primary">{plan.priceEth} ETH</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Duration</p>
                  <p className="font-medium">{plan.durationDays} days</p>
                </div>
              </div>
            </div>

            {showManagement && (
              <div className="border-t border-border pt-4">
                <p className="text-sm text-text-secondary mb-2">
                  Manage your subscription plan settings
                </p>
                <Button
                  onClick={() => console.log('Open subscription management')}
                  variant="primary"
                  className="w-full"
                >
                  Edit Plan
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💰</div>
            <h4 className="font-bold mb-2">No Subscription Plan</h4>
            <p className="text-text-secondary mb-4">
              Create a subscription plan to earn recurring revenue from your fans
            </p>
            <Button
              onClick={() => setShowManagement(true)}
              variant="primary"
            >
              Create Subscription Plan
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Fan view
  if (!plan) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📋</div>
          <h4 className="font-bold mb-2">No Subscription Available</h4>
          <p className="text-text-secondary">
            This creator hasn't set up a subscription plan yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionCard
      creatorAddress={creatorAddress}
      creatorName={creatorName}
      creatorAvatar={creatorAvatar}
      onSubscriptionChange={(isSubscribed) => {
        console.log('Subscription status changed:', isSubscribed);
      }}
    />
  );
};

export default CreatorSubscriptionPlans;