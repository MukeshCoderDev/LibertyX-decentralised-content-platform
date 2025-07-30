import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorDisplay } from '../components/shared/ErrorDisplay';
import { WalletConnectionPrompt } from '../components/shared/WalletConnectionPrompt';

// Mock wallet provider
vi.mock('../lib/WalletProvider', () => ({
  useWallet: () => ({
    connectWallet: vi.fn()
  })
}));

describe('Shared Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default size and no message', () => {
      render(<LoadingSpinner />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('h-12', 'w-12');
    });

    it('renders with custom size', () => {
      render(<LoadingSpinner size="lg" />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-16', 'w-16');
    });

    it('renders with message', () => {
      render(<LoadingSpinner message="Loading data..." />);
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('renders small size correctly', () => {
      render(<LoadingSpinner size="sm" />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-6', 'w-6');
    });
  });

  describe('ErrorDisplay', () => {
    it('renders error message', () => {
      render(<ErrorDisplay error="Test error message" />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('renders retry button by default', () => {
      const mockRetry = vi.fn();
      render(<ErrorDisplay error="Error message" onRetry={mockRetry} />);
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });

    it('hides retry button when showRetry is false', () => {
      render(<ErrorDisplay error="Error message" showRetry={false} />);
      
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorDisplay error="Error message" />);
      
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('WalletConnectionPrompt', () => {
    it('renders wallet connection prompt', () => {
      render(<WalletConnectionPrompt />);
      
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
      expect(screen.getByText('To access your gamification progress, achievements, and rewards, please connect your wallet.')).toBeInTheDocument();
    });

    it('calls connectWallet when button is clicked', () => {
      const mockConnectWallet = vi.fn();
      
      // Re-mock the wallet provider for this specific test
      vi.doMock('../lib/WalletProvider', () => ({
        useWallet: () => ({
          connectWallet: mockConnectWallet
        })
      }));

      render(<WalletConnectionPrompt />);
      
      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);
      
      expect(mockConnectWallet).toHaveBeenCalled();
    });

    it('has proper accessibility attributes', () => {
      render(<WalletConnectionPrompt />);
      
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toBeInTheDocument();
    });
  });
});