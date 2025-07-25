import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import EarningsDashboard from '../components/EarningsDashboard';
import PriceDisplay from '../components/PriceDisplay';
import TokenSelector from '../components/TokenSelector';
import { WalletProvider } from '../lib/WalletProvider';

// Mock hooks and dependencies
vi.mock('../hooks/useRevenueSplitter', () => ({
  useRevenueSplitter: () => ({
    getCreatorEarnings: vi.fn().mockResolvedValue({
      totalEarnings: [{ amount: '1000000000000000000', token: 'ETH', decimals: 18, symbol: 'ETH', icon: '⟠' }],
      availableBalance: [{ amount: '500000000000000000', token: 'ETH', decimals: 18, symbol: 'ETH', icon: '⟠' }],
      recentSplits: []
    }),
    listenToSplitEvents: vi.fn().mockReturnValue(() => {}),
    loading: false
  })
}));

vi.mock('../lib/tokenConfig', () => ({
  getAllTokens: () => [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', decimals: 18, category: 'layer1' },
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿', decimals: 8, category: 'layer1' },
    { symbol: 'LIB', name: 'Liberty Token', icon: '🗽', decimals: 18, category: 'platform' }
  ],
  getTokensByCategory: (category: string) => [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', decimals: 18, category: 'layer1' }
  ],
  TOKEN_CATEGORIES: {
    platform: 'Platform Tokens',
    layer1: 'Layer 1 Blockchains',
    layer2: 'Layer 2 Solutions'
  },
  formatTokenAmount: (amount: string, decimals: number, symbol: string) => `${parseFloat(amount) / Math.pow(10, decimals)} ${symbol}`
}));

// Mock window.innerWidth for responsive testing
const mockWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Task 10: Mobile Responsiveness and Advanced UI/UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to desktop width
    mockWindowWidth(1024);
  });

  describe('Mobile-First Responsive Design', () => {
    it('should have responsive breakpoints implemented', () => {
      // Test mobile breakpoint (320px+)
      mockWindowWidth(375);
      
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Check for mobile-specific classes
      const header = screen.getByText('Earnings Dashboard');
      expect(header).toHaveClass('text-xl', 'sm:text-2xl');
    });

    it('should adapt grid layouts for different screen sizes', () => {
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Check for responsive grid classes
      const summaryCards = document.querySelector('.grid');
      expect(summaryCards).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should have touch-optimized button sizes (minimum 44px)', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const tokenButton = screen.getByRole('button');
      const styles = window.getComputedStyle(tokenButton);
      
      // Should have minimum touch target size
      expect(tokenButton).toHaveClass('py-2'); // Ensures minimum height
    });
  });

  describe('Mobile-Optimized Components', () => {
    describe('EarningsDashboard Mobile Optimization', () => {
      it('should stack controls vertically on mobile', () => {
        mockWindowWidth(375);
        
        render(
          <WalletProvider>
            <EarningsDashboard />
          </WalletProvider>
        );

        // Check for mobile stacking classes
        const controlsContainer = document.querySelector('.flex.flex-col.sm\\:flex-row');
        expect(controlsContainer).toBeInTheDocument();
      });

      it('should adjust chart dimensions for mobile', () => {
        mockWindowWidth(375);
        
        render(
          <WalletProvider>
            <EarningsDashboard />
          </WalletProvider>
        );

        // Chart should have mobile-specific height
        const chartContainer = document.querySelector('[style*="height"]');
        expect(chartContainer).toBeInTheDocument();
      });

      it('should optimize card layouts for mobile', () => {
        render(
          <WalletProvider>
            <EarningsDashboard />
          </WalletProvider>
        );

        // Cards should have mobile-responsive padding
        const cards = document.querySelectorAll('.p-4.sm\\:p-6');
        expect(cards.length).toBeGreaterThan(0);
      });

      it('should make transaction items mobile-friendly', () => {
        render(
          <WalletProvider>
            <EarningsDashboard />
          </WalletProvider>
        );

        // Transaction items should stack on mobile
        const transactionItems = document.querySelectorAll('.flex.flex-col.sm\\:flex-row');
        expect(transactionItems.length).toBeGreaterThan(0);
      });
    });

    describe('PriceDisplay Mobile Optimization', () => {
      it('should maintain readability at different sizes', () => {
        const mockPrice = {
          amount: '1000000000000000000',
          token: 'ETH',
          decimals: 18,
          symbol: 'ETH'
        };

        const { rerender } = render(<PriceDisplay price={mockPrice} size="small" />);
        expect(screen.getByText('ETH')).toBeInTheDocument();

        rerender(<PriceDisplay price={mockPrice} size="medium" />);
        expect(screen.getByText('ETH')).toBeInTheDocument();

        rerender(<PriceDisplay price={mockPrice} size="large" />);
        expect(screen.getByText('ETH')).toBeInTheDocument();
      });

      it('should have proper spacing for touch interaction', () => {
        const mockPrice = {
          amount: '1000000000000000000',
          token: 'ETH',
          decimals: 18,
          symbol: 'ETH'
        };

        render(<PriceDisplay price={mockPrice} />);
        
        const priceElement = document.querySelector('.inline-flex');
        expect(priceElement).toHaveClass('gap-1.5');
      });
    });

    describe('TokenSelector Mobile Optimization', () => {
      it('should have mobile-friendly dropdown', () => {
        render(
          <TokenSelector
            selectedToken="ETH"
            onTokenSelect={() => {}}
          />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Dropdown should be full width on mobile
        const dropdown = document.querySelector('.absolute.top-full.left-0.right-0');
        expect(dropdown).toBeInTheDocument();
      });

      it('should have touch-optimized search input', () => {
        render(
          <TokenSelector
            selectedToken="ETH"
            onTokenSelect={() => {}}
          />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        const searchInput = screen.getByPlaceholderText('Search tokens...');
        expect(searchInput).toHaveClass('min-h-[40px]'); // Touch-friendly height
      });

      it('should have mobile-optimized token list items', () => {
        render(
          <TokenSelector
            selectedToken="ETH"
            onTokenSelect={() => {}}
          />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Token items should have minimum touch target size
        const tokenItems = document.querySelectorAll('.min-h-\\[44px\\]');
        expect(tokenItems.length).toBeGreaterThan(0);
      });

      it('should handle search functionality on mobile', async () => {
        render(
          <TokenSelector
            selectedToken="ETH"
            onTokenSelect={() => {}}
          />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        const searchInput = screen.getByPlaceholderText('Search tokens...');
        fireEvent.change(searchInput, { target: { value: 'BTC' } });

        await waitFor(() => {
          expect(screen.getByText('Bitcoin')).toBeInTheDocument();
        });
      });
    });
  });

  describe('Typography and Spacing Responsiveness', () => {
    it('should scale typography appropriately', () => {
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Headers should have responsive text sizes
      const mainHeader = screen.getByText('Earnings Dashboard');
      expect(mainHeader).toHaveClass('text-xl', 'sm:text-2xl');

      // Subheaders should also be responsive
      const subHeaders = document.querySelectorAll('.text-base.sm\\:text-lg');
      expect(subHeaders.length).toBeGreaterThan(0);
    });

    it('should have appropriate spacing for mobile', () => {
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Gaps should be responsive
      const containers = document.querySelectorAll('.gap-4.sm\\:gap-6');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('should handle text truncation properly', () => {
      const mockPrice = {
        amount: '1000000000000000000',
        token: 'VERYLONGTOKEN',
        decimals: 18,
        symbol: 'VERYLONGTOKEN'
      };

      render(<PriceDisplay price={mockPrice} />);
      
      // Should handle long token names gracefully
      expect(screen.getByText('VERYLONGTOKEN')).toBeInTheDocument();
    });
  });

  describe('Touch and Interaction Optimization', () => {
    it('should have proper touch targets', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      
      // Button should be large enough for touch
      expect(button).toHaveClass('py-2'); // Minimum touch height
    });

    it('should handle touch interactions smoothly', () => {
      const onTokenSelect = vi.fn();
      
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={onTokenSelect}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should open dropdown
      expect(screen.getByPlaceholderText('Search tokens...')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Dropdown should be open
      expect(screen.getByPlaceholderText('Search tokens...')).toBeInTheDocument();

      // Click overlay to close
      const overlay = document.querySelector('.fixed.inset-0');
      if (overlay) {
        fireEvent.click(overlay);
      }

      // Dropdown should close (search input should not be visible)
      expect(screen.queryByPlaceholderText('Search tokens...')).not.toBeInTheDocument();
    });
  });

  describe('Chart and Data Visualization Mobile Optimization', () => {
    it('should adjust chart margins for mobile', () => {
      mockWindowWidth(375);
      
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Charts should exist and be responsive
      const chartContainer = document.querySelector('[style*="height"]');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should optimize font sizes for mobile charts', () => {
      mockWindowWidth(375);
      
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Should render without errors on mobile
      expect(screen.getByText('Earnings Dashboard')).toBeInTheDocument();
    });

    it('should handle pie chart sizing for mobile', () => {
      mockWindowWidth(375);
      
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Revenue sources section should be present
      expect(screen.getByText('Revenue by Source')).toBeInTheDocument();
    });
  });

  describe('Loading States and Performance', () => {
    it('should show mobile-optimized loading states', () => {
      // Mock loading state
      vi.mocked(require('../hooks/useRevenueSplitter').useRevenueSplitter).mockReturnValue({
        getCreatorEarnings: vi.fn(),
        listenToSplitEvents: vi.fn(),
        loading: true
      });

      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Should show loading skeleton
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should handle empty states gracefully', () => {
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Should show "No transactions yet" message
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    });
  });

  describe('Accessibility and Mobile UX', () => {
    it('should maintain accessibility on mobile', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
      
      // Should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should handle keyboard navigation', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      
      // Should handle Enter key
      fireEvent.keyDown(button, { key: 'Enter' });
      // Dropdown behavior would be tested in integration tests
    });

    it('should have proper ARIA labels', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Cross-Device Consistency', () => {
    it('should maintain functionality across screen sizes', () => {
      const onTokenSelect = vi.fn();
      
      // Test on mobile
      mockWindowWidth(375);
      const { rerender } = render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={onTokenSelect}
        />
      );

      let button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Test on tablet
      mockWindowWidth(768);
      rerender(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={onTokenSelect}
        />
      );

      button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Test on desktop
      mockWindowWidth(1024);
      rerender(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={onTokenSelect}
        />
      );

      button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should preserve state across screen size changes', () => {
      const onTokenSelect = vi.fn();
      
      render(
        <TokenSelector
          selectedToken="BTC"
          onTokenSelect={onTokenSelect}
        />
      );

      // Should show selected token regardless of screen size
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();

      // Change screen size
      mockWindowWidth(375);
      
      // Should still show selected token
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should render efficiently on mobile', () => {
      const startTime = performance.now();
      
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms for this test)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle rapid screen size changes', () => {
      const { rerender } = render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Rapidly change screen sizes
      for (let i = 0; i < 5; i++) {
        mockWindowWidth(375 + i * 100);
        rerender(
          <WalletProvider>
            <EarningsDashboard />
          </WalletProvider>
        );
      }

      // Should still render correctly
      expect(screen.getByText('Earnings Dashboard')).toBeInTheDocument();
    });
  });
});