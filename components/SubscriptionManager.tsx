import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { ethers } from 'ethers';
import Button from './ui/Button';
import ErrorBoundary from './ErrorBoundary';
import { useFeedback } from './UserFeedback';
import ErrorHandler from '../lib/errorHandling';

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
  const { showSuccess, showError, showWarning } = useFeedback();
  
  // State for creator plan management
  const [planPrice, setPlanPrice] = useState<string>('0.01');
  const [planDuration, setPlanDuration] = useState<number>(30);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [planValidation, setPlanValidation] = useState<{
    priceValid: boolean;
    durationValid: boolean;
    priceError?: string;
    durationError?: string;
  }>({
    priceValid: true,
    durationValid: true
  });
  
  // State for fan subscription
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStats, setSubscriptionStats] = useState<{
    daysRemaining: number;
    isExpiringSoon: boolean;
    canRenew: boolean;
  } | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [contractAvailable, setContractAvailable] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading subscription data...');

  const targetCreator = creatorAddress || account;

  // Validate subscription plan inputs
  const validatePlanInputs = useCallback(() => {
    const validation = {
      priceValid: true,
      durationValid: true,
      priceError: undefined as string | undefined,
      durationError: undefined as string | undefined
    };

    // Validate price
    const price = parseFloat(planPrice);
    if (isNaN(price) || price <= 0) {
      validation.priceValid = false;
      validation.priceError = 'Price must be a positive number';
    } else if (price < 0.001) {
      validation.priceValid = false;
      validation.priceError = 'Minimum price is 0.001 ETH';
    } else if (price > 10) {
      validation.priceValid = false;
      validation.priceError = 'Maximum price is 10 ETH';
    }

    // Validate duration
    if (planDuration < 1) {
      validation.durationValid = false;
      validation.durationError = 'Duration must be at least 1 day';
    } else if (planDuration > 365) {
      validation.durationValid = false;
      validation.durationError = 'Maximum duration is 365 days';
    }

    setPlanValidation(validation);
    return validation.priceValid && validation.durationValid;
  }, [planPrice, planDuration]);

  // Validate inputs when they change
  useEffect(() => {
    validatePlanInputs();
  }, [validatePlanInputs]);

  // Check contract availability
  const checkContractAvailability = useCallback(async () => {
    if (!contractManager) return false;

    try {
      const isAvailable = await contractManager.isContractAvailable('subscriptionManager');
      setContractAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('Error checking contract availability:', error);
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

  // Load current plan or subscription status
  const loadData = useCallback(async () => {
    if (!contractManager || !targetCreator) return;

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Checking contract availability...');
    
    try {
      // First check if contract is available
      const isAvailable = await checkContractAvailability();
      
      if (!isAvailable) {
        setError('Subscription contract is not deployed or not responding. Please check your network connection or try again later.');
        return;
      }

      setLoadingMessage('Loading subscription data...');

      await retryOperation(async () => {
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
            const currentTime = Math.floor(Date.now() / 1000);
            const isActive = expiresAt > currentTime;
            
            setSubscription({
              expiresAt,
              isActive
            });

            // Calculate subscription stats
            if (isActive) {
              const daysRemaining = Math.ceil((expiresAt - currentTime) / (24 * 60 * 60));
              setSubscriptionStats({
                daysRemaining,
                isExpiringSoon: daysRemaining <= 7,
                canRenew: true
              });
            } else {
              setSubscriptionStats({
                daysRemaining: 0,
                isExpiringSoon: false,
                canRenew: true
              });
            }
          } catch (subError: any) {
            console.log('No subscription found for user (this is normal)');
            setSubscription({
              expiresAt: 0,
              isActive: false
            });
            setSubscriptionStats({
              daysRemaining: 0,
              isExpiringSoon: false,
              canRenew: true
            });
          }
        }
      });

    } catch (err: any) {
      ErrorHandler.logError(err, 'SubscriptionManager.loadData', { targetCreator, mode });
      const errorDetails = ErrorHandler.parseError(err);
      setError(errorDetails.userFriendly);
      
      if (errorDetails.type === 'network') {
        showWarning('Network Issue', 'Having trouble connecting to the blockchain. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('Loading subscription data...');
    }
  }, [contractManager, targetCreator, account, mode, checkContractAvailability, retryOperation]);

  // Load data on component mount and dependency changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create or update subscription plan (creator mode)
  const handleSetPlan = async () => {
    if (!contractManager || !account) {
      setError('Please connect your wallet');
      return;
    }

    // Check contract availability first
    const isAvailable = await checkContractAvailability();
    if (!isAvailable) {
      setError('Subscription contract is not available. Please check your network connection.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setLoadingMessage('Setting subscription plan...');

    try {
      await ErrorHandler.withRetry(async () => {
        const priceWei = ethers.parseEther(planPrice);
        const durationSeconds = planDuration * 24 * 60 * 60; // convert days to seconds

        const result = await contractManager.executeTransaction(
          'subscriptionManager',
          'setPlan',
          [priceWei.toString(), durationSeconds]
        );

        showSuccess(
          'Subscription Plan Created!',
          `Your subscription plan has been set successfully.`,
          result.hash
        );
        
        // Update current plan display
        setCurrentPlan({
          priceWei: priceWei.toString(),
          duration: durationSeconds,
          priceEth: planPrice,
          durationDays: planDuration
        });
      });

    } catch (err: any) {
      ErrorHandler.logError(err, 'SubscriptionManager.handleSetPlan', { planPrice, planDuration });
      const errorDetails = ErrorHandler.parseError(err);
      
      setError(errorDetails.userFriendly);
      
      showError(
        'Failed to Set Plan',
        errorDetails.userFriendly,
        errorDetails.retryable ? [{
          label: 'Try Again',
          onClick: handleSetPlan,
          variant: 'primary' as const
        }] : undefined
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage('Loading subscription data...');
    }
  };

  // Subscribe to creator (fan mode)
  const handleSubscribe = async () => {
    if (!contractManager || !account || !currentPlan) {
      setError('Missing required data for subscription');
      return;
    }

    // Check contract availability first
    const isAvailable = await checkContractAvailability();
    if (!isAvailable) {
      setError('Subscription contract is not available. Please check your network connection.');
      return;
    }

    setIsSubscribing(true);
    setError(null);
    setSuccess(null);

    try {
      await ErrorHandler.withRetry(async () => {
        const result = await contractManager.executeTransaction(
          'subscriptionManager',
          'subscribe',
          [targetCreator],
          { value: currentPlan.priceWei }
        );

        showSuccess(
          'Subscription Successful!',
          `You are now subscribed to ${creatorAddress ? 'this creator' : 'your own plan'}.`,
          result.hash
        );
        
        // Update subscription status
        const newExpiresAt = Math.floor(Date.now() / 1000) + currentPlan.duration;
        setSubscription({
          expiresAt: newExpiresAt,
          isActive: true
        });

        // Update subscription stats
        const daysRemaining = Math.ceil(currentPlan.duration / (24 * 60 * 60));
        setSubscriptionStats({
          daysRemaining,
          isExpiringSoon: daysRemaining <= 7,
          canRenew: true
        });
      });

    } catch (err: any) {
      ErrorHandler.logError(err, 'SubscriptionManager.handleSubscribe', { targetCreator, currentPlan });
      const errorDetails = ErrorHandler.parseError(err);
      
      setError(errorDetails.userFriendly);
      
      showError(
        'Subscription Failed',
        errorDetails.userFriendly,
        errorDetails.retryable ? [{
          label: 'Try Again',
          onClick: handleSubscribe,
          variant: 'primary' as const
        }] : undefined
      );
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

  return (
    <ErrorBoundary>
      <div className="bg-card p-6 rounded-2xl">
      <h3 className="text-xl font-satoshi font-bold mb-6">
        {mode === 'creator' ? 'Subscription Plan Management' : 'Creator Subscription'}
      </h3>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
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
              onClick={loadData}
              variant="secondary"
              size="sm"
              className="ml-4 text-xs"
            >
              Retry
            </Button>
          </div>
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
            <div className="bg-background/50 p-4 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Current Plan</h4>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-primary">
                  {currentPlan.priceEth} ETH
                </p>
                <p className="text-sm text-text-secondary">
                  {currentPlan.durationDays} days access
                </p>
                <p className="text-xs text-text-secondary">
                  Created: {new Date().toLocaleDateString()}
                </p>
              </div>
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
                min="0.001"
                max="10"
                value={planPrice}
                onChange={(e) => setPlanPrice(e.target.value)}
                className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 ${
                  planValidation.priceValid 
                    ? 'border-border focus:ring-primary' 
                    : 'border-red-500 focus:ring-red-500'
                }`}
                placeholder="0.01"
              />
              {!planValidation.priceValid && planValidation.priceError && (
                <p className="text-red-400 text-xs mt-1">{planValidation.priceError}</p>
              )}
              <p className="text-xs text-text-secondary mt-1">
                Recommended: 0.01 - 0.1 ETH for accessibility
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Duration (Days)
              </label>
              <select
                value={planDuration}
                onChange={(e) => setPlanDuration(Number(e.target.value))}
                className={`w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 ${
                  planValidation.durationValid 
                    ? 'border-border focus:ring-primary' 
                    : 'border-red-500 focus:ring-red-500'
                }`}
              >
                <option value={7}>7 days (Weekly)</option>
                <option value={30}>30 days (Monthly)</option>
                <option value={90}>90 days (Quarterly)</option>
                <option value={365}>365 days (Yearly)</option>
              </select>
              {!planValidation.durationValid && planValidation.durationError && (
                <p className="text-red-400 text-xs mt-1">{planValidation.durationError}</p>
              )}
              <p className="text-xs text-text-secondary mt-1">
                Monthly plans are most popular with subscribers
              </p>
            </div>

            <Button
              onClick={handleSetPlan}
              disabled={isLoading || !planValidation.priceValid || !planValidation.durationValid}
              variant="primary"
              className="w-full"
            >
              {isLoading ? 'Setting Plan...' : currentPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
            
            {currentPlan && (
              <div className="text-xs text-text-secondary text-center mt-2">
                <p>💡 Tip: Updating your plan will affect new subscribers only.</p>
                <p>Existing subscribers keep their current terms.</p>
              </div>
            )}
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
          {subscription && subscriptionStats && (
            <div className={`bg-background/50 p-4 rounded-lg border ${
              subscription.isActive 
                ? subscriptionStats.isExpiringSoon 
                  ? 'border-yellow-500/20' 
                  : 'border-green-500/20'
                : 'border-red-500/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Your Subscription</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  subscription.isActive 
                    ? subscriptionStats.isExpiringSoon
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {subscription.isActive 
                    ? subscriptionStats.isExpiringSoon 
                      ? 'Expiring Soon' 
                      : 'Active'
                    : 'Expired'
                  }
                </span>
              </div>
              
              {subscription.isActive ? (
                <div className="space-y-1">
                  <p className="text-green-400 font-medium">✅ Active Subscription</p>
                  <p className="text-sm text-text-secondary">
                    Expires: {new Date(subscription.expiresAt * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {subscriptionStats.daysRemaining} days remaining
                  </p>
                  {subscriptionStats.isExpiringSoon && (
                    <p className="text-yellow-400 text-sm">
                      ⚠️ Your subscription expires in {subscriptionStats.daysRemaining} days
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-red-400">❌ Expired or Not Subscribed</p>
                  {subscription.expiresAt > 0 && (
                    <p className="text-sm text-text-secondary">
                      Last expired: {new Date(subscription.expiresAt * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
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
    </ErrorBoundary>
  );
};

export default SubscriptionManager;