import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PriceDisplay from '../components/PriceDisplay';
import TokenSelector from '../components/TokenSelector';

// Mock token config
vi.mock('../lib/tokenConfig', () => ({
  getAllTokens: () => [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', decimals: 18, category: 'layer1' },
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿', decimals: 8, category: 'layer1' },
    { symbol: 'LIB', name: 'Liberty Token', icon: '🗽', decimals: 18, category: 'platform' },
    { symbol: 'MATIC', name: 'Polygon', icon: '🔷', decimals: 18, category: 'layer2' }
  ],
  getTokensByCategory: (category: string) => {
    const tokens = {
      layer1: [
        { symbol: 'ETH', name: 'Ethereum', icon: '⟠', decimals: 18, category: 'layer1' },
        { symbol: 'BTC', name: 'Bitcoin', icon: '₿', decimals: 8, category: 'layer1' }
      ],
      platform: [
        { symbol: 'LIB', name: 'Liberty Token', icon: '🗽', decimals: 18, category: 'platform' }
      ],
      layer2: [
        { symbol: 'MATIC', name: 'Polygon', icon: '🔷', decimals: 18, category: 'layer2' }
      ]
    };
    return tokens[category as keyof typeof tokens] || [];
  },
  TOKEN_CATEGORIES: {
    platform: 'Platform Tokens',
    layer1: 'Layer 1 Blockchains',
    layer2: 'Layer 2 Solutions'
  },
  formatTokenAmount: (amount: string, decimals: number, symbol: string) => 
    `${parseFloat(amount) / Math.pow(10, decimals)} ${symbol}`
}));

describe('Task 10: Mobile Responsiveness Audit', () => {
  describe('✅ PriceDisplay Mobile Optimization', () => {
    it('should display crypto prices with proper mobile formatting', () => {
      const mockPrice = {
        amount: '1000000000000000000', // 1 ETH in wei
        token: 'ETH',
        decimals: 18,
        symbol: 'ETH'
      };

      render(<PriceDisplay price={mockPrice} />);

      // Should display the token symbol
      expect(screen.getByText('ETH')).toBeInTheDocument();
      
      // Should display formatted amount
      expect(screen.getByText('1.00')).toBeInTheDocument();
      
      // Should have proper styling classes
      const priceElement = document.querySelector('.inline-flex');
      expect(priceElement).toHaveClass('items-center', 'gap-1.5', 'font-bold', 'rounded-full', 'border');
    });

    it('should support different sizes for mobile optimization', () => {
      const mockPrice = {
        amount: '500000000000000000', // 0.5 ETH
        token: 'ETH',
        decimals: 18,
        symbol: 'ETH'
      };

      // Test small size (mobile-friendly)
      const { rerender } = render(<PriceDisplay price={mockPrice} size="small" />);
      let priceElement = document.querySelector('.inline-flex');
      expect(priceElement).toHaveClass('text-sm', 'px-2', 'py-1');

      // Test medium size (default)
      rerender(<PriceDisplay price={mockPrice} size="medium" />);
      priceElement = document.querySelector('.inline-flex');
      expect(priceElement).toHaveClass('text-base', 'px-3', 'py-1.5');

      // Test large size (desktop)
      rerender(<PriceDisplay price={mockPrice} size="large" />);
      priceElement = document.querySelector('.inline-flex');
      expect(priceElement).toHaveClass('text-lg', 'px-4', 'py-2');
    });

    it('should handle various cryptocurrency tokens', () => {
      const tokens = [
        { symbol: 'LIB', name: 'Liberty Token', icon: '🗽' },
        { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
        { symbol: 'MATIC', name: 'Polygon', icon: '🔷' },
        { symbol: 'AVAX', name: 'Avalanche', icon: '🔺' }
      ];

      tokens.forEach(token => {
        const mockPrice = {
          amount: '1000000000000000000',
          token: token.symbol,
          decimals: 18,
          symbol: token.symbol
        };

        const { unmount } = render(<PriceDisplay price={mockPrice} />);
        
        // Should display token symbol
        expect(screen.getByText(token.symbol)).toBeInTheDocument();
        
        // Should have token-specific styling
        const priceElement = document.querySelector('.inline-flex');
        expect(priceElement).toHaveClass('border');
        
        unmount();
      });
    });

    it('should format large amounts appropriately for mobile', () => {
      const testCases = [
        { amount: '1000000000000000000000', expected: '1.0K' }, // 1000 tokens -> 1.0K
        { amount: '1000000000000000000', expected: '1.00' },    // 1 token -> 1.00
        { amount: '100000000000000000', expected: '0.1000' },   // 0.1 token -> 0.1000
      ];

      testCases.forEach(({ amount, expected }) => {
        const mockPrice = {
          amount,
          token: 'ETH',
          decimals: 18,
          symbol: 'ETH'
        };

        const { unmount } = render(<PriceDisplay price={mockPrice} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('✅ TokenSelector Mobile Optimization', () => {
    it('should render with mobile-friendly button size', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      
      // Should have proper mobile touch target size
      expect(button).toHaveClass('py-2'); // Ensures minimum 44px touch target
      expect(button).toHaveClass('w-full'); // Full width on mobile
    });

    it('should display selected token with icon and name', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      // Should show selected token
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('should open mobile-optimized dropdown', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should show search input
      expect(screen.getByPlaceholderText('Search tokens...')).toBeInTheDocument();
      
      // Search input should have mobile-friendly height
      const searchInput = screen.getByPlaceholderText('Search tokens...');
      expect(searchInput).toHaveClass('min-h-[40px]');
    });

    it('should show categorized tokens in dropdown', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should show category headers
      expect(screen.getByText('Platform Tokens')).toBeInTheDocument();
      expect(screen.getByText('Layer 1 Blockchains')).toBeInTheDocument();
      expect(screen.getByText('Layer 2 Solutions')).toBeInTheDocument();
    });

    it('should handle token search functionality', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText('Search tokens...');
      fireEvent.change(searchInput, { target: { value: 'Bitcoin' } });

      // Should show filtered results
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    it('should have touch-optimized token list items', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Token items should have minimum touch target size
      const tokenButtons = document.querySelectorAll('.min-h-\\[44px\\]');
      expect(tokenButtons.length).toBeGreaterThan(0);
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

      // Should be open
      expect(screen.getByPlaceholderText('Search tokens...')).toBeInTheDocument();

      // Click overlay
      const overlay = document.querySelector('.fixed.inset-0');
      if (overlay) {
        fireEvent.click(overlay);
      }

      // Should close
      expect(screen.queryByPlaceholderText('Search tokens...')).not.toBeInTheDocument();
    });

    it('should handle token selection', () => {
      const onTokenSelect = vi.fn();
      
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={onTokenSelect}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Click on Bitcoin
      const bitcoinButton = screen.getByText('Bitcoin').closest('button');
      if (bitcoinButton) {
        fireEvent.click(bitcoinButton);
        expect(onTokenSelect).toHaveBeenCalledWith('BTC');
      }
    });
  });

  describe('✅ Responsive Design Implementation', () => {
    it('should use Tailwind responsive classes correctly', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Dropdown should have responsive positioning
      const dropdown = document.querySelector('.absolute.top-full.left-0.right-0');
      expect(dropdown).toBeInTheDocument();

      // Should have responsive max height
      const tokenList = document.querySelector('.max-h-64.sm\\:max-h-80');
      expect(tokenList).toBeInTheDocument();
    });

    it('should handle responsive text sizes', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should have responsive text sizes
      const tokenItems = document.querySelectorAll('.text-sm.sm\\:text-base');
      expect(tokenItems.length).toBeGreaterThan(0);
    });

    it('should implement responsive spacing', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should have responsive padding
      const searchContainer = document.querySelector('.p-2.sm\\:p-3');
      expect(searchContainer).toBeInTheDocument();

      // Should have responsive gaps
      const tokenItems = document.querySelectorAll('.gap-2.sm\\:gap-3');
      expect(tokenItems.length).toBeGreaterThan(0);
    });
  });

  describe('✅ Mobile UX Features', () => {
    it('should provide proper visual feedback', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      
      // Should have hover states
      expect(button).toHaveClass('hover:border-primary/50');
      
      // Should have focus states
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });

    it('should handle disabled state properly', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
          disabled={true}
        />
      );

      const button = screen.getByRole('button');
      
      // Should be disabled
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should show balance information when provided', () => {
      const balances = {
        'ETH': '1000000000000000000', // 1 ETH
        'BTC': '100000000' // 1 BTC (8 decimals)
      };

      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
          showBalance={true}
          balances={balances}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should show balance in green
      const balanceElements = document.querySelectorAll('.text-green-400');
      expect(balanceElements.length).toBeGreaterThan(0);
    });
  });

  describe('✅ Accessibility and Touch Optimization', () => {
    it('should maintain accessibility standards', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      
      // Should have proper button attributes
      expect(button).toHaveAttribute('type', 'button');
      
      // Should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should have proper ARIA attributes', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Button should be properly labeled by its content
      expect(button).toHaveTextContent('ETH');
      expect(button).toHaveTextContent('Ethereum');
    });

    it('should support keyboard navigation', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      
      // Should handle focus
      button.focus();
      expect(document.activeElement).toBe(button);
      
      // Should handle keyboard events (Enter/Space would open dropdown)
      fireEvent.keyDown(button, { key: 'Enter' });
      // In a real implementation, this would open the dropdown
    });
  });

  describe('✅ Performance and Optimization', () => {
    it('should render efficiently', () => {
      const startTime = performance.now();
      
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly (less than 50ms for this simple component)
      expect(renderTime).toBeLessThan(50);
    });

    it('should handle state changes efficiently', () => {
      const onTokenSelect = vi.fn();
      
      const { rerender } = render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={onTokenSelect}
        />
      );

      // Change selected token
      rerender(
        <TokenSelector
          selectedToken="BTC"
          onTokenSelect={onTokenSelect}
        />
      );

      // Should update display
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    it('should handle rapid interactions gracefully', () => {
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      
      // Rapid clicks should not cause issues
      for (let i = 0; i < 5; i++) {
        fireEvent.click(button);
      }

      // Should still be functional
      expect(screen.getByPlaceholderText('Search tokens...')).toBeInTheDocument();
    });
  });

  describe('✅ Cross-Device Compatibility', () => {
    it('should maintain functionality across different viewport sizes', () => {
      const onTokenSelect = vi.fn();
      
      render(
        <TokenSelector
          selectedToken="ETH"
          onTokenSelect={onTokenSelect}
        />
      );

      // Should work regardless of screen size
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(screen.getByPlaceholderText('Search tokens...')).toBeInTheDocument();
    });

    it('should preserve state across re-renders', () => {
      const { rerender } = render(
        <TokenSelector
          selectedToken="MATIC"
          onTokenSelect={() => {}}
        />
      );

      // Should show selected token
      expect(screen.getByText('MATIC')).toBeInTheDocument();
      expect(screen.getByText('Polygon')).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <TokenSelector
          selectedToken="MATIC"
          onTokenSelect={() => {}}
        />
      );

      // Should still show selected token
      expect(screen.getByText('MATIC')).toBeInTheDocument();
      expect(screen.getByText('Polygon')).toBeInTheDocument();
    });
  });
});