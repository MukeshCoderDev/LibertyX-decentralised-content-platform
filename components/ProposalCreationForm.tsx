import React, { useState } from 'react';
import { VotingPower, GOVERNANCE_CONSTANTS } from '../types';
import { useWallet } from '../lib/WalletProvider';

interface ProposalCreationFormProps {
  votingPower: VotingPower | null;
  isLoading: boolean;
  onCreateProposal: (description: string) => Promise<boolean>;
}

export const ProposalCreationForm: React.FC<ProposalCreationFormProps> = ({
  votingPower,
  isLoading,
  onCreateProposal,
}) => {
  const { isConnected } = useWallet();
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const canCreateProposal = isConnected && votingPower?.canCreateProposal;
  const characterCount = description.length;
  const isValidLength = characterCount >= GOVERNANCE_CONSTANTS.MIN_DESCRIPTION_LENGTH && 
                       characterCount <= GOVERNANCE_CONSTANTS.MAX_DESCRIPTION_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateProposal) {
      setValidationError('You need at least 1,000 LIB tokens to create a proposal');
      return;
    }

    if (!isValidLength) {
      setValidationError(`Description must be between ${GOVERNANCE_CONSTANTS.MIN_DESCRIPTION_LENGTH} and ${GOVERNANCE_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const success = await onCreateProposal(description.trim());
      if (success) {
        setDescription('');
        setIsExpanded(false);
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDescription('');
    setValidationError(null);
    setIsExpanded(false);
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Connect your wallet to create proposals</p>
          <p className="text-sm text-gray-500 mt-2">
            You need at least 1,000 LIB tokens to submit governance proposals
          </p>
        </div>
      </div>
    );
  }

  if (!canCreateProposal) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-yellow-600 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Insufficient Tokens for Proposal Creation</h3>
            <p className="text-yellow-700 mb-4">
              You need at least 1,000 LIB tokens to create governance proposals. 
              Current balance: {votingPower?.formattedBalance || '0'} LIB
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">How to earn LIB tokens:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Create and upload content to the platform</li>
                <li>• Engage with community content (likes, comments, shares)</li>
                <li>• Participate in platform activities and events</li>
                <li>• Purchase tokens on supported exchanges</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      {!isExpanded ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create Governance Proposal</h3>
            <div className="flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Eligible
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            Submit proposals for platform improvements, parameter changes, or new features. 
            All proposals require community voting to be implemented.
          </p>

          <button
            onClick={() => setIsExpanded(true)}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            aria-label="Open proposal creation form"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Proposal
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create Governance Proposal</h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Cancel proposal creation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Governance Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Proposal Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be clear and specific about what you're proposing</li>
              <li>• Explain the benefits and potential impact</li>
              <li>• Consider implementation feasibility</li>
              <li>• Proposals require 500,000 LIB votes to reach quorum</li>
              <li>• Voting period lasts 7 days from creation</li>
            </ul>
          </div>

          {/* Description Input */}
          <div className="mb-4">
            <label htmlFor="proposal-description" className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Description *
            </label>
            <textarea
              id="proposal-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setValidationError(null);
              }}
              placeholder="Describe your proposal in detail. What changes are you suggesting and why?"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                validationError ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={6}
              disabled={isSubmitting}
              aria-describedby="character-count proposal-help"
              required
            />
            
            {/* Character Count */}
            <div className="flex justify-between items-center mt-2">
              <div id="character-count" className={`text-sm ${
                characterCount < GOVERNANCE_CONSTANTS.MIN_DESCRIPTION_LENGTH 
                  ? 'text-red-600' 
                  : characterCount > GOVERNANCE_CONSTANTS.MAX_DESCRIPTION_LENGTH 
                    ? 'text-red-600' 
                    : 'text-gray-500'
              }`}>
                {characterCount} / {GOVERNANCE_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters
                {characterCount < GOVERNANCE_CONSTANTS.MIN_DESCRIPTION_LENGTH && (
                  <span className="ml-2">
                    (minimum {GOVERNANCE_CONSTANTS.MIN_DESCRIPTION_LENGTH} required)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{validationError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!isValidLength || isSubmitting || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Proposal...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Proposal
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>

          {/* Help Text */}
          <p id="proposal-help" className="text-xs text-gray-500 mt-3">
            By submitting this proposal, you agree that it will be publicly visible and subject to community voting. 
            Proposals cannot be edited or deleted once submitted.
          </p>
        </form>
      )}
    </div>
  );
};