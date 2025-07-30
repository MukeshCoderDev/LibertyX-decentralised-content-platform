import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../lib/WalletProvider';
import {
  Proposal,
  VotingPower,
  GOVERNANCE_CONSTANTS,
  GOVERNANCE_CONTRACTS,
} from '../types';
import {
  createGovernanceError,
  getErrorMessage,
  formatTokenAmount,
  calculateProposalStatus,
  isQuorumReached,
  isProposalPassed,
} from '../utils/governance';

// LibertyDAO ABI (minimal required functions)
const LIBERTY_DAO_ABI = [
  'function createProposal(string memory description) external',
  'function vote(uint256 proposalId, bool support) external',
  'function executeProposal(uint256 proposalId) external',
  'function proposals(uint256 proposalId) external view returns (string memory description, uint256 votesFor, uint256 votesAgainst, uint256 endTime, bool executed)',
  'function proposalCount() external view returns (uint256)',
  'function hasVoted(uint256 proposalId, address voter) external view returns (bool)',
  'function getVote(uint256 proposalId, address voter) external view returns (bool)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description)',
  'event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)',
  'event ProposalExecuted(uint256 indexed proposalId)',
];

// LibertyToken ABI (minimal required functions)
const LIBERTY_TOKEN_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
];

export const useLibertyDAO = () => {
  const { signer, account: address, isConnected } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votingPower, setVotingPower] = useState<VotingPower | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Immediate fix: Set default values when connected but no signer
  useEffect(() => {
    if (isConnected && address && !signer) {
      console.log('Connected but no signer, setting default values');
      setVotingPower({
        balance: '0',
        formattedBalance: '0.00',
        canCreateProposal: false,
        canVote: false,
      });
      setProposals([]);
      setIsLoading(false);
      setError('Wallet connected but unable to access smart contracts. Please ensure you are on Sepolia testnet.');
    }
  }, [isConnected, address, signer]);

  // Emergency loading state resolver - force stop loading after 2 seconds
  useEffect(() => {
    if (isLoading) {
      const emergencyTimeout = setTimeout(() => {
        console.log('Emergency timeout: forcing loading to stop');
        setIsLoading(false);
        if (!votingPower) {
          setVotingPower({
            balance: '0',
            formattedBalance: '0.00',
            canCreateProposal: false,
            canVote: false,
          });
        }
        if (proposals.length === 0) {
          setProposals([]);
        }
      }, 2000); // 2 second emergency timeout

      return () => clearTimeout(emergencyTimeout);
    }
  }, [isLoading, votingPower, proposals.length]);

  // Add development mode logging
  useEffect(() => {
    console.log('useLibertyDAO state:', {
      isConnected,
      address,
      hasSigner: !!signer,
      isLoading,
      error,
      votingPower,
      proposalsCount: proposals.length
    });
  }, [isConnected, address, signer, isLoading, error, votingPower, proposals.length]);

  // Contract instances
  const getDaoContract = useCallback(() => {
    if (!signer) {
      console.log('No signer available for DAO contract');
      return null;
    }
    try {
      return new ethers.Contract(GOVERNANCE_CONTRACTS.LIBERTY_DAO, LIBERTY_DAO_ABI, signer);
    } catch (error) {
      console.error('Error creating DAO contract:', error);
      return null;
    }
  }, [signer]);

  const getTokenContract = useCallback(() => {
    if (!signer) {
      console.log('No signer available for token contract');
      return null;
    }
    try {
      return new ethers.Contract(GOVERNANCE_CONTRACTS.LIBERTY_TOKEN, LIBERTY_TOKEN_ABI, signer);
    } catch (error) {
      console.error('Error creating token contract:', error);
      return null;
    }
  }, [signer]);

  // Get user's voting power and eligibility
  const getVotingPower = useCallback(async (userAddress: string): Promise<VotingPower | null> => {
    try {
      const tokenContract = getTokenContract();
      if (!tokenContract) {
        console.log('Token contract not available');
        return {
          balance: '0',
          formattedBalance: '0.00',
          canCreateProposal: false,
          canVote: false,
        };
      }

      const balance = await tokenContract.balanceOf(userAddress);
      const balanceString = balance.toString();
      
      return {
        balance: balanceString,
        formattedBalance: formatTokenAmount(balanceString),
        canCreateProposal: balance >= ethers.parseEther(GOVERNANCE_CONSTANTS.MIN_PROPOSAL_TOKENS),
        canVote: balance > 0,
      };
    } catch (err) {
      console.error('Error fetching voting power:', err);
      // Return default values instead of null to prevent loading state
      return {
        balance: '0',
        formattedBalance: '0.00',
        canCreateProposal: false,
        canVote: false,
      };
    }
  }, [getTokenContract]);

  // Get all proposals from the smart contract
  const getAllProposals = useCallback(async (userAddress?: string): Promise<Proposal[]> => {
    try {
      const daoContract = getDaoContract();
      if (!daoContract) {
        console.log('DAO contract not available');
        return [];
      }

      const proposalCount = await daoContract.proposalCount();
      const proposalPromises: Promise<Proposal>[] = [];

      for (let i = 1; i <= proposalCount; i++) {
        proposalPromises.push(
          (async () => {
            const [description, votesFor, votesAgainst, endTime, executed] = await daoContract.proposals(i);
            
            let hasVoted = false;
            let userVote = false;
            
            if (userAddress) {
              hasVoted = await daoContract.hasVoted(i, userAddress);
              if (hasVoted) {
                userVote = await daoContract.getVote(i, userAddress);
              }
            }

            const proposal: Proposal = {
              id: i,
              description,
              votesFor: votesFor.toString(),
              votesAgainst: votesAgainst.toString(),
              endTime: Number(endTime),
              executed,
              hasVoted,
              userVote,
              status: 'active', // Will be calculated below
              quorumReached: isQuorumReached(votesFor.toString(), votesAgainst.toString()),
              passed: isProposalPassed(votesFor.toString(), votesAgainst.toString()),
            };

            proposal.status = calculateProposalStatus(proposal);
            return proposal;
          })()
        );
      }

      const loadedProposals = await Promise.all(proposalPromises);
      return loadedProposals.reverse(); // Show newest first
    } catch (err) {
      console.error('Error fetching proposals:', err);
      // Return empty array instead of setting error to prevent loading state
      return [];
    }
  }, [getDaoContract]);

  // Create a new proposal
  const createProposal = useCallback(async (description: string): Promise<boolean> => {
    if (!signer || !address) {
      setError('Wallet not connected');
      return false;
    }

    if (description.length < GOVERNANCE_CONSTANTS.MIN_DESCRIPTION_LENGTH || 
        description.length > GOVERNANCE_CONSTANTS.MAX_DESCRIPTION_LENGTH) {
      setError(`Description must be between ${GOVERNANCE_CONSTANTS.MIN_DESCRIPTION_LENGTH} and ${GOVERNANCE_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`);
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if user has enough tokens
      const userVotingPower = await getVotingPower(address);
      if (!userVotingPower?.canCreateProposal) {
        setError(`You need at least ${GOVERNANCE_CONSTANTS.MIN_PROPOSAL_TOKENS} LIB tokens to create a proposal`);
        return false;
      }

      const daoContract = getDaoContract();
      if (!daoContract) {
        setError('Contract not available');
        return false;
      }

      const tx = await retryWithBackoff(async () => {
        return await daoContract.createProposal(description);
      });
      await tx.wait();

      // Refresh proposals after creation
      const updatedProposals = await getAllProposals(address);
      setProposals(updatedProposals);

      return true;
    } catch (err) {
      console.error('Error creating proposal:', err);
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [signer, address, getDaoContract, getVotingPower, getAllProposals]);

  // Vote on a proposal
  const vote = useCallback(async (proposalId: number, support: boolean): Promise<boolean> => {
    if (!signer || !address) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if user has voting power
      const userVotingPower = await getVotingPower(address);
      if (!userVotingPower?.canVote) {
        setError('You need LIB tokens to vote');
        return false;
      }

      const daoContract = getDaoContract();
      if (!daoContract) {
        setError('Contract not available');
        return false;
      }

      const tx = await retryWithBackoff(async () => {
        return await daoContract.vote(proposalId, support);
      });
      await tx.wait();

      // Refresh proposals after voting
      const updatedProposals = await getAllProposals(address);
      setProposals(updatedProposals);

      return true;
    } catch (err) {
      console.error('Error voting:', err);
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [signer, address, getDaoContract, getVotingPower, getAllProposals]);

  // Execute an approved proposal
  const executeProposal = useCallback(async (proposalId: number): Promise<boolean> => {
    if (!signer || !address) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const daoContract = getDaoContract();
      if (!daoContract) {
        setError('Contract not available');
        return false;
      }

      const tx = await retryWithBackoff(async () => {
        return await daoContract.executeProposal(proposalId);
      });
      await tx.wait();

      // Refresh proposals after execution
      const updatedProposals = await getAllProposals(address);
      setProposals(updatedProposals);

      return true;
    } catch (err) {
      console.error('Error executing proposal:', err);
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [signer, address, getDaoContract, getAllProposals]);

  // Network connectivity check
  const checkNetworkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      if (!signer) return false;
      await signer.provider.getNetwork();
      return true;
    } catch (error) {
      console.error('Network connectivity check failed:', error);
      return false;
    }
  }, [signer]);

  // Load initial data when wallet connects
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isConnected || !address) {
        setProposals([]);
        setVotingPower(null);
        setIsLoading(false);
        return;
      }

      // Don't start loading if we don't have a signer
      if (!signer) {
        console.log('No signer available, skipping contract calls');
        setVotingPower({
          balance: '0',
          formattedBalance: '0.00',
          canCreateProposal: false,
          canVote: false,
        });
        setProposals([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      // Set a more aggressive timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Loading timeout reached, forcing default values');
        setVotingPower({
          balance: '0',
          formattedBalance: '0.00',
          canCreateProposal: false,
          canVote: false,
        });
        setProposals([]);
        setIsLoading(false);
        setError('Unable to connect to governance contracts. Please ensure you are connected to Sepolia testnet.');
      }, 3000); // Reduced to 3 seconds for faster resolution
      
      try {
        const [userVotingPower, allProposals] = await Promise.all([
          getVotingPower(address),
          getAllProposals(address),
        ]);

        clearTimeout(timeoutId);
        setVotingPower(userVotingPower);
        setProposals(allProposals);
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error('Error loading initial data:', err);
        
        // Set default values instead of error to prevent loading state
        setVotingPower({
          balance: '0',
          formattedBalance: '0.00',
          canCreateProposal: false,
          canVote: false,
        });
        setProposals([]);
        
        console.log('Set default values due to contract error:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [isConnected, address, signer, getVotingPower, getAllProposals]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!signer || !address) return;

    const daoContract = getDaoContract();
    if (!daoContract) return;

    const handleProposalCreated = async () => {
      const updatedProposals = await getAllProposals(address);
      setProposals(updatedProposals);
    };

    const handleVoteCast = async () => {
      const [userVotingPower, updatedProposals] = await Promise.all([
        getVotingPower(address),
        getAllProposals(address),
      ]);
      setVotingPower(userVotingPower);
      setProposals(updatedProposals);
    };

    const handleProposalExecuted = async () => {
      const updatedProposals = await getAllProposals(address);
      setProposals(updatedProposals);
    };

    // Add event listeners
    daoContract.on('ProposalCreated', handleProposalCreated);
    daoContract.on('VoteCast', handleVoteCast);
    daoContract.on('ProposalExecuted', handleProposalExecuted);

    // Cleanup function
    return () => {
      daoContract.off('ProposalCreated', handleProposalCreated);
      daoContract.off('VoteCast', handleVoteCast);
      daoContract.off('ProposalExecuted', handleProposalExecuted);
    };
  }, [signer, address, getDaoContract, getVotingPower, getAllProposals]);

  // Retry mechanism with exponential backoff
  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry user-rejected transactions
        if (error.code === 'ACTION_REJECTED') {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries - 1) {
          break;
        }
        
        // Exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying operation in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }, []);

  // Refresh function for manual updates with retry
  const refresh = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const [userVotingPower, allProposals] = await retryWithBackoff(async () => {
        return await Promise.all([
          getVotingPower(address),
          getAllProposals(address),
        ]);
      });

      setVotingPower(userVotingPower);
      setProposals(allProposals);
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [address, getVotingPower, getAllProposals, retryWithBackoff]);

  return {
    proposals,
    votingPower,
    isLoading,
    error,
    createProposal,
    vote,
    executeProposal,
    refresh,
    clearError: () => setError(null),
  };
};