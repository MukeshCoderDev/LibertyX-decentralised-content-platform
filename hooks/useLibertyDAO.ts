import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContractManager } from './useContractManager';

export interface Proposal {
  id: number;
  description: string;
  votesFor: string;
  votesAgainst: string;
  endTime: number;
  executed: boolean;
  hasVoted?: boolean;
  userVote?: boolean;
  status: 'active' | 'ended' | 'executed' | 'failed';
  quorumReached: boolean;
  passed: boolean;
}

export interface VotingPower {
  balance: string;
  formattedBalance: string;
  canCreateProposal: boolean;
  canVote: boolean;
}

export const useLibertyDAO = () => {
  const contractManager = useContractManager();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votingPower, setVotingPower] = useState<VotingPower | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const QUORUM = ethers.parseEther('500000'); // 500k LIB
  const MIN_PROPOSAL_TOKENS = ethers.parseEther('1000'); // 1000 LIB

  const getVotingPower = useCallback(async (userAddress: string) => {
    if (!contractManager || !userAddress) {
      return null;
    }

    try {
      const libertyTokenContract = contractManager.getContract('libertyToken', contractManager.currentChainId!);
      if (!libertyTokenContract) {
        throw new Error('LibertyToken contract not found');
      }

      const balance = await libertyTokenContract.balanceOf(userAddress);
      const formattedBalance = ethers.formatEther(balance);

      const votingPowerData: VotingPower = {
        balance: balance.toString(),
        formattedBalance,
        canCreateProposal: balance >= MIN_PROPOSAL_TOKENS,
        canVote: balance > 0,
      };

      setVotingPower(votingPowerData);
      return votingPowerData;
    } catch (error: any) {
      console.error('Error getting voting power:', error);
      setError(error.message || 'Failed to get voting power');
      return null;
    }
  }, [contractManager]);

  const getProposal = useCallback(async (proposalId: number, userAddress?: string): Promise<Proposal | null> => {
    if (!contractManager) {
      return null;
    }

    try {
      const daoContract = contractManager.getContract('libertyDAO', contractManager.currentChainId!);
      if (!daoContract) {
        throw new Error('LibertyDAO contract not found');
      }

      const proposal = await daoContract.proposals(proposalId);
      const currentTime = Math.floor(Date.now() / 1000);
      
      let hasVoted = false;
      let userVote: boolean | undefined;
      
      if (userAddress) {
        // Note: We can't directly check hasVoted from the mapping in the view function
        // This would need to be tracked through events or a separate view function
        // For now, we'll set it to false and update it through events
        hasVoted = false;
      }

      const endTime = Number(proposal.endTime);
      const votesFor = proposal.votesFor.toString();
      const votesAgainst = proposal.votesAgainst.toString();
      const totalVotes = proposal.votesFor + proposal.votesAgainst;
      
      let status: Proposal['status'];
      if (proposal.executed) {
        status = 'executed';
      } else if (currentTime >= endTime) {
        if (proposal.votesFor > proposal.votesAgainst && totalVotes >= QUORUM) {
          status = 'ended';
        } else {
          status = 'failed';
        }
      } else {
        status = 'active';
      }

      const proposalData: Proposal = {
        id: proposalId,
        description: proposal.description,
        votesFor,
        votesAgainst,
        endTime,
        executed: proposal.executed,
        hasVoted,
        userVote,
        status,
        quorumReached: totalVotes >= QUORUM,
        passed: proposal.votesFor > proposal.votesAgainst,
      };

      return proposalData;
    } catch (error: any) {
      console.error(`Error getting proposal ${proposalId}:`, error);
      return null;
    }
  }, [contractManager]);

  const getAllProposals = useCallback(async (userAddress?: string) => {
    if (!contractManager) {
      setError('Contract manager not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const daoContract = contractManager.getContract('libertyDAO', contractManager.currentChainId!);
      if (!daoContract) {
        throw new Error('LibertyDAO contract not found');
      }

      // Get the next proposal ID to know how many proposals exist
      const nextProposalId = await daoContract.nextProposalId();
      const proposalCount = Number(nextProposalId) - 1;

      const proposalPromises: Promise<Proposal | null>[] = [];
      for (let i = 1; i <= proposalCount; i++) {
        proposalPromises.push(getProposal(i, userAddress));
      }

      const proposalResults = await Promise.all(proposalPromises);
      const validProposals = proposalResults.filter((p): p is Proposal => p !== null);
      
      // Sort by proposal ID descending (newest first)
      validProposals.sort((a, b) => b.id - a.id);
      
      setProposals(validProposals);
    } catch (error: any) {
      console.error('Error getting all proposals:', error);
      setError(error.message || 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, [contractManager, getProposal]);

  const createProposal = useCallback(async (description: string) => {
    if (!contractManager) {
      throw new Error('Contract manager not available. Please connect your wallet.');
    }

    if (!description.trim()) {
      throw new Error('Proposal description cannot be empty');
    }

    if (description.length < 20) {
      throw new Error('Proposal description must be at least 20 characters');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating proposal:', description);

      const result = await contractManager.executeTransaction(
        'libertyDAO',
        'createProposal',
        [description]
      );

      console.log('Proposal creation transaction sent:', result);
      return result;
    } catch (error: any) {
      console.error('Proposal creation failed:', error);
      const errorMessage = error.message || 'Failed to create proposal';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractManager]);

  const vote = useCallback(async (proposalId: number, support: boolean) => {
    if (!contractManager) {
      throw new Error('Contract manager not available. Please connect your wallet.');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Voting on proposal ${proposalId}:`, support ? 'FOR' : 'AGAINST');

      const result = await contractManager.executeTransaction(
        'libertyDAO',
        'vote',
        [proposalId, support]
      );

      console.log('Vote transaction sent:', result);
      return result;
    } catch (error: any) {
      console.error('Voting failed:', error);
      const errorMessage = error.message || 'Failed to cast vote';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractManager]);

  const executeProposal = useCallback(async (proposalId: number) => {
    if (!contractManager) {
      throw new Error('Contract manager not available. Please connect your wallet.');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Executing proposal ${proposalId}`);

      const result = await contractManager.executeTransaction(
        'libertyDAO',
        'executeProposal',
        [proposalId]
      );

      console.log('Proposal execution transaction sent:', result);
      return result;
    } catch (error: any) {
      console.error('Proposal execution failed:', error);
      const errorMessage = error.message || 'Failed to execute proposal';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractManager]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!contractManager) return;

    const daoContract = contractManager.getContract('libertyDAO', contractManager.currentChainId!);
    if (!daoContract) return;

    const handleProposalCreated = (proposalId: number, description: string) => {
      console.log('ProposalCreated event:', { proposalId, description });
      // Refresh proposals list
      getAllProposals();
    };

    const handleVoteCast = (proposalId: number, voter: string, support: boolean, weight: bigint) => {
      console.log('VoteCast event:', { proposalId, voter, support, weight: weight.toString() });
      // Refresh specific proposal or all proposals
      getAllProposals();
    };

    const handleProposalExecuted = (proposalId: number) => {
      console.log('ProposalExecuted event:', { proposalId });
      // Refresh proposals list
      getAllProposals();
    };

    // Listen to events
    contractManager.listenToEvents('libertyDAO', 'ProposalCreated', handleProposalCreated);
    contractManager.listenToEvents('libertyDAO', 'VoteCast', handleVoteCast);
    contractManager.listenToEvents('libertyDAO', 'ProposalExecuted', handleProposalExecuted);

    // Cleanup function would remove listeners, but our current implementation doesn't support it
    return () => {
      // TODO: Implement event listener cleanup in ContractManager
    };
  }, [contractManager, getAllProposals]);

  return {
    proposals,
    votingPower,
    isLoading,
    error,
    getVotingPower,
    getAllProposals,
    getProposal,
    createProposal,
    vote,
    executeProposal,
    clearError,
  };
};