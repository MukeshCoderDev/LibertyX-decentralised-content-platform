import React, { useEffect, useContext } from 'react';
import { WalletContext } from '../lib/WalletProvider';
import { useLibertyDAO } from '../hooks/useLibertyDAO';

interface VotingPowerDisplayProps {
  className?: string;
}

export const VotingPowerDisplay: React.FC<VotingPowerDisplayProps> = ({ className = '' }) => {
  const walletContext = useContext(WalletContext);
  const { votingPower, getVotingPower, isLoading, error } = useLibertyDAO();

  useEffect(() => {
    if (walletContext?.account) {
      getVotingPower(walletContext.account);
    }
  }, [walletContext?.account, getVotingPower]);

  if (!walletContext?.isConnected) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-600">
          <p className="text-sm">Connect your wallet to view voting power</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 animate-pulse ${className}`}>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-600">
          <p className="text-sm font-medium">Error loading voting power</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!votingPower) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-600">
          <p className="text-sm">Unable to load voting power</p>
        </div>
      </div>
    );
  }

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toFixed(2);
    }
  };

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Your Voting Power</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-purple-600">
              {formatBalance(votingPower.formattedBalance)}
            </span>
            <span className="text-sm text-gray-500 font-medium">LIB</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex flex-col space-y-1">
            {votingPower.canCreateProposal ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Can Create Proposals
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Need 1,000 LIB to propose
              </span>
            )}
            {votingPower.canVote ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ✓ Can Vote
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Need LIB to vote
              </span>
            )}
          </div>
        </div>
      </div>
      
      {!votingPower.canVote && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          <p>You need LIB tokens to participate in governance. Purchase LIB tokens to vote on proposals.</p>
        </div>
      )}
    </div>
  );
};