import React, { useState, useMemo, useEffect } from 'react';
import { Proposal, VotingPower } from '../types';
import { ProposalCard } from './ProposalCard';

interface GovernanceProposalsProps {
  proposals: Proposal[];
  votingPower: VotingPower | null;
  isLoading: boolean;
  error: string | null;
  onVote: (proposalId: number, support: boolean) => Promise<boolean>;
  onExecute: (proposalId: number) => Promise<boolean>;
  onRetry: () => void;
}

type FilterType = 'all' | 'active' | 'ended' | 'executed';

export const GovernanceProposals: React.FC<GovernanceProposalsProps> = ({
  proposals,
  votingPower,
  isLoading,
  error,
  onVote,
  onExecute,
  onRetry,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showLoading, setShowLoading] = useState(isLoading);

  // Force stop loading after 3 seconds
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('GovernanceProposals: Forcing loading to stop');
        setShowLoading(false);
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      setShowLoading(false);
    }
  }, [isLoading]);

  // Filter proposals based on selected filter
  const filteredProposals = useMemo(() => {
    if (filter === 'all') return proposals;
    return proposals.filter(proposal => {
      switch (filter) {
        case 'active':
          return proposal.status === 'active';
        case 'ended':
          return proposal.status === 'ended';
        case 'executed':
          return proposal.status === 'executed';
        default:
          return true;
      }
    });
  }, [proposals, filter]);

  // Get filter counts
  const filterCounts = useMemo(() => {
    return {
      all: proposals.length,
      active: proposals.filter(p => p.status === 'active').length,
      ended: proposals.filter(p => p.status === 'ended').length,
      executed: proposals.filter(p => p.status === 'executed').length,
    };
  }, [proposals]);

  const FilterButton: React.FC<{ 
    filterType: FilterType; 
    label: string; 
    count: number; 
  }> = ({ filterType, label, count }) => (
    <button
      onClick={() => setFilter(filterType)}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
        filter === filterType
          ? 'bg-primary text-white shadow-sm'
          : 'bg-card text-text-secondary hover:bg-primary/10 hover:text-white'
      }`}
      aria-label={`Filter by ${label} proposals`}
    >
      {label} ({count})
    </button>
  );

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card border border-gray-700 rounded-lg p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-6 bg-gray-600 rounded w-24"></div>
              <div className="h-5 bg-gray-600 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-600 rounded w-20"></div>
          </div>
          <div className="mb-6">
            <div className="h-4 bg-gray-600 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-600 rounded w-32"></div>
            <div className="h-2 bg-gray-600 rounded w-full"></div>
            <div className="h-2 bg-gray-600 rounded w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="text-center py-12">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Proposals</h3>
      <p className="text-text-secondary mb-6 max-w-md mx-auto">
        {error || 'An error occurred while loading governance proposals. Please try again.'}
      </p>
      <button
        onClick={onRetry}
        className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center mx-auto"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry
      </button>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-text-secondary mb-4">
        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {filter === 'all' ? 'No Proposals Yet' : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Proposals`}
      </h3>
      <p className="text-text-secondary mb-6 max-w-md mx-auto">
        {filter === 'all' 
          ? 'Be the first to create a governance proposal and help shape the future of LibertyX.'
          : `There are currently no ${filter} proposals. Check back later or try a different filter.`
        }
      </p>
      {filter !== 'all' && (
        <button
          onClick={() => setFilter('all')}
          className="text-primary hover:text-primary-dark font-medium transition-colors duration-200"
        >
          View All Proposals
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Governance Proposals</h2>
          <p className="text-text-secondary">
            Vote on proposals that shape the future of the LibertyX platform
          </p>
        </div>
        
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          <FilterButton filterType="all" label="All" count={filterCounts.all} />
          <FilterButton filterType="active" label="Active" count={filterCounts.active} />
          <FilterButton filterType="ended" label="Ended" count={filterCounts.ended} />
          <FilterButton filterType="executed" label="Executed" count={filterCounts.executed} />
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {error ? (
          <ErrorState />
        ) : showLoading ? (
          <LoadingSkeleton />
        ) : filteredProposals.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* Results summary */}
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>
                Showing {filteredProposals.length} of {proposals.length} proposals
              </span>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-primary hover:text-primary-dark transition-colors duration-200"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Proposals grid */}
            <div className="grid gap-6">
              {filteredProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  votingPower={votingPower}
                  isLoading={isLoading}
                  onVote={onVote}
                  onExecute={onExecute}
                />
              ))}
            </div>

            {/* Load more button (for future pagination) */}
            {filteredProposals.length >= 10 && (
              <div className="text-center pt-6">
                <button
                  className="bg-card hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 border border-gray-600"
                  disabled
                >
                  Load More Proposals (Coming Soon)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="bg-card border border-gray-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-medium text-white mb-1">How Governance Works</h4>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Proposals require 1,000 LIB tokens to create</li>
              <li>• Voting is open to all LIB token holders</li>
              <li>• Proposals need 500,000 LIB votes to reach quorum</li>
              <li>• Voting period lasts 7 days from creation</li>
              <li>• Approved proposals can be executed by anyone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};