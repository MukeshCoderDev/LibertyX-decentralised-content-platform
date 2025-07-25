import React, { useState, useContext } from 'react';
import { WalletContext } from '../lib/WalletProvider';
import { useLibertyDAO } from '../hooks/useLibertyDAO';

interface ProposalCreationFormProps {
  onProposalCreated?: () => void;
  className?: string;
}

export const ProposalCreationForm: React.FC<ProposalCreationFormProps> = ({ 
  onProposalCreated, 
  className = '' 
}) => {
  const walletContext = useContext(WalletContext);
  const { votingPower, createProposal, isLoading, error } = useLibertyDAO();
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!description.trim()) {
      setValidationError('Proposal description is required');
      return;
    }

    if (description.length < 20) {
      setValidationError('Proposal description must be at least 20 characters');
      return;
    }

    if (description.length > 1000) {
      setValidationError('Proposal description must be less than 1000 characters');
      return;
    }

    try {
      await createProposal(description);
      setDescription('');
      setIsExpanded(false);
      onProposalCreated?.();
    } catch (error) {
      console.error('Failed to create proposal:', error);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setValidationError(null);
  };

  if (!walletContext?.isConnected) {
    return (
      <div className={`bg-gray-100 rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-600">
          <h3 className="text-lg font-medium mb-2">Connect Wallet to Create Proposals</h3>
          <p className="text-sm">Connect your wallet to participate in governance.</p>
        </div>
      </div>
    );
  }

  if (!votingPower?.canCreateProposal) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Insufficient LIB Tokens</h3>
          <p className="text-sm text-yellow-700 mb-3">
            You need at least 1,000 LIB tokens to create governance proposals.
          </p>
          <div className="text-sm text-yellow-600">
            <p>Current balance: <span className="font-medium">{votingPower?.formattedBalance || '0'} LIB</span></p>
            <p>Required: <span className="font-medium">1,000 LIB</span></p>
          </div>
        </div>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Proposal</h3>
          <p className="text-sm text-gray-600 mb-4">
            Submit a governance proposal for the community to vote on.
          </p>
          <button
            onClick={() => setIsExpanded(true)}
            className="px-6 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            Create Proposal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Create New Proposal</h3>
        <button
          onClick={() => {
            setIsExpanded(false);
            setDescription('');
            setValidationError(null);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Proposal Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Describe your proposal in detail. What changes do you want to make and why? Be specific and clear about the expected outcomes."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 resize-none"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-gray-500">
              Minimum 20 characters, maximum 1000 characters
            </div>
            <div className={`text-xs ${description.length > 1000 ? 'text-red-500' : 'text-gray-500'}`}>
              {description.length}/1000
            </div>
          </div>
        </div>

        {(validationError || error) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{validationError || error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Proposal Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Proposals require 1,000 LIB tokens to create</li>
              <li>Voting period lasts 7 days from creation</li>
              <li>Proposals need 500,000 LIB votes to reach quorum</li>
              <li>More "For" votes than "Against" votes are needed to pass</li>
              <li>Successful proposals can be executed by anyone</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Your voting power: <span className="font-medium">{votingPower?.formattedBalance} LIB</span>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setDescription('');
                setValidationError(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-md hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !description.trim() || description.length < 20 || description.length > 1000}
              className="px-6 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Proposal'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};