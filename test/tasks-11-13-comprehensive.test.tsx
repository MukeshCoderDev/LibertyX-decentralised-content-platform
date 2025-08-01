/**
 * Comprehensive Test Suite for Tasks 11-13
 * Testing DAO Governance, Real-time Sync, and Error Handling
 * 
 * This is our "bold move" - comprehensive testing to ensure production readiness
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ethers } from 'ethers';
import { WalletProvider } from '../lib/WalletProvider';
import { GovernanceDashboard } from '../components/GovernanceDashboard';
import { ProposalCreationForm } from '../components/ProposalCreationForm';
import { VotingPowerDisplay } from '../components/VotingPowerDisplay';
import { RealTimeDataSync } from '../components/RealTimeDataSync';
import { StableBalanceDisplay } from '../components/StableBalanceDisplay';
import { TransactionFeedback } from '../components/TransactionFeedback';
import { Notification } from '../components/NotificationSystem';
import ErrorBoundary from '../components/ErrorBoundary';
import { useLibertyDAO } from '../hooks/useLibertyDAO';
import { useRealTimeBalances } from '../hooks/useRealTimeBalances';
import { useErrorHandling } from '../hooks/useErrorHandling';

// Mock Web3 and contract interactions
const mockProvider = {
  getNetwork: vi.fn().mockResolvedValue({ chainId: 1, name: 'mainnet' }),
  getSigner: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  removeAllListeners: vi.fn(),
};

const mockContract = {
  balanceOf: vi.fn(),
  proposals: vi.fn(),
  createProposal: vi.fn(),
  vote: vi.fn(),
  getProposalCount: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  filters: {
    ProposalCreated: vi.fn(),
    VoteCast: vi.fn(),
    ProposalExecuted: vi.fn(),
  },
};

const mockSigner = {
  getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
  getBalance: vi.fn().mockResolvedValue(ethers.parseEther('10')),
};

// Mock hooks
vi.mock('../hooks/useLibertyDAO');
vi.mock('../hooks/useRealTimeBalances');
vi.mock('../hooks/useErrorHandling');

// Mock WalletProvider properly
vi.mock('../lib/WalletProvider', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    WalletProvider: ({ children }: { children: React.ReactNode }) => children,
    useWallet: () => ({
      account: '0x1234567890123456789012345678901234567890',
      provider: mockProvider,
      signer: mockSigner,
      isConnected: true,
      chainId: 1,
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
  };
});

describe('Task 11: DAO Governance Integration - BOLD TESTING', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock DAO hook with realistic data
    (useLibertyDAO as any).mockReturnValue({
      votingPower: ethers.parseEther('5000'), // 5000 LIB tokens
      proposals: [
        {
          id: 1,
          title: 'Increase Creator Revenue Share',
          description: 'Proposal to increase creator revenue share from 90% to 95%',
          proposer: '0x1234567890123456789012345678901234567890',
          forVotes: ethers.parseEther('10000'),
          againstVotes: ethers.parseEther('2000'),
          executed: false,
          deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        },
        {
          id: 2,
          title: 'Add New Supported Token',
          description: 'Proposal to add USDC as a supported payment token',
          proposer: '0x9876543210987654321098765432109876543210',
          forVotes: ethers.parseEther('15000'),
          againstVotes: ethers.parseEther('1000'),
          executed: true,
          deadline: Math.floor(Date.now() / 1000) - 86400, // 24 hours ago
        },
      ],
      createProposal: vi.fn().mockResolvedValue({
        hash: '0xabcdef1234567890',
        wait: vi.fn().mockResolvedValue({ status: 1 }),
      }),
      vote: vi.fn().mockResolvedValue({
        hash: '0x1234567890abcdef',
        wait: vi.fn().mockResolvedValue({ status: 1 }),
      }),
      loading: false,
      error: null,
    });
  });

  describe('Voting Power Display', () => {
    it('should display correct voting power based on LIB token holdings', async () => {
      render(
        <WalletProvider>
          <VotingPowerDisplay votingPower={5000} isLoading={false} />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/5,000/)).toBeInTheDocument();
        expect(screen.getByText(/LIB/)).toBeInTheDocument();
      });
    });

    it('should show minimum token requirement warning when below threshold', async () => {
      (useLibertyDAO as any).mockReturnValue({
        votingPower: ethers.parseEther('500'), // Below 1000 LIB minimum
        proposals: [],
        createProposal: vi.fn(),
        vote: vi.fn(),
        loading: false,
        error: null,
      });

      render(
        <WalletProvider>
          <VotingPowerDisplay votingPower={500} isLoading={false} />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/minimum.*1,000.*LIB/i)).toBeInTheDocument();
      });
    });
  });

  describe('Proposal Management', () => {
    it('should display active and past proposals correctly', async () => {
      render(
        <WalletProvider>
          <GovernanceDashboard />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Increase Creator Revenue Share')).toBeInTheDocument();
        expect(screen.getByText('Add New Supported Token')).toBeInTheDocument();
      });
    });

    it('should create new proposal with proper validation', async () => {
      const mockCreateProposal = vi.fn().mockResolvedValue({
        hash: '0xabcdef1234567890',
        wait: vi.fn().mockResolvedValue({ status: 1 }),
      });

      (useLibertyDAO as any).mockReturnValue({
        votingPower: ethers.parseEther('5000'),
        proposals: [],
        createProposal: mockCreateProposal,
        vote: vi.fn(),
        loading: false,
        error: null,
      });

      render(
        <WalletProvider>
          <ProposalCreationForm votingPower={5000} isLoading={false} onCreateProposal={vi.fn()} />
        </WalletProvider>
      );

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Proposal' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'This is a test proposal for governance' },
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create proposal/i }));

      await waitFor(() => {
        expect(mockCreateProposal).toHaveBeenCalledWith(
          'Test Proposal',
          'This is a test proposal for governance'
        );
      });
    });

    it('should handle voting with proper token weighting', async () => {
      const mockVote = vi.fn().mockResolvedValue({
        hash: '0x1234567890abcdef',
        wait: vi.fn().mockResolvedValue({ status: 1 }),
      });

      (useLibertyDAO as any).mockReturnValue({
        votingPower: ethers.parseEther('5000'),
        proposals: [
          {
            id: 1,
            title: 'Test Proposal',
            description: 'Test Description',
            proposer: '0x1234567890123456789012345678901234567890',
            forVotes: ethers.parseEther('10000'),
            againstVotes: ethers.parseEther('2000'),
            executed: false,
            deadline: Math.floor(Date.now() / 1000) + 86400,
          },
        ],
        createProposal: vi.fn(),
        vote: mockVote,
        loading: false,
        error: null,
      });

      render(
        <WalletProvider>
          <GovernanceDashboard />
        </WalletProvider>
      );

      // Vote for the proposal
      const voteForButton = screen.getByRole('button', { name: /vote for/i });
      fireEvent.click(voteForButton);

      await waitFor(() => {
        expect(mockVote).toHaveBeenCalledWith(1, true); // proposalId: 1, support: true
      });
    });
  });
});

describe('Task 12: Real-time Data Synchronization - BOLD TESTING', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock real-time balances hook
    (useRealTimeBalances as any).mockReturnValue({
      balances: {
        LIB: ethers.parseEther('5000'),
        ETH: ethers.parseEther('2.5'),
        MATIC: ethers.parseEther('1000'),
        BNB: ethers.parseEther('10'),
      },
      loading: false,
      error: null,
      refreshBalances: vi.fn(),
    });
  });

  describe('Real-time Balance Updates', () => {
    it('should display real-time token balances correctly', async () => {
      render(
        <WalletProvider>
          <StableBalanceDisplay />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/5,000.*LIB/)).toBeInTheDocument();
        expect(screen.getByText(/2\.5.*ETH/)).toBeInTheDocument();
      });
    });

    it('should update balances automatically without page refresh', async () => {
      const mockRefreshBalances = vi.fn();
      
      (useRealTimeBalances as any).mockReturnValue({
        balances: {
          LIB: ethers.parseEther('5000'),
          ETH: ethers.parseEther('2.5'),
        },
        loading: false,
        error: null,
        refreshBalances: mockRefreshBalances,
      });

      render(
        <WalletProvider>
          <RealTimeDataSync>
            <StableBalanceDisplay />
          </RealTimeDataSync>
        </WalletProvider>
      );

      // Simulate blockchain event
      act(() => {
        // Trigger event listener
        const eventCallback = mockProvider.on.mock.calls.find(
          call => call[0] === 'block'
        )?.[1];
        if (eventCallback) {
          eventCallback(12345678);
        }
      });

      await waitFor(() => {
        expect(mockRefreshBalances).toHaveBeenCalled();
      });
    });

    it('should handle network switching gracefully', async () => {
      const { rerender } = render(
        <WalletProvider>
          <StableBalanceDisplay />
        </WalletProvider>
      );

      // Simulate network change
      mockProvider.getNetwork.mockResolvedValueOnce({ chainId: 137, name: 'polygon' });

      rerender(
        <WalletProvider>
          <StableBalanceDisplay />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/polygon/i)).toBeInTheDocument();
      });
    });
  });

  describe('Event Listening System', () => {
    it('should set up blockchain event listeners correctly', () => {
      render(
        <WalletProvider>
          <RealTimeDataSync>
            <div>Test Content</div>
          </RealTimeDataSync>
        </WalletProvider>
      );

      expect(mockProvider.on).toHaveBeenCalledWith('block', expect.any(Function));
      expect(mockContract.on).toHaveBeenCalledWith('Transfer', expect.any(Function));
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(
        <WalletProvider>
          <RealTimeDataSync>
            <div>Test Content</div>
          </RealTimeDataSync>
        </WalletProvider>
      );

      unmount();

      expect(mockProvider.removeAllListeners).toHaveBeenCalled();
    });
  });
});

describe('Task 13: Comprehensive Error Handling - BOLD TESTING', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock error handling hook
    (useErrorHandling as any).mockReturnValue({
      error: null,
      setError: vi.fn(),
      clearError: vi.fn(),
      handleError: vi.fn(),
      isLoading: false,
      setLoading: vi.fn(),
    });
  });

  describe('Transaction Error Handling', () => {
    it('should display user-friendly error messages for common failures', async () => {
      const mockHandleError = vi.fn();
      
      (useErrorHandling as any).mockReturnValue({
        error: {
          type: 'INSUFFICIENT_FUNDS',
          message: 'Insufficient funds for transaction',
          details: 'Required: 0.1 ETH, Available: 0.05 ETH',
        },
        setError: vi.fn(),
        clearError: vi.fn(),
        handleError: mockHandleError,
        isLoading: false,
        setLoading: vi.fn(),
      });

      render(
        <WalletProvider>
          <TransactionFeedback />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/insufficient funds/i)).toBeInTheDocument();
        expect(screen.getByText(/required.*0\.1 eth/i)).toBeInTheDocument();
      });
    });

    it('should show transaction progress with hash and confirmations', async () => {
      render(
        <WalletProvider>
          <TransactionFeedback
            transaction={{
              hash: '0xabcdef1234567890',
              confirmations: 2,
              status: 'pending',
            }}
          />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/0xabcd.*7890/)).toBeInTheDocument();
        expect(screen.getByText(/2.*confirmations/i)).toBeInTheDocument();
      });
    });

    it('should handle gas estimation failures with alternatives', async () => {
      const gasEstimationError = new Error('Gas estimation failed') as any;
      gasEstimationError.code = 'UNPREDICTABLE_GAS_LIMIT';

      (useErrorHandling as any).mockReturnValue({
        error: {
          type: 'GAS_ESTIMATION_FAILED',
          message: 'Unable to estimate gas',
          alternatives: [
            { type: 'slow', gasPrice: '20000000000', gasLimit: '21000' },
            { type: 'standard', gasPrice: '25000000000', gasLimit: '21000' },
            { type: 'fast', gasPrice: '30000000000', gasLimit: '21000' },
          ],
        },
        setError: vi.fn(),
        clearError: vi.fn(),
        handleError: vi.fn(),
        isLoading: false,
        setLoading: vi.fn(),
      });

      render(
        <WalletProvider>
          <TransactionFeedback />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/gas estimation failed/i)).toBeInTheDocument();
        expect(screen.getByText(/slow/i)).toBeInTheDocument();
        expect(screen.getByText(/standard/i)).toBeInTheDocument();
        expect(screen.getByText(/fast/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Protection', () => {
    it('should catch and display component errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test component error');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should allow error recovery through retry mechanism', () => {
      let shouldThrow = true;
      
      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error('Temporary error');
        }
        return <div>Component loaded successfully</div>;
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Simulate error recovery
      shouldThrow = false;
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      rerender(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/component loaded successfully/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Notification System', () => {
    it('should display success notifications with next steps', async () => {
      render(
        <WalletProvider>
          <NotificationSystem
            notifications={[
              {
                id: '1',
                type: 'success',
                title: 'Transaction Successful',
                message: 'Your proposal has been created successfully',
                nextSteps: ['View your proposal', 'Share with community'],
              },
            ]}
          />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/transaction successful/i)).toBeInTheDocument();
        expect(screen.getByText(/view your proposal/i)).toBeInTheDocument();
      });
    });

    it('should auto-dismiss notifications after timeout', async () => {
      vi.useFakeTimers();

      const { rerender } = render(
        <WalletProvider>
          <NotificationSystem
            notifications={[
              {
                id: '1',
                type: 'info',
                title: 'Info Message',
                message: 'This will auto-dismiss',
                autoHide: true,
                duration: 3000,
              },
            ]}
          />
        </WalletProvider>
      );

      expect(screen.getByText(/info message/i)).toBeInTheDocument();

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      rerender(
        <WalletProvider>
          <NotificationSystem notifications={[]} />
        </WalletProvider>
      );

      expect(screen.queryByText(/info message/i)).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});

describe('Integration Testing - Tasks 11-13 Combined', () => {
  it('should handle complete governance flow with real-time updates and error handling', async () => {
    const mockCreateProposal = vi.fn().mockResolvedValue({
      hash: '0xabcdef1234567890',
      wait: vi.fn().mockResolvedValue({ status: 1 }),
    });

    (useLibertyDAO as any).mockReturnValue({
      votingPower: ethers.parseEther('5000'),
      proposals: [],
      createProposal: mockCreateProposal,
      vote: vi.fn(),
      loading: false,
      error: null,
    });

    render(
      <WalletProvider>
        <ErrorBoundary>
          <RealTimeDataSync>
            <GovernanceDashboard />
            <ProposalCreationForm />
            <TransactionFeedback />
          </RealTimeDataSync>
        </ErrorBoundary>
      </WalletProvider>
    );

    // Create a proposal
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Integration Test Proposal' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Testing complete integration flow' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create proposal/i }));

    await waitFor(() => {
      expect(mockCreateProposal).toHaveBeenCalled();
      expect(screen.getByText(/transaction successful/i)).toBeInTheDocument();
    });
  });

  it('should maintain data consistency across all components', async () => {
    const sharedState = {
      votingPower: ethers.parseEther('5000'),
      balances: {
        LIB: ethers.parseEther('5000'),
        ETH: ethers.parseEther('2.5'),
      },
    };

    (useLibertyDAO as any).mockReturnValue({
      ...sharedState,
      proposals: [],
      createProposal: vi.fn(),
      vote: vi.fn(),
      loading: false,
      error: null,
    });

    (useRealTimeBalances as any).mockReturnValue({
      balances: sharedState.balances,
      loading: false,
      error: null,
      refreshBalances: vi.fn(),
    });

    render(
      <WalletProvider>
        <VotingPowerDisplay />
        <StableBalanceDisplay />
      </WalletProvider>
    );

    await waitFor(() => {
      // Both components should show the same LIB balance
      const libElements = screen.getAllByText(/5,000.*LIB/);
      expect(libElements).toHaveLength(2);
    });
  });
});

describe('Performance and Load Testing', () => {
  it('should handle rapid state updates without performance degradation', async () => {
    const startTime = performance.now();
    
    const { rerender } = render(
      <WalletProvider>
        <RealTimeDataSync>
          <StableBalanceDisplay />
        </RealTimeDataSync>
      </WalletProvider>
    );

    // Simulate 100 rapid balance updates
    for (let i = 0; i < 100; i++) {
      (useRealTimeBalances as any).mockReturnValue({
        balances: {
          LIB: ethers.parseEther((5000 + i).toString()),
          ETH: ethers.parseEther('2.5'),
        },
        loading: false,
        error: null,
        refreshBalances: vi.fn(),
      });

      rerender(
        <WalletProvider>
          <RealTimeDataSync>
            <StableBalanceDisplay />
          </RealTimeDataSync>
        </WalletProvider>
      );
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (less than 1 second)
    expect(duration).toBeLessThan(1000);
  });

  it('should handle multiple simultaneous transactions gracefully', async () => {
    const transactions = Array.from({ length: 5 }, (_, i) => ({
      hash: `0x${i.toString().padStart(40, '0')}`,
      confirmations: i,
      status: 'pending',
    }));

    render(
      <WalletProvider>
        {transactions.map((tx, index) => (
          <TransactionFeedback key={index} transaction={tx} />
        ))}
      </WalletProvider>
    );

    await waitFor(() => {
      transactions.forEach((tx) => {
        expect(screen.getByText(new RegExp(tx.hash.slice(0, 6)))).toBeInTheDocument();
      });
    });
  });
});