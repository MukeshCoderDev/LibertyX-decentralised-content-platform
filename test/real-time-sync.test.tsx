// import * as React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RealTimeDataSync } from '../components/RealTimeDataSync';
import { useBlockchainEvents } from '../hooks/useBlockchainEvents';
import { useRealTimeBalances } from '../hooks/useRealTimeBalances';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import { useNetworkMonitor } from '../hooks/useNetworkMonitor';
import { useWallet } from '../lib/WalletProvider';

// Mock the hooks
vi.mock('../hooks/useBlockchainEvents');
vi.mock('../hooks/useRealTimeBalances');
vi.mock('../hooks/useTransactionTracker');
vi.mock('../hooks/useNetworkMonitor');
vi.mock('../lib/WalletProvider');

const mockUseWallet = vi.mocked(useWallet);
const mockUseBlockchainEvents = vi.mocked(useBlockchainEvents);
const mockUseRealTimeBalances = vi.mocked(useRealTimeBalances);
const mockUseTransactionTracker = vi.mocked(useTransactionTracker);
const mockUseNetworkMonitor = vi.mocked(useNetworkMonitor);

describe('RealTimeDataSync', () => {
  const mockRefreshBalances = vi.fn();
  // const mockRefreshCreatorStats = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    mockUseWallet.mockReturnValue({
      account: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 1,
      provider: null,
      signer: null,
      balance: [],
      currentChain: undefined,
      isConnecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
      signMessage: vi.fn(),
      error: null
    });

    mockUseBlockchainEvents.mockReturnValue({
      subscribeToEvent: vi.fn(),
      unsubscribeFromEvent: vi.fn(),
      subscribeToUserEvents: vi.fn(),
      unsubscribeFromUserEvents: vi.fn(),
      isListening: true
    });

    mockUseRealTimeBalances.mockReturnValue({
      balances: [
        {
          token: 'LIB',
          symbol: 'LIB',
          balance: '1000.0',
          decimals: 18
        },
        {
          token: 'native',
          symbol: 'ETH',
          balance: '2.5',
          decimals: 18
        }
      ],
      isLoading: false,
      error: null,
      refreshBalances: mockRefreshBalances,
      getTokenBalance: vi.fn()
    });

    mockUseTransactionTracker.mockReturnValue({
      pendingTransactions: new Map(),
      trackTransaction: vi.fn(),
      getTransactionStatus: vi.fn(),
      clearTransaction: vi.fn(),
      clearAllTransactions: vi.fn(),
      isTransactionPending: vi.fn()
    });

    mockUseNetworkMonitor.mockReturnValue({
      networkStatus: {
        isOnline: true,
        isConnected: true,
        latency: 100,
        blockNumber: 18500000,
        lastUpdate: Date.now(),
        rpcEndpoint: 'https://mainnet.infura.io',
        chainId: 1,
        error: null
      },
      isHealthy: true,
      reconnect: vi.fn(),
      checkConnectivity: vi.fn(),
      getNetworkHealth: vi.fn().mockReturnValue('healthy')
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children and sync status indicator', () => {
    render(
      <RealTimeDataSync>
        <div data-testid="child-content">Test Content</div>
      </RealTimeDataSync>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows healthy network status when connected', () => {
    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    const statusIndicator = screen.getByText('Connected');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator.closest('div')).toHaveClass('bg-green-100');
  });

  it('shows degraded network status when connection is slow', () => {
    mockUseNetworkMonitor.mockReturnValue({
      networkStatus: {
        isOnline: true,
        isConnected: true,
        latency: 6000, // High latency
        blockNumber: 18500000,
        lastUpdate: Date.now(),
        rpcEndpoint: 'https://mainnet.infura.io',
        chainId: 1,
        error: null
      },
      isHealthy: false,
      reconnect: vi.fn(),
      checkConnectivity: vi.fn(),
      getNetworkHealth: vi.fn().mockReturnValue('degraded')
    });

    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    expect(screen.getByText('Slow Connection')).toBeInTheDocument();
  });

  it('shows offline status when disconnected', () => {
    mockUseWallet.mockReturnValue({
      account: null,
      isConnected: false,
      chainId: null,
      provider: null,
      signer: null,
      balance: [],
      currentChain: undefined,
      isConnecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
      signMessage: vi.fn(),
      error: null
    });

    mockUseNetworkMonitor.mockReturnValue({
      networkStatus: {
        isOnline: false,
        isConnected: false,
        latency: null,
        blockNumber: null,
        lastUpdate: Date.now(),
        rpcEndpoint: null,
        chainId: null,
        error: 'Network offline'
      },
      isHealthy: false,
      reconnect: vi.fn(),
      checkConnectivity: vi.fn(),
      getNetworkHealth: vi.fn().mockReturnValue('offline')
    });

    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('displays pending transactions count', () => {
    const pendingTxs = new Map();
    pendingTxs.set('0xabc123', {
      hash: '0xabc123',
      status: 'pending' as const,
      confirmations: 0,
      requiredConfirmations: 1
    });

    mockUseTransactionTracker.mockReturnValue({
      pendingTransactions: pendingTxs,
      trackTransaction: vi.fn(),
      getTransactionStatus: vi.fn(),
      clearTransaction: vi.fn(),
      clearAllTransactions: vi.fn(),
      isTransactionPending: vi.fn()
    });

    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    expect(screen.getByText('1 pending')).toBeInTheDocument();
  });

  it('handles blockchain events and shows notifications', async () => {
    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    // Simulate a creator registration event
    const event = new CustomEvent('creatorRegistered', {
      detail: { creator: '0x1234567890123456789012345678901234567890' }
    });
    
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText('Creator profile registered successfully!')).toBeInTheDocument();
    });
  });

  it('handles content upload events', async () => {
    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    const event = new CustomEvent('contentUploaded', {
      detail: { contentId: 1, creator: '0x1234567890123456789012345678901234567890' }
    });
    
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText('Content uploaded successfully!')).toBeInTheDocument();
    });
  });

  it('handles transaction confirmation events', async () => {
    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    const event = new CustomEvent('transactionConfirmed', {
      detail: { 
        hash: '0xabc123', 
        description: 'NFT Mint',
        receipt: { status: 1 }
      }
    });
    
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText('Transaction confirmed: NFT Mint')).toBeInTheDocument();
    });

    // Should also refresh balances
    expect(mockRefreshBalances).toHaveBeenCalled();
  });

  it('handles transaction failure events', async () => {
    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    const event = new CustomEvent('transactionFailed', {
      detail: { 
        hash: '0xabc123', 
        description: 'NFT Mint',
        error: 'Insufficient funds'
      }
    });
    
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText('Transaction failed: NFT Mint - Insufficient funds')).toBeInTheDocument();
    });
  });

  it('allows dismissing notifications', async () => {
    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    // Trigger a notification
    const event = new CustomEvent('creatorRegistered', {
      detail: { creator: '0x1234567890123456789012345678901234567890' }
    });
    
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText('Creator profile registered successfully!')).toBeInTheDocument();
    });

    // Click dismiss button
    const dismissButton = screen.getByText('×');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText('Creator profile registered successfully!')).not.toBeInTheDocument();
    });
  });

  it('shows network health details when connection is degraded', () => {
    mockUseNetworkMonitor.mockReturnValue({
      networkStatus: {
        isOnline: true,
        isConnected: true,
        latency: 6000,
        blockNumber: 18500000,
        lastUpdate: Date.now(),
        rpcEndpoint: 'https://mainnet.infura.io',
        chainId: 1,
        error: null
      },
      isHealthy: false,
      reconnect: vi.fn(),
      checkConnectivity: vi.fn(),
      getNetworkHealth: vi.fn().mockReturnValue('degraded')
    });

    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    expect(screen.getByText('Network Status')).toBeInTheDocument();
    expect(screen.getByText('6000ms')).toBeInTheDocument();
    expect(screen.getByText('18500000')).toBeInTheDocument();
  });

  it('refreshes balances on token transfer events', async () => {
    render(
      <RealTimeDataSync>
        <div>Test</div>
      </RealTimeDataSync>
    );

    const event = new CustomEvent('tokenTransfer', {
      detail: { 
        from: '0x1234567890123456789012345678901234567890',
        to: '0x9876543210987654321098765432109876543210',
        amount: '100'
      }
    });
    
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(mockRefreshBalances).toHaveBeenCalled();
    });
  });
});