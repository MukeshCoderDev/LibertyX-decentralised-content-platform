import React, { useCallback } from 'react';
import { useLibertyDAO } from '../hooks/useLibertyDAO';
import { useWallet } from '../lib/WalletProvider';
import { VotingPowerDisplay } from './VotingPowerDisplay';
import { ProposalCreationForm } from './ProposalCreationForm';
import { GovernanceProposals } from './GovernanceProposals';
import { GovernanceErrorBoundary } from './GovernanceErrorBoundary';
import { useGovernanceNotifications } from './GovernanceNotification';
import { SkipLink } from './SkipLink';

export const GovernanceDashboard: React.FC = () => {
  const { isConnected } = useWallet();
  const {
    proposals,
    votingPower,
    isLoading,
    error,
    createProposal,
    vote,
    executeProposal,
    refresh,
    clearError,
  } = useLibertyDAO();
  
  const { showSuccess, showError, showWarning: _showWarning, NotificationContainer } = useGovernanceNotifications();

  // Handle proposal creation with refresh
  const handleCreateProposal = useCallback(async (description: string): Promise<boolean> => {
    try {
      const success = await createProposal(description);
      if (success) {
        showSuccess(
          'Proposal Created Successfully!',
          'Your governance proposal has been submitted and is now open for voting.'
        );
        // Refresh is handled automatically by the hook's event listeners
        setTimeout(() => refresh(), 1000);
      }
      return success;
    } catch (error: any) {
      showError(
        'Failed to Create Proposal',
        error.message || 'An unexpected error occurred while creating the proposal.'
      );
      return false;
    }
  }, [createProposal, refresh, showSuccess, showError]);

  // Handle voting with automatic refresh
  const handleVote = useCallback(async (proposalId: number, support: boolean): Promise<boolean> => {
    try {
      const success = await vote(proposalId, support);
      if (success) {
        showSuccess(
          'Vote Cast Successfully!',
          `Your vote ${support ? 'in favor of' : 'against'} proposal #${proposalId} has been recorded.`
        );
      }
      return success;
    } catch (error: any) {
      showError(
        'Failed to Cast Vote',
        error.message || 'An unexpected error occurred while casting your vote.'
      );
      return false;
    }
  }, [vote, showSuccess, showError]);

  // Handle proposal execution
  const handleExecute = useCallback(async (proposalId: number): Promise<boolean> => {
    try {
      const success = await executeProposal(proposalId);
      if (success) {
        showSuccess(
          'Proposal Executed Successfully!',
          `Proposal #${proposalId} has been executed and the changes are now in effect.`
        );
      }
      return success;
    } catch (error: any) {
      showError(
        'Failed to Execute Proposal',
        error.message || 'An unexpected error occurred while executing the proposal.'
      );
      return false;
    }
  }, [executeProposal, showSuccess, showError]);

  // Handle retry for error states
  const handleRetry = useCallback(() => {
    clearError();
    refresh();
  }, [clearError, refresh]);

  return (
    <GovernanceErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Skip Links for Accessibility */}
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#voting-power">Skip to voting power</SkipLink>
        <SkipLink href="#proposals">Skip to proposals</SkipLink>
        
        <NotificationContainer />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              LibertyX Governance
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto">
              Shape the future of decentralized content creation. Participate in governance by creating proposals, 
              voting on platform decisions, and helping build a community-driven ecosystem.
            </p>
          </header>

          {/* How it Works Section */}
          <div className="bg-card border border-gray-700 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">How Governance Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Create Proposals</h3>
                <p className="text-text-secondary text-sm">
                  Hold 1,000+ LIB tokens to submit governance proposals for platform improvements, 
                  parameter changes, or new features.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Vote on Proposals</h3>
                <p className="text-text-secondary text-sm">
                  Any LIB token holder can vote on active proposals. Your voting power is proportional 
                  to your token holdings.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Execute Decisions</h3>
                <p className="text-text-secondary text-sm">
                  Approved proposals that reach quorum (500K LIB votes) can be executed by anyone 
                  to implement the changes.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main id="main-content" className="space-y-8">
            {/* Voting Power Display */}
            <section id="voting-power" aria-labelledby="voting-power-heading">
              <h2 id="voting-power-heading" className="sr-only">Your Voting Power</h2>
              <VotingPowerDisplay 
                votingPower={votingPower} 
                isLoading={isLoading} 
              />
            </section>

            {/* Proposal Creation Form */}
            {isConnected && (
              <section aria-labelledby="create-proposal-heading">
                <h2 id="create-proposal-heading" className="sr-only">Create New Proposal</h2>
                <ProposalCreationForm
                  votingPower={votingPower}
                  isLoading={isLoading}
                  onCreateProposal={handleCreateProposal}
                />
              </section>
            )}

            {/* Proposals List */}
            <section id="proposals" aria-labelledby="proposals-heading">
              <h2 id="proposals-heading" className="sr-only">Governance Proposals</h2>
              <GovernanceProposals
                proposals={proposals}
                votingPower={votingPower}
                isLoading={isLoading}
                error={error}
                onVote={handleVote}
                onExecute={handleExecute}
                onRetry={handleRetry}
              />
            </section>
          </main>

          {/* Footer Information */}
          <footer className="mt-16 border-t border-gray-700 pt-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Earn LIB Tokens</h3>
                <div className="space-y-3 text-text-secondary">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Create and upload high-quality content</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Engage with the community (likes, comments, shares)</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Participate in platform activities and events</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Purchase tokens on supported exchanges</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Governance Guidelines</h3>
                <div className="space-y-3 text-text-secondary">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Be respectful and constructive in proposals</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Provide clear rationale and expected benefits</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Consider implementation feasibility</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Vote responsibly based on community benefit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Information */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <div className="text-center">
                <h4 className="text-sm font-medium text-text-secondary mb-2">Smart Contracts (Sepolia Testnet)</h4>
                <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-8 space-y-2 sm:space-y-0 text-xs text-text-secondary">
                  <div>
                    <span className="font-medium">LibertyToken:</span>{' '}
                    <code className="bg-card px-2 py-1 rounded">0x12bdF4aEB6F85bEc7c55de6c418f5d88e9203319</code>
                  </div>
                  <div>
                    <span className="font-medium">LibertyDAO:</span>{' '}
                    <code className="bg-card px-2 py-1 rounded">0x1e1e418F9a1eE0e887Bd6Ba8CbeCD07C6B1e1FcA</code>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </GovernanceErrorBoundary>
  );
};