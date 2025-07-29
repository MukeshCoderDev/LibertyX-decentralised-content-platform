import React, { useEffect, useRef, useState } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useCreatorRegistry } from '../hooks/useCreatorRegistry';
import Button from './ui/Button';
import CreatorRegistrationForm from './CreatorRegistrationForm';
// Removed missing components that were causing crashes
// import CreatorSubscriptionPlans from './CreatorSubscriptionPlans';
// import CreatorNFTTiers from './CreatorNFTTiers';

interface CreatorProfileProps {
  creatorAddress?: string; // Optional: if viewing another creator's profile
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({ creatorAddress }) => {
  const { account, isConnected } = useWallet();
  const targetAddress = creatorAddress || account; // Use prop address or connected account
  const { creatorProfile, isLoading, error, retryCount, getCreatorProfile, refreshProfile } = useCreatorRegistry();
  const hasCalledRef = useRef<string | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  console.log('CreatorProfile render - isLoading:', isLoading, 'error:', error, 'creatorProfile:', creatorProfile);
  console.log('CreatorProfile render - creatorProfile.isCreator:', creatorProfile?.isCreator);

  useEffect(() => {
    console.log('CreatorProfile useEffect - targetAddress:', targetAddress, 'hasCalledRef.current:', hasCalledRef.current);
    if (targetAddress && hasCalledRef.current !== targetAddress && !isLoading) {
      hasCalledRef.current = targetAddress;
      console.log('CreatorProfile: Calling getCreatorProfile for new address');
      
      // Add error boundary around the async call
      try {
        getCreatorProfile(targetAddress).catch((err) => {
          console.error('Failed to get creator profile:', err);
          // Error is already handled in the hook, just log it here
        });
      } catch (err) {
        console.error('Synchronous error in getCreatorProfile:', err);
      }
    }
  }, [targetAddress, getCreatorProfile]);

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
    // Check if it's a contract-related error for better messaging
    const isContractError = error.includes('contract not found') || error.includes('CreatorRegistry');
    
    return (
      <div className="text-center py-10">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-yellow-600 mb-2">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-yellow-800 mb-2">
            {isContractError ? 'Creator Features Coming Soon' : 'Unable to Load Profile'}
          </p>
          <p className="text-sm text-yellow-700 mb-4">
            {isContractError 
              ? 'We\'re setting up creator features. Please check back later or try the development version.'
              : error
            }
          </p>
          
          {/* Helpful actions */}
          <div className="text-left mb-4 text-xs text-yellow-700 bg-yellow-100 p-3 rounded">
            <p className="font-semibold mb-2">What you can do:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Get test ETH from the faucet below</li>
              <li>Make sure you're on Sepolia Testnet</li>
              <li>Try refreshing the page</li>
              <li>Check back later for updates</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button 
                onClick={() => targetAddress && refreshProfile(targetAddress)} 
                className="bg-yellow-600 hover:bg-yellow-700 text-white flex-1"
              >
                Try Again {retryCount > 0 && `(${retryCount + 1})`}
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gray-600 hover:bg-gray-700 text-white flex-1"
              >
                Refresh Page
              </Button>
            </div>
            
            {/* Faucet button for testnet users */}
            <Button 
              onClick={() => window.open('https://sepoliafaucet.com', '_blank')} 
              className="bg-blue-500 hover:bg-blue-600 text-white w-full"
            >
              🚰 Get Test ETH (Sepolia Faucet)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check: if we don't have a profile yet and we're not loading or in error state
  if (!creatorProfile) {
    // If we haven't tried loading yet, show loading
    if (!error && hasCalledRef.current === null) {
      return (
        <div className="text-center py-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg text-gray-600">Initializing...</p>
          </div>
        </div>
      );
    }
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
    // Wait a bit for the transaction to be mined, then refresh the profile
    if (targetAddress) {
      setTimeout(() => {
        console.log('Refreshing profile after successful registration...');
        refreshProfile(targetAddress);
      }, 3000); // Wait 3 seconds for transaction to be mined
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
        <CreatorRegistrationForm
          onRegistrationSuccess={handleRegistrationSuccess}
          onClose={handleRegistrationCancel}
        />
      )}

      {/* Main Profile Content */}
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
        {/* Profile Header with Error Protection */}
        <div className="flex items-center space-x-6 mb-8">
          <img 
            src={creatorProfile?.avatarURI || '/default-avatar.png'} 
            alt={`${creatorProfile?.handle || 'Creator'}'s avatar`} 
            className="w-24 h-24 rounded-full object-cover border-4 border-primary"
            onError={(e) => {
              // Fallback to a default image if avatar fails to load
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM2MzY2ZjEiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI0IiB5PSI0Ij4KPHBhdGggZD0iTTIwIDIxdi0yYTQgNCAwIDAgMC00LTRIOGE0IDQgMCAwIDAtNCA0djIiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjwvc3ZnPgo=';
            }}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{creatorProfile?.handle || 'Unknown Creator'}</h1>
            <p className="text-gray-600">@{targetAddress?.substring(0, 6) || '0x0000'}...{targetAddress?.substring(targetAddress.length - 4) || '0000'}</p>
            <div className="flex items-center mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                creatorProfile?.kycVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                KYC Status: {creatorProfile?.kycVerified ? 'Verified' : 'Pending'}
              </span>
              {creatorProfile?.kycVerified && (
                <span className="ml-2 text-green-600">✅ Verified</span>
              )}
            </div>
          </div>
        </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">About Me</h2>
        <p className="text-gray-700">{creatorProfile?.bio || 'No bio available.'}</p>
      </div>

      {/* Subscription Plans - Placeholder */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Subscription Plans</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-2">Subscription plans coming soon!</p>
          <p className="text-sm text-gray-500">Creator can set up subscription tiers for exclusive content access.</p>
        </div>
      </div>

      {/* NFT Access Tiers - Placeholder */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">NFT Access Tiers</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-2">NFT access tiers coming soon!</p>
          <p className="text-sm text-gray-500">Creator can create NFT tiers for exclusive content access.</p>
        </div>
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