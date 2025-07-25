import { useState, useCallback, useEffect } from 'react';
import { useContractManager } from './useContractManager';
import { ethers } from 'ethers';

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

  const creatorRegistryContract = contractManager.contracts.creatorRegistry;

  const getCreatorProfile = useCallback(async (address: string, retry: number = 0) => {
    console.log('getCreatorProfile called for address:', address, 'retry attempt:', retry);
    if (!creatorRegistryContract) {
      setError('CreatorRegistry contract not initialized.');
      console.log('CreatorRegistry contract not initialized.');
      return null;
    }
    
    // Prevent multiple simultaneous calls
    if (isLoading && retry === 0) {
      console.log('Already loading, skipping duplicate call');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    setRetryCount(retry);
    try {
      // The public mapping 'creators' automatically generates a getter function
      // that returns (string handle, string avatarURI, string bio, bool kycVerified, bool isBanned, uint256 earned)
      const profile = await creatorRegistryContract.creators(address);
      console.log('Raw profile data from contract:', profile);
      // Check if the handle is empty to determine if the creator exists
      const isCreator = profile[0] !== ''; // handle is the first element

      setCreatorProfile({
        handle: profile[0],
        avatarURI: profile[1],
        bio: profile[2],
        kycVerified: profile[3],
        isBanned: profile[4],
        earned: ethers.formatEther(profile[5]), // Convert BigInt to string ETH
        isCreator: isCreator,
      });
      console.log('Creator profile set:', {
        handle: profile[0],
        avatarURI: profile[1],
        bio: profile[2],
        kycVerified: profile[3],
        isBanned: profile[4],
        earned: ethers.formatEther(profile[5]),
        isCreator: isCreator,
      });
      return profile;
    } catch (err: any) {
      console.error('Failed to fetch creator profile (catch block):', err);
      // Check for "execution reverted" error - this typically means creator doesn't exist
      if (err.code === 'CALL_EXCEPTION') {
        console.log('Caught CALL_EXCEPTION - likely unregistered creator.');
        // This means the address is not a registered creator, and the contract reverted
        // Treat this as "not a creator" rather than a hard error
        setCreatorProfile({
          handle: '',
          avatarURI: '',
          bio: '',
          kycVerified: false,
          isBanned: false,
          earned: '0',
          isCreator: false,
        });
        setError(null); // Clear error as it's expected behavior for unregistered creators
        return null;
      }
      // For network errors, try to retry up to 2 times
      if ((err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') && retry < 2) {
        console.log(`Network error, retrying... (attempt ${retry + 1})`);
        setTimeout(() => {
          getCreatorProfile(address, retry + 1);
        }, 1000 * (retry + 1)); // Exponential backoff
        return null;
      }
      
      setError(`Failed to fetch creator profile: ${err.message || err.reason || 'Unknown error'}`);
      return null;
    } finally {
      console.log('getCreatorProfile finally block: setting isLoading to false.');
      setIsLoading(false);
    }
  }, [creatorRegistryContract, contractManager]);

  const registerCreator = useCallback(async (handle: string, avatarURI: string, bio: string) => {
    if (!creatorRegistryContract) {
      setError('CreatorRegistry contract not initialized.');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const txResult = await contractManager.executeTransaction(
        'creatorRegistry',
        'register', // Use 'register' function name from contract
        [handle, avatarURI, bio]
      );
      console.log('Register Creator transaction sent:', txResult.hash);
      // Optionally, refetch profile after successful registration
      // await getCreatorProfile(contractManager.signer?.getAddress() || ''); // Assuming signer is available
      return txResult;
    } catch (err: any) {
      console.error('Failed to register creator:', err);
      setError(`Failed to register creator: ${err.message || err.reason || 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [creatorRegistryContract, contractManager]);

  const updateProfile = useCallback(async (avatarURI: string, bio: string) => {
    if (!creatorRegistryContract) {
      setError('CreatorRegistry contract not initialized.');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const txResult = await contractManager.executeTransaction(
        'creatorRegistry',
        'updateProfile',
        [avatarURI, bio]
      );
      console.log('Update Profile transaction sent:', txResult.hash);
      // Optionally, refetch profile after successful update
      // await getCreatorProfile(contractManager.signer?.getAddress() || '');
      return txResult;
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(`Failed to update profile: ${err.message || err.reason || 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [creatorRegistryContract, contractManager]);

  // Removed automatic profile fetching to prevent infinite loops
  // Profile fetching is now handled by the component explicitly

  const refreshProfile = useCallback((address: string) => {
    setRetryCount(0);
    return getCreatorProfile(address);
  }, [getCreatorProfile]);

  return {
    creatorProfile,
    isLoading,
    error,
    retryCount,
    setError, // Export setError
    getCreatorProfile,
    registerCreator,
    updateProfile,
    refreshProfile,
  };
};