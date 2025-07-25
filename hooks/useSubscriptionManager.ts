import { useState, useCallback } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from './useContractManager';
import { ethers } from 'ethers';

export interface SubscriptionPlan {
  priceWei: string;
  duration: number; // in seconds
  priceEth: string; // formatted price in ETH
  durationDays: number; // duration in days for display
  isActive: boolean;
}

export interface SubscriptionStatus {
  expiresAt: number;
  isActive: boolean;
  daysRemaining: number;
}

export interface UseSubscriptionManagerReturn {
  // Plan management (for creators)
  createPlan: (priceEth: string, durationDays: number) => Promise<string>;
  updatePlan: (priceEth: string, durationDays: number) => Promise<string>;
  getCreatorPlan: (creatorAddress: string) => Promise<SubscriptionPlan | null>;
  
  // Subscription management (for fans)
  subscribe: (creatorAddress: string) => Promise<string>;
  getSubscriptionStatus: (creatorAddress: string, fanAddress: string) => Promise<SubscriptionStatus | null>;
  checkAccess: (creatorAddress: string, fanAddress: string) => Promise<boolean>;
  
  // State
  isLoading: boolean;
  error: string | null;
}

export const useSubscriptionManager = (): UseSubscriptionManagerReturn => {
  const { account } = useWallet();
  const contractManager = useContractManager();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlan = useCallback(async (priceEth: string, durationDays: number): Promise<string> => {
    if (!contractManager || !account) {
      throw new Error('Wallet not connected or contract manager not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const priceWei = ethers.parseEther(priceEth);
      const durationSeconds = durationDays * 24 * 60 * 60;

      const result = await contractManager.executeTransaction(
        'subscriptionManager',
        'setPlan',
        [priceWei.toString(), durationSeconds]
      );

      return result.hash;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create subscription plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractManager, account]);

  const updatePlan = useCallback(async (priceEth: string, durationDays: number): Promise<string> => {
    // Same as createPlan since the contract uses the same method
    return createPlan(priceEth, durationDays);
  }, [createPlan]);

  const getCreatorPlan = useCallback(async (creatorAddress: string): Promise<SubscriptionPlan | null> => {
    if (!contractManager) {
      console.log('Contract manager not available for getCreatorPlan');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const subscriptionContract = contractManager.getContract('subscriptionManager', contractManager.currentChainId!);
      
      if (!subscriptionContract) {
        throw new Error('Subscription contract not available');
      }

      try {
        const plan = await subscriptionContract.plans(creatorAddress);
        
        if (!plan || !plan.priceWei || plan.priceWei.toString() === '0') {
          return null; // No plan set
        }

        return {
          priceWei: plan.priceWei.toString(),
          duration: Number(plan.duration),
          priceEth: ethers.formatEther(plan.priceWei),
          durationDays: Math.floor(Number(plan.duration) / (24 * 60 * 60)),
          isActive: true
        };
      } catch (planError: any) {
        console.log('No plan found for creator:', creatorAddress);
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get creator plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractManager]);

  const subscribe = useCallback(async (creatorAddress: string): Promise<string> => {
    if (!contractManager || !account) {
      throw new Error('Wallet not connected or contract manager not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      // First get the creator's plan to know the price
      const plan = await getCreatorPlan(creatorAddress);
      if (!plan) {
        throw new Error('Creator has no subscription plan');
      }

      const result = await contractManager.executeTransaction(
        'subscriptionManager',
        'subscribe',
        [creatorAddress],
        { value: plan.priceWei }
      );

      return result.hash;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to subscribe';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractManager, account, getCreatorPlan]);

  const getSubscriptionStatus = useCallback(async (
    creatorAddress: string, 
    fanAddress: string
  ): Promise<SubscriptionStatus | null> => {
    if (!contractManager) {
      console.log('Contract manager not available for getSubscriptionStatus');
      return {
        expiresAt: 0,
        isActive: false,
        daysRemaining: 0
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const subscriptionContract = contractManager.getContract('subscriptionManager', contractManager.currentChainId!);
      
      if (!subscriptionContract) {
        throw new Error('Subscription contract not available');
      }

      try {
        const sub = await subscriptionContract.subs(creatorAddress, fanAddress);
        const expiresAt = Number(sub.expiresAt);
        const currentTime = Math.floor(Date.now() / 1000);
        const isActive = expiresAt > currentTime;
        const daysRemaining = isActive ? Math.ceil((expiresAt - currentTime) / (24 * 60 * 60)) : 0;

        return {
          expiresAt,
          isActive,
          daysRemaining
        };
      } catch (subError: any) {
        console.log('No subscription found for user:', fanAddress);
        return {
          expiresAt: 0,
          isActive: false,
          daysRemaining: 0
        };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get subscription status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractManager]);

  const checkAccess = useCallback(async (creatorAddress: string, fanAddress: string): Promise<boolean> => {
    if (!contractManager) {
      console.log('Contract manager not available for checkAccess');
      return false;
    }

    try {
      const subscriptionContract = contractManager.getContract('subscriptionManager', contractManager.currentChainId!);
      
      if (!subscriptionContract) {
        console.log('Subscription contract not available');
        return false;
      }

      try {
        return await subscriptionContract.isSubscribed(creatorAddress, fanAddress);
      } catch (accessError: any) {
        console.log('Error checking subscription access, defaulting to false:', accessError);
        return false;
      }
    } catch (err: any) {
      console.error('Error checking subscription access:', err);
      return false;
    }
  }, [contractManager]);

  return {
    createPlan,
    updatePlan,
    getCreatorPlan,
    subscribe,
    getSubscriptionStatus,
    checkAccess,
    isLoading,
    error
  };
};