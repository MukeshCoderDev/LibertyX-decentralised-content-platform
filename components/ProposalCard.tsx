import React, { useState } from 'react';
import { Proposal } from '../types';
import { formatTokenAmount, isProposalActive } from '../utils/governance';
import { useWallet } from '../lib/WalletProvider';

interface ProposalCardProps {
  proposal: Proposal;
  votingPower: { canVote: boolean } | null;
  isLoading: boolean;
  onVote: (proposalId: number, support: boolean) => Promise<boolean>;
  onExecute: (proposalId: number) => Promise<boolean>;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  votingPower,
  isLoading,
  onVote,
  onExecute,
}) => {
  const { isConnected } = useWallet();
  const [isVoting, setIsVoting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const totalVotes = BigInt(proposal.votesFor) + BigInt(proposal.votesAgainst);
  const forPercentage = totalVotes > 0 ? Number((BigInt(proposal.votesFor) * 100n) / totalVotes) : 0;
  const againstPercentage = totalVotes > 0 ? Number((BigInt(proposal.votesAgainst) * 100n) / totalVotes) : 0;

  const isActive = isProposalActive(proposal);
  const canVote = isConnected && votingPower?.canVote && isActive && !proposal.hasVoted;
  const canExecute = proposal.status === 'ended' && proposal.passed && proposal.quorumReached && !proposal.executed;

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-blue-100 text-blue-800';
      case 'executed':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'ended':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'executed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;

    if (timeLeft <= 0) {
      return 'Voting ended';
    }

    const days = Math.floor(timeLeft / (24 * 60 * 60));
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeLeft % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const handleVote = async (support: boolean) => {
    setIsVoting(true);
    try {
      await onVote(proposal.id, support);
    } finally {
      setIsVoting(false);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await onExecute(proposal.id);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <article 
      className="bg-card border border-gray-700 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background"
      role="article"
      aria-labelledby={`proposal-${proposal.id}-title`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 id={`proposal-${proposal.id}-title`} className="text-lg font-semibold text-white">
            Proposal #{proposal.id}
          </h3>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
            {getStatusIcon(proposal.status)}
            <span className="ml-1 capitalize">{proposal.status}</span>
          </div>
        </div>
        
        {/* Time Remaining or End Date */}
        <div className="text-sm text-text-secondary">
          <time dateTime={new Date(proposal.endTime * 1000).toISOString()}>
            {isActive ? formatTimeRemaining(proposal.endTime) : new Date(proposal.endTime * 1000).toLocaleDateString()}
          </time>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-text-secondary leading-relaxed break-words">{proposal.description}</p>
      </div>

      {/* Voting Results */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Voting Results</span>
          <span className="text-sm text-gray-500">
            Total: {formatTokenAmount(totalVotes.toString())} LIB
          </span>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          {/* For Votes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-green-700 font-medium">For</span>
              <span className="text-sm text-green-700">
                {formatTokenAmount(proposal.votesFor)} LIB ({forPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${forPercentage}%` }}
                aria-label={`${forPercentage}% votes in favor`}
              />
            </div>
          </div>

          {/* Against Votes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-red-700 font-medium">Against</span>
              <span className="text-sm text-red-700">
                {formatTokenAmount(proposal.votesAgainst)} LIB ({againstPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${againstPercentage}%` }}
                aria-label={`${againstPercentage}% votes against`}
              />
            </div>
          </div>
        </div>

        {/* Quorum Status */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <span className="text-gray-600">Quorum:</span>
            <div className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              proposal.quorumReached ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {proposal.quorumReached ? (
                <>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Reached
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Not Reached
                </>
              )}
            </div>
          </div>
          <span className="text-gray-500">Required: 500K LIB</span>
        </div>
      </div>

      {/* User's Vote Status */}
      {proposal.hasVoted && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-blue-800 font-medium">
              You voted {proposal.userVote ? 'For' : 'Against'} this proposal
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {canVote && (
          <>
            <button
              onClick={() => handleVote(true)}
              disabled={isVoting || isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              aria-label={`Vote in favor of proposal ${proposal.id}`}
            >
              {isVoting ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Vote For
                </>
              )}
            </button>
            
            <button
              onClick={() => handleVote(false)}
              disabled={isVoting || isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              aria-label={`Vote against proposal ${proposal.id}`}
            >
              {isVoting ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Vote Against
                </>
              )}
            </button>
          </>
        )}

        {canExecute && (
          <button
            onClick={handleExecute}
            disabled={isExecuting || isLoading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            aria-label={`Execute proposal ${proposal.id}`}
          >
            {isExecuting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Executing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1" />
                </svg>
                Execute Proposal
              </>
            )}
          </button>
        )}

        {!canVote && !canExecute && !proposal.hasVoted && isActive && (
          <div className="flex-1 bg-card text-text-secondary font-medium py-2 px-4 rounded-lg text-center border border-gray-600">
            {!isConnected ? 'Connect wallet to vote' : 'Need LIB tokens to vote'}
          </div>
        )}
      </div>
    </article>
  );
};