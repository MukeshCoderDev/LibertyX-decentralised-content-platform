import { ethers } from 'ethers';
import { Proposal, GovernanceError, GovernanceErrorType } from '../types';

// Utility function for error handling
export const createGovernanceError = (
  type: GovernanceErrorType,
  message: string,
  details?: any
): GovernanceError => ({
  code: type,
  message,
  details,
});

// Utility function to get user-friendly error messages
export const getErrorMessage = (error: any): string => {
  if (error.code === 'ACTION_REJECTED') {
    return 'Transaction was cancelled by user';
  }
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient funds for gas fees';
  }
  if (error.reason) {
    return error.reason;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Utility function to format token amounts
export const formatTokenAmount = (amount: string): string => {
  const formatted = ethers.formatEther(amount);
  const num = parseFloat(formatted);
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(2);
};

// Utility function to check if proposal is active
export const isProposalActive = (proposal: Proposal): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return now < proposal.endTime && !proposal.executed;
};

// Utility function to calculate proposal status
export const calculateProposalStatus = (proposal: Proposal): Proposal['status'] => {
  const now = Math.floor(Date.now() / 1000);
  
  if (proposal.executed) {
    return 'executed';
  }
  
  if (now >= proposal.endTime) {
    const totalVotes = ethers.parseEther(proposal.votesFor) + ethers.parseEther(proposal.votesAgainst);
    const quorumReached = totalVotes >= ethers.parseEther('500000');
    const passed = ethers.parseEther(proposal.votesFor) > ethers.parseEther(proposal.votesAgainst);
    
    if (quorumReached && passed) {
      return 'ended';
    } else {
      return 'failed';
    }
  }
  
  return 'active';
};

// Utility function to check if quorum is reached
export const isQuorumReached = (votesFor: string, votesAgainst: string): boolean => {
  const totalVotes = ethers.parseEther(votesFor) + ethers.parseEther(votesAgainst);
  return totalVotes >= ethers.parseEther('500000');
};

// Utility function to check if proposal passed
export const isProposalPassed = (votesFor: string, votesAgainst: string): boolean => {
  return ethers.parseEther(votesFor) > ethers.parseEther(votesAgainst);
};