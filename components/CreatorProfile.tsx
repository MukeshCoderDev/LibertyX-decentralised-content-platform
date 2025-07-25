import React, { useEffect, useRef, useState } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useCreatorRegistry } from '../hooks/useCreatorRegistry';
import Button from './ui/Button';
import CreatorRegistrationForm from './CreatorRegistrationForm';
import SimpleRegistrationForm from './SimpleRegistrationForm';
import CreatorSubscriptionPlans from './CreatorSubscriptionPlans';
import CreatorNFTTiers from './CreatorNFTTiers';

interface CreatorProfileProps {
  creatorAddress?: string; // Optional: if viewing another creator's profile
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({ creatorAddress }) => {
  const { account, isConnected } = useWallet();
  const targetAddress = creatorAddress || account; // Use prop address or connected account
  const { creatorProfile, isLoading, error, getCreatorProfile, refreshProfile } = useCreatorRegistry();
  const hasCalledRef = useRef<string | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  console.log('CreatorProfile render - isLoading:', isLoading, 'error:', error, 'creatorProfile:', creatorProfile);
  console.log('CreatorProfile render - creatorProfile.isCreator:', creatorProfile?.isCreator);

  useEffect(() => {
    console.log('CreatorProfile useEffect - targetAddress:', targetAddress, 'hasCalledRef.current:', hasCalledRef.current);
    if (targetAddress && hasCalledRef.current !== targetAddress && !isLoading) {
      hasCalledRef.current = targetAddress;
      console.log('CreatorProfile: Calling getCreatorProfile for new address');
      getCreatorProfile(targetAddress);
    }
  }, [targetAddress]);

  if (!isConnected && !creatorAddress) {
    console.log('CreatorProfile: Not connected and no creatorAddress prop.');
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-600">Please connect your wallet to view your creator profile.</p>
        {/* Optionally add a connect wallet button here */}
      </div>
    );
  }

  if (isLoading) {
    console.log('CreatorProfile: Displaying loading state.');
    return (
      <div className="text-center py-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-lg text-gray-600">Loading creator profile...</p>
          <p className="text-sm text-gray-500">
            {targetAddress ? `Checking ${targetAddress.substring(0, 6)}...${targetAddress.substring(targetAddress.length - 4)}` : 'Connecting...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 mb-2">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-red-800 mb-2">Unable to Load Profile</p>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button 
            onClick={() => targetAddress && refreshProfile(targetAddress)} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!creatorProfile || !creatorProfile.isCreator) {
    const isOwnProfile = account && targetAddress === account;
    
    return (
      <div className="text-center py-10">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-md mx-auto">
          <div className="text-blue-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-blue-800 mb-2">
            {isOwnProfile ? "You're Not a Creator Yet" : "Creator Not Found"}
          </h2>
          <p className="text-blue-600 mb-6">
            {isOwnProfile 
              ? "Join thousands of creators earning cryptocurrency for their content!" 
              : "This address is not registered as a creator on the platform."
            }
          </p>
          {isOwnProfile && (
            <div className="space-y-3">
              <Button 
                onClick={() => setShowRegistrationForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                Register as Creator
              </Button>
              <p className="text-xs text-blue-500">
                Start earning LIB tokens for your content today!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle successful registration
  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false);
    // Refresh the profile to show the updated creator status
    if (targetAddress) {
      refreshProfile(targetAddress);
    }
  };

  // Handle registration cancel
  const handleRegistrationCancel = () => {
    setShowRegistrationForm(false);
  };

  return (
    <>
      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <SimpleRegistrationForm
          onClose={handleRegistrationCancel}
        />
      )}

      {/* Main Profile Content */}
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-6 mb-8">
        <img 
          src={creatorProfile.avatarURI} 
          alt={`${creatorProfile.handle}'s avatar`} 
          className="w-24 h-24 rounded-full object-cover border-4 border-primary"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{creatorProfile.handle}</h1>
          <p className="text-gray-600">@{targetAddress?.substring(0, 6)}...{targetAddress?.substring(targetAddress.length - 4)}</p>
          <div className="flex items-center mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              creatorProfile.kycVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              KYC Status: {creatorProfile.kycVerified ? 'Verified' : 'Pending'}
            </span>
            {creatorProfile.kycVerified && (
              <span className="ml-2 text-green-600">✅ Verified</span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">About Me</h2>
        <p className="text-gray-700">{creatorProfile.bio}</p>
      </div>

      {/* Subscription Plans */}
      <div className="mb-8">
        <CreatorSubscriptionPlans
          creatorAddress={targetAddress!}
          creatorName={creatorProfile.handle}
          creatorAvatar={creatorProfile.avatarURI}
          isOwnProfile={account === targetAddress}
        />
      </div>

      {/* NFT Access Tiers */}
      <div className="mb-8">
        <CreatorNFTTiers
          creatorAddress={targetAddress!}
          creatorName={creatorProfile.handle}
        />
      </div>

      {/* Placeholder for Earnings and other analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Earnings (Placeholder)</h3>
          <p className="text-gray-700">Total: 0 LIB</p>
          <p className="text-gray-700">Available: 0 LIB</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Content Statistics (Placeholder)</h3>
          <p className="text-gray-700">Total Content: 0</p>
          <p className="text-gray-700">Followers: 0</p>
        </div>
      </div>

      {/* Edit Profile Button (only for the connected user's profile) */}
      {account && targetAddress === account && (
        <div className="mt-8 text-right">
          <Button onClick={() => console.log('Open edit profile modal')}>
            Edit Profile
          </Button>
        </div>
      )}
      </div>
    </>
  );
};

export default CreatorProfile;