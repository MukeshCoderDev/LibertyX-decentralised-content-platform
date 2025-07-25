import React, { useEffect, useContext, useState } from 'react';
import { WalletContext } from '../lib/WalletProvider';
import { useLibertyDAO, Proposal } from '../hooks/useLibertyDAO';

interface GovernanceProposalsProps {
  className?: string;
}

const ProposalCard: React.FC<{ 
  proposal: Proposal; 
  onVote: (proposalId: number, support: boolean) => void;
  onExecute: (proposalId: number) => void;
  canVote: boolean;
  isLoading: boolean;
}> = ({ proposal, onVote, onExecute, canVote, isLoading }) => {
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

  const formatVotes = (votes: string) => {
    const num = parseFloat(votes) / 1e18; // Convert from wei to LIB
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toFixed(2);
    }
  };

  const getTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Voting ended';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const totalVotes = parseFloat(proposal.votesFor) + parseFloat(proposal.votesAgainst);
  const forPercentage = totalVotes > 0 ? (parseFloat(proposal.votesFor) / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (parseFloat(proposal.votesAgainst) / totalVotes) * 100 : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-lg font-semibold text-gray-900">#{proposal.id}</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </span>
        </div>
        <div className="text-right text-sm text-gray-500">
          {proposal.status === 'active' ? getTimeRemaining(proposal.endTime) : 
           new Date(proposal.endTime * 1000).toLocaleDateString()}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed">{proposal.description}</p>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Voting Results</span>
          <span>{proposal.quorumReached ? '✓ Quorum reached' : '⚠ Quorum not reached'}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 font-medium">For</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${forPercentage}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-medium">{formatVotes(proposal.votesFor)} LIB</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-red-600 font-medium">Against</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${againstPercentage}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-medium">{formatVotes(proposal.votesAgainst)} LIB</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {proposal.status === 'active' && canVote && !proposal.hasVoted && (
          <div className="flex space-x-2">
            <button
              onClick={() => onVote(proposal.id, true)}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Vote For
            </button>
            <button
              onClick={() => onVote(proposal.id, false)}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Vote Against
            </button>
          </div>
        )}
        
        {proposal.status === 'ended' && proposal.passed && proposal.quorumReached && !proposal.executed && (
          <button
            onClick={() => onExecute(proposal.id)}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Execute Proposal
          </button>
        )}
        
        {proposal.hasVoted && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>✓ You voted</span>
            <span className={proposal.userVote ? 'text-green-600' : 'text-red-600'}>
              {proposal.userVote ? 'For' : 'Against'}
            </span>
          </div>
        )}
        
        {!canVote && proposal.status === 'active' && (
          <div className="text-sm text-gray-500">
            You need LIB tokens to vote
          </div>
        )}
      </div>
    </div>
  );
};

export const GovernanceProposals: React.FC<GovernanceProposalsProps> = ({ className = '' }) => {
  const walletContext = useContext(WalletContext);
  const { proposals, votingPower, getAllProposals, vote, executeProposal, isLoading, error } = useLibertyDAO();
  const [filter, setFilter] = useState<'all' | 'active' | 'ended' | 'executed'>('all');

  useEffect(() => {
    if (walletContext?.account) {
      getAllProposals(walletContext.account);
    }
  }, [walletContext?.account, getAllProposals]);

  const handleVote = async (proposalId: number, support: boolean) => {
    try {
      await vote(proposalId, support);
      // Refresh proposals after voting
      if (walletContext?.account) {
        getAllProposals(walletContext.account);
      }
    } catch (error) {
      console.error('Voting failed:', error);
    }
  };

  const handleExecute = async (proposalId: number) => {
    try {
      await executeProposal(proposalId);
      // Refresh proposals after execution
      if (walletContext?.account) {
        getAllProposals(walletContext.account);
      }
    } catch (error) {
      console.error('Execution failed:', error);
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true;
    return proposal.status === filter;
  });

  if (!walletContext?.isConnected) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <div className="text-gray-600">
          <h3 className="text-lg font-medium mb-2">Connect Wallet to View Proposals</h3>
          <p className="text-sm">Connect your wallet to participate in governance and view proposals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Governance Proposals</h2>
        <div className="flex space-x-2">
          {(['all', 'active', 'ended', 'executed'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === filterOption
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && proposals.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-6 bg-gray-300 rounded w-12"></div>
                  <div className="h-5 bg-gray-300 rounded w-20"></div>
                </div>
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600">
            <h3 className="text-lg font-medium mb-2">Error Loading Proposals</h3>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => walletContext?.account && getAllProposals(walletContext.account)}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-600">
            <h3 className="text-lg font-medium mb-2">
              {filter === 'all' ? 'No Proposals Yet' : `No ${filter} Proposals`}
            </h3>
            <p className="text-sm">
              {filter === 'all' 
                ? 'Be the first to create a governance proposal!' 
                : `There are no ${filter} proposals at the moment.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onVote={handleVote}
              onExecute={handleExecute}
              canVote={votingPower?.canVote || false}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};