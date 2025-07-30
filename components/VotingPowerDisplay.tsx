import React, { useState, useEffect } from 'react';
import { VotingPower } from '../types';
import { useWallet } from '../lib/WalletProvider';

interface VotingPowerDisplayProps {
  votingPower: VotingPower | null;
  isLoading: boolean;
}

export const VotingPowerDisplay: React.FC<VotingPowerDisplayProps> = ({
  votingPower,
  isLoading,
}) => {
  const { isConnected } = useWallet();
  const [showLoading, setShowLoading] = useState(isLoading);

  // Force stop loading after 3 seconds
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('VotingPowerDisplay: Forcing loading to stop');
        setShowLoading(false);
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      setShowLoading(false);
    }
  }, [isLoading]);

  if (!isConnected) {
    return (
      <div className="bg-card border border-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Voting Power</h3>
        <div className="text-center py-8">
          <div className="text-text-secondary mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-white font-medium">Connect your wallet to view voting power</p>
          <p className="text-sm text-text-secondary mt-2">
            You need LIB tokens to participate in governance
          </p>
        </div>
      </div>
    );
  }

  if (showLoading) {
    return (
      <div className="bg-card border border-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Voting Power</h3>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-600 rounded w-24"></div>
            <div className="h-6 bg-gray-600 rounded w-16"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-600 rounded w-32"></div>
            <div className="h-4 bg-gray-600 rounded w-28"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show default voting power display if no data is available
  const displayVotingPower = votingPower || {
    balance: '0',
    formattedBalance: '0.00',
    canCreateProposal: false,
    canVote: false,
  };

  const hasTokens = displayVotingPower.canVote;

  return (
    <div className={`border rounded-lg p-6 mb-6 ${hasTokens ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Voting Power</h3>
      
      {/* Token Balance Display */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600">LIB Token Balance</p>
          <p className="text-2xl font-bold text-white" aria-label={`${displayVotingPower.formattedBalance} LIB tokens`}>
            {displayVotingPower.formattedBalance} LIB
          </p>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            hasTokens ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {hasTokens ? (
              <>
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Active
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                No Tokens
              </>
            )}
          </div>
        </div>
      </div>

      {/* Eligibility Badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">Create Proposals</span>
            <div className="ml-2 group relative">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Requires 1,000+ LIB tokens
              </div>
            </div>
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            displayVotingPower.canCreateProposal 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {displayVotingPower.canCreateProposal ? (
              <>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Eligible
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
                Not Eligible
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">Vote on Proposals</span>
            <div className="ml-2 group relative">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Requires any amount of LIB tokens
              </div>
            </div>
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            displayVotingPower.canVote 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {displayVotingPower.canVote ? (
              <>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Eligible
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
                Not Eligible
              </>
            )}
          </div>
        </div>
      </div>

      {/* Explanatory Message for Users Without Tokens */}
      {!hasTokens && (
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Get LIB Tokens to Participate</h4>
              <p className="text-sm text-yellow-700 mt-1">
                You need LIB tokens to participate in governance. Earn tokens by creating content, 
                engaging with the community, or purchasing them on supported exchanges.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};