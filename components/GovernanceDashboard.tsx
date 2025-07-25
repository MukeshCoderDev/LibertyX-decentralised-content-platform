import React, { useEffect, useContext } from 'react';
import { WalletContext } from '../lib/WalletProvider';
import { VotingPowerDisplay } from './VotingPowerDisplay';
import { GovernanceProposals } from './GovernanceProposals';
import { ProposalCreationForm } from './ProposalCreationForm';
import { useLibertyDAO } from '../hooks/useLibertyDAO';

interface GovernanceDashboardProps {
  className?: string;
}

export const GovernanceDashboard: React.FC<GovernanceDashboardProps> = ({ className = '' }) => {
  const walletContext = useContext(WalletContext);
  const { getVotingPower, getAllProposals } = useLibertyDAO();

  useEffect(() => {
    if (walletContext?.account) {
      getVotingPower(walletContext.account);
      getAllProposals(walletContext.account);
    }
  }, [walletContext?.account, getVotingPower, getAllProposals]);

  const handleProposalCreated = () => {
    // Refresh proposals list when a new proposal is created
    if (walletContext?.account) {
      getAllProposals(walletContext.account);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LibertyX Governance</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Participate in the decentralized governance of LibertyX. Create proposals, vote on important decisions, 
          and help shape the future of the platform.
        </p>
      </div>

      {/* Voting Power Display */}
      <VotingPowerDisplay className="max-w-2xl mx-auto" />

      {/* Proposal Creation Form */}
      <ProposalCreationForm 
        onProposalCreated={handleProposalCreated}
        className="max-w-4xl mx-auto"
      />

      {/* Governance Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-3">How Governance Works</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Creating Proposals</h4>
            <ul className="space-y-1">
              <li>• Requires 1,000 LIB tokens minimum</li>
              <li>• Proposals are open for 7 days</li>
              <li>• Anyone can create proposals</li>
              <li>• Clear description required</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Voting Process</h4>
            <ul className="space-y-1">
              <li>• Voting power = LIB token balance</li>
              <li>• 500,000 LIB quorum required</li>
              <li>• Simple majority wins</li>
              <li>• One vote per address</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <GovernanceProposals />

      {/* Footer Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Need LIB Tokens?</h3>
        <p className="text-sm text-gray-600 mb-4">
          LIB tokens are required to participate in governance. You can earn them by creating content, 
          or purchase them on supported exchanges.
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>• Create content to earn LIB</span>
          <span>• Subscribe to creators</span>
          <span>• Participate in platform activities</span>
        </div>
      </div>
    </div>
  );
};