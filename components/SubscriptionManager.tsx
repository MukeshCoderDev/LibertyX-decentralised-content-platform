import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { ethers } from 'ethers';
import Button from './ui/Button';

interface SubscriptionPlan {
  priceWei: string;
  duration: number; // in seconds
  priceEth: string; // formatted price in ETH
  durationDays: number; // duration in days for display
}

interface Subscription {
  expiresAt: number;
  isActive: boolean;
}

interface SubscriptionManagerProps {
  creatorAddress?: string;
  mode: 'creator' | 'fan'; // creator mode for setting plans, fan mode for subscribing
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ 
  creatorAddress, 
  mode 
}) => {
  const { account, isConnected } = useWallet();
  const contractManager = useContractManager();
  
  // State for creator plan management
  const [planPrice, setPlanPrice] = useState<string>('0.01');
  const [planDuration, setPlanDuration] = useState<number>(30);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  
  // State for fan subscription
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const targetCreator = creatorAddress || account;

  // Load current plan or subscription status
  useEffect(() => {
    if (!contractManager || !targetCreator) return;

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const subscriptionContract = contractManager.getContract('subscriptionManager', contractManager.currentChainId!);
        
        if (!subscriptionContract) {
          throw new Error('Subscription contract not available');
        }

        if (mode === 'creator') {
          // Load creator's current plan
          try {
            const plan = await subscriptionContract.plans(targetCreator);
            if (plan && plan.priceWei && plan.priceWei > 0) {
              setCurrentPlan({
                priceWei: plan.priceWei.toString(),
                duration: Number(plan.duration),
                priceEth: ethers.formatEther(plan.priceWei),
                durationDays: Math.floor(Number(plan.duration) / (24 * 60 * 60))
              });
            } else {
              setCurrentPlan(null);
            }
          } catch (planError: any) {
            console.log('No plan found for creator (this is normal for new creators)');
            setCurrentPlan(null);
          }
        } else if (mode === 'fan' && account) {
          // Load fan's subscription status
          try {
            const sub = await subscriptionContract.subs(targetCreator, account);
            const expiresAt = Number(sub.expiresAt);
            setSubscription({
              expiresAt,
              isActive: expiresAt > Math.floor(Date.now() / 1000)
            });
          } catch (subError: any) {
            console.log('No subscription found for user (this is normal)');
            setSubscription({
              expiresAt: 0,
              isActive: false
            });
          }
        }
      } catch (err: any) {
        console.error('Error loading subscription data:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load subscription data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [contractManager?.currentChainId, targetCreator, account, mode]); // Use chainId instead of contractManager object

  // Create or update subscription plan (creator mode)
  const handleSetPlan = async () => {
    if (!contractManager || !account) {
      setError('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const priceWei = ethers.parseEther(planPrice);
      const durationSeconds = planDuration * 24 * 60 * 60; // convert days to seconds

      const result = await contractManager.executeTransaction(
        'subscriptionManager',
        'setPlan',
        [priceWei.toString(), durationSeconds]
      );

      setSuccess(`Plan set successfully! Transaction: ${result.hash}`);
      
      // Update current plan display
      setCurrentPlan({
        priceWei: priceWei.toString(),
        duration: durationSeconds,
        priceEth: planPrice,
        durationDays: planDuration
      });

    } catch (err: any) {
      console.error('Error setting plan:', err);
      setError(err.message || 'Failed to set subscription plan');
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to creator (fan mode)
  const handleSubscribe = async () => {
    if (!contractManager || !account || !currentPlan) {
      setError('Missing required data for subscription');
      return;
    }

    setIsSubscribing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await contractManager.executeTransaction(
        'subscriptionManager',
        'subscribe',
        [targetCreator],
        { value: currentPlan.priceWei }
      );

      setSuccess(`Subscribed successfully! Transaction: ${result.hash}`);
      
      // Update subscription status
      const newExpiresAt = Math.floor(Date.now() / 1000) + currentPlan.duration;
      setSubscription({
        expiresAt: newExpiresAt,
        isActive: true
      });

    } catch (err: any) {
      console.error('Error subscribing:', err);
      setError(err.message || 'Failed to subscribe');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <p className="text-center text-text-secondary">
          Please connect your wallet to manage subscriptions
        </p>
      </div>
    );
  }

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

  return (
    <div className="bg-card p-6 rounded-2xl">
      <h3 className="text-xl font-satoshi font-bold mb-6">
        {mode === 'creator' ? 'Subscription Plan Management' : 'Creator Subscription'}
      </h3>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {mode === 'creator' ? (
        <div className="space-y-6">
          {/* Current Plan Display */}
          {currentPlan && (
            <div className="bg-background/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Current Plan</h4>
              <p className="text-sm text-text-secondary">
                Price: {currentPlan.priceEth} ETH ({currentPlan.durationDays} days)
              </p>
            </div>
          )}

          {/* Plan Creation Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Subscription Price (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={planPrice}
                onChange={(e) => setPlanPrice(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Duration (Days)
              </label>
              <select
                value={planDuration}
                onChange={(e) => setPlanDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>365 days</option>
              </select>
            </div>

            <Button
              onClick={handleSetPlan}
              disabled={isLoading || !planPrice || planPrice === '0'}
              variant="primary"
              className="w-full"
            >
              {isLoading ? 'Setting Plan...' : currentPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Creator Plan Display */}
          {currentPlan ? (
            <div className="bg-background/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Subscription Plan</h4>
              <p className="text-lg font-bold text-primary">
                {currentPlan.priceEth} ETH
              </p>
              <p className="text-sm text-text-secondary">
                {currentPlan.durationDays} days access
              </p>
            </div>
          ) : (
            <div className="bg-background/50 p-4 rounded-lg">
              <p className="text-text-secondary">
                This creator hasn't set up a subscription plan yet.
              </p>
            </div>
          )}

          {/* Subscription Status */}
          {subscription && (
            <div className="bg-background/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Your Subscription</h4>
              {subscription.isActive ? (
                <div>
                  <p className="text-green-400 font-medium">✅ Active</p>
                  <p className="text-sm text-text-secondary">
                    Expires: {new Date(subscription.expiresAt * 1000).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-red-400">❌ Expired or Not Subscribed</p>
              )}
            </div>
          )}

          {/* Subscribe Button */}
          {currentPlan && (!subscription || !subscription.isActive) && (
            <Button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              variant="primary"
              className="w-full"
            >
              {isSubscribing ? 'Subscribing...' : `Subscribe for ${currentPlan.priceEth} ETH`}
            </Button>
          )}

          {/* Renew Button */}
          {currentPlan && subscription && subscription.isActive && (
            <Button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              variant="secondary"
              className="w-full"
            >
              {isSubscribing ? 'Renewing...' : `Renew for ${currentPlan.priceEth} ETH`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;