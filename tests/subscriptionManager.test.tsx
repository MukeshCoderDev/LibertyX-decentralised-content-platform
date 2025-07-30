import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubscriptionManager from '../components/SubscriptionManager';
import { WalletProvider } from '../lib/WalletProvider';

// Mock hooks
vi.mock('../hooks/useContractManager', () => ({
  useContractManager: () => ({
    executeTransaction: vi.fn(),
    getContract: vi.fn(),
    isContractAvailable: vi.fn().mockResolvedValue(true),
    currentChainId: 11155111
  })
}));

vi.mock('../components/UserFeedback', () => ({
  useFeedback: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn()
  })
}));

const mockWalletContext = {
  account: '0x1234567890123456789012345678901234567890',
  isConnected: true,
  chainId: 11155111,
  balance: '1000000000000000000', // 1 ETH
  connect: vi.fn(),
  disconnect: vi.fn(),
  switchNetwork: vi.fn()
};

const WrapperComponent = ({ children }: { children: React.ReactNode }) => (
  <WalletProvider value={mockWalletContext as any}>
    {children}
  </WalletProvider>
);

describe('SubscriptionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creator Mode', () => {
    it('should render plan creation form', () => {
      render(
        <WrapperComponent>
          <SubscriptionManager mode="creator" />
        </WrapperComponent>
      );

      expect(screen.getByText('Subscription Plan Management')).toBeInTheDocument();
      expect(screen.getByLabelText(/Subscription Price/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Duration/)).toBeInTheDocument();
    });

    it('should validate price input', async () => {
      render(
        <WrapperComponent>
          <SubscriptionManager mode="creator" />
        </WrapperComponent>
      );

      const priceInput = screen.getByLabelText(/Subscription Price/);
      fireEvent.change(priceInput, { target: { value: '-1' } });

      await waitFor(() => {
        expect(screen.getByText(/Price must be a positive number/)).toBeInTheDocument();
      });
    });

    it('should show minimum price validation', async () => {
      render(
        <WrapperComponent>
          <SubscriptionManager mode="creator" />
        </WrapperComponent>
      );

      const priceInput = screen.getByLabelText(/Subscription Price/);
      fireEvent.change(priceInput, { target: { value: '0.0001' } });

      await waitFor(() => {
        expect(screen.getByText(/Minimum price is 0.001 ETH/)).toBeInTheDocument();
      });
    });
  });

  describe('Fan Mode', () => {
    it('should render subscription interface for fans', () => {
      render(
        <WrapperComponent>
          <SubscriptionManager 
            mode="fan" 
            creatorAddress="0x1234567890123456789012345678901234567890"
          />
        </WrapperComponent>
      );

      expect(screen.getByText('Creator Subscription')).toBeInTheDocument();
    });

    it('should show wallet connection prompt when not connected', () => {
      const disconnectedContext = { ...mockWalletContext, isConnected: false };
      
      render(
        <WalletProvider value={disconnectedContext as any}>
          <SubscriptionManager mode="fan" />
        </WalletProvider>
      );

      expect(screen.getByText(/Please connect your wallet/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display retry button on error', async () => {
      render(
        <WrapperComponent>
          <SubscriptionManager mode="creator" />
        </WrapperComponent>
      );

      // Simulate error state
      // This would require mocking the contract manager to throw an error
      // Implementation depends on how errors are handled in the component
    });
  });
});