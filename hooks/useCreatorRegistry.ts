import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContractManager } from './useContractManager';

interface CreatorProfile {
  handle: string;
  avatarURI: string;
  bio: string;
  kycVerified: boolean;
  isBanned: boolean;
  earned: string; // Representing uint256 as string for large numbers
  isCreator: boolean; // Derived property
}

export const useCreatorRegistry = () => {
  const contractManager = useContractManager();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const getCreatorProfile = useCallback(async (address: string, retry: number = 0) => {
    if (!contractManager) {
      console.error('Contract manager not available');
      setError('Please connect your wallet and ensure you\'re on Sepolia Testnet');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setRetryCount(retry);

    try {
      console.log('Getting creator profile for address:', address);
      console.log('Current chain ID:', contractManager.currentChainId);
      console.log('Contract manager available:', !!contractManager);
      
      const contract = contractManager.getContract('creatorRegistry', contractManager.currentChainId!);
      console.log('CreatorRegistry contract instance:', contract);
      console.log('Contract address:', contract?.target);
      
      if (!contract) {
        // Graceful fallback instead of throwing error
        console.warn(`CreatorRegistry contract not found on chain ${contractManager.currentChainId}`);
        const fallbackProfile: CreatorProfile = {
          handle: '',
          avatarURI: '',
          bio: 'Creator features coming soon. Please check back later.',
          kycVerified: false,
          isBanned: false,
          earned: '0',
          isCreator: false,
        };
        setCreatorProfile(fallbackProfile);
        setError('Creator features are currently unavailable. Please try again later.');
        setIsLoading(false);
        return fallbackProfile;
      }

      // Call the creators mapping from the contract
      const creator = await contract.creators(address);
      console.log('Raw creator data from contract:', creator);

      // Check if creator exists (handle is not empty)
      const isCreator = creator.handle && creator.handle.length > 0;
      
      const profile: CreatorProfile = {
        handle: creator.handle || '',
        avatarURI: creator.avatarURI || '',
        bio: creator.bio || '',
        kycVerified: creator.kycVerified || false,
        isBanned: creator.isBanned || false,
        earned: creator.earned ? creator.earned.toString() : '0',
        isCreator: isCreator,
      };

      console.log('Processed creator profile:', profile);
      setCreatorProfile(profile);
      return profile;

    } catch (error: any) {
      console.error('Error getting creator profile:', error);
      
      // If it's a CALL_EXCEPTION, it might mean the profile doesn't exist yet.
      // Return a default profile instead of throwing an error.
      if (error.code === 'CALL_EXCEPTION') {
        console.log('CALL_EXCEPTION caught, assuming creator profile does not exist.');
        const defaultProfile: CreatorProfile = {
          handle: '',
          avatarURI: '',
          bio: '',
          kycVerified: false,
          isBanned: false,
          earned: '0',
          isCreator: false,
        };
        setCreatorProfile(defaultProfile);
        setIsLoading(false); // Ensure loading state is reset
        return defaultProfile;
      }

      const errorMessage = error.message || 'Failed to get creator profile';
      setError(errorMessage);
      
      // Retry logic for network issues
      if (retry < 3 && (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT')) {
        console.log(`Retrying getCreatorProfile (attempt ${retry + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
        return getCreatorProfile(address, retry + 1);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [contractManager]);

  const registerCreator = useCallback(async (handle: string, avatarURI: string, bio: string) => {
    if (!contractManager) {
      throw new Error('Contract manager not available. Please connect your wallet.');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting creator registration:', { handle, avatarURI, bio });
      
      // Validate inputs
      if (!handle.trim()) {
        throw new Error('Handle cannot be empty');
      }
      if (handle.length < 3 || handle.length > 20) {
        throw new Error('Handle must be between 3-20 characters');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
        throw new Error('Handle can only contain letters, numbers, and underscores');
      }
      if (!avatarURI.trim()) {
        throw new Error('Avatar URL cannot be empty');
      }
      if (!bio.trim() || bio.length < 10) {
        throw new Error('Bio must be at least 10 characters');
      }

      // Execute the registration transaction
      const result = await contractManager.executeTransaction(
        'creatorRegistry',
        'register',
        [handle, avatarURI, bio]
      );

      console.log('Creator registration transaction sent:', result);
      return result;

    } catch (error: any) {
      console.error('Creator registration failed:', error);
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractManager]);

  const updateProfile = useCallback(async (avatarURI: string, bio: string) => {
    if (!contractManager) {
      throw new Error('Contract manager not available. Please connect your wallet.');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Updating creator profile:', { avatarURI, bio });
      
      // Validate inputs
      if (!avatarURI.trim()) {
        throw new Error('Avatar URL cannot be empty');
      }
      if (!bio.trim() || bio.length < 10) {
        throw new Error('Bio must be at least 10 characters');
      }

      // Execute the update transaction
      const result = await contractManager.executeTransaction(
        'creatorRegistry',
        'updateProfile',
        [avatarURI, bio]
      );

      console.log('Profile update transaction sent:', result);
      return result;

    } catch (error: any) {
      console.error('Profile update failed:', error);
      const errorMessage = error.message || 'Profile update failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractManager]);

  const refreshProfile = useCallback((address: string) => {
    return getCreatorProfile(address);
  }, [getCreatorProfile]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    creatorProfile,
    isLoading,
    error,
    retryCount,
    setError,
    clearError,
    getCreatorProfile,
    registerCreator,
    updateProfile,
    refreshProfile,
  };
};