import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../components/Header';
import { Page } from '../types';

// Mock the WalletProvider
vi.mock('../lib/WalletProvider', () => ({
  useWallet: () => ({
    account: '0x1234567890123456789012345678901234567890',
    chainId: 1,
    currentChain: {
      name: 'Ethereum',
      nativeCurrency: { symbol: 'ETH' }
    },
    balance: [
      { symbol: 'LIB', amount: '100.50' },
      { symbol: 'ETH', amount: '2.5' }
    ],
    isConnected: true,
    isConnecting: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    switchNetwork: vi.fn(),
    error: null
  }),
  WalletType: {
    MetaMask: 'metamask'
  }
}));

// Mock the components
vi.mock('../components/icons/Logo', () => ({
  default: () => <div data-testid="logo">Logo</div>
}));

vi.mock('../components/StableBalanceDisplay', () => ({
  StableBalanceDisplay: ({ tokenSymbol }: any) => (
    <span data-testid={`balance-${tokenSymbol}`}>{tokenSymbol} Balance</span>
  )
}));

vi.mock('../components/ui/NetworkBadge', () => ({
  NetworkBadge: ({ networkName }: any) => (
    <div data-testid="network-badge">{networkName}</div>
  ),
  NetworkStatus: ({ networkName }: any) => (
    <div data-testid="network-status">{networkName}</div>
  )
}));

vi.mock('../utils/formatters', () => ({
  formatToken: (amount: string, symbol: string) => `${amount} ${symbol}`,
  shortenAddress: (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
}));

vi.mock('../lib/blockchainConfig', () => ({
  SUPPORTED_CHAINS: [
    { chainId: 1, name: 'Ethereum' },
    { chainId: 56, name: 'BSC' }
  ]
}));

describe('Header Navigation Active States', () => {
  const mockProps = {
    onNavigate: vi.fn(),
    onOpenRegistrationModal: vi.fn(),
    currentPage: Page.Explore
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show active state styling for current page in desktop navigation', () => {
    render(<Header {...mockProps} currentPage={Page.Explore} />);
    
    // Get the desktop navigation button specifically
    const navButtons = screen.getAllByRole('button');
    const desktopExploreButton = navButtons.find(button => 
      button.textContent === 'Explore' && 
      button.className.includes('font-satoshi text-lg')
    );
    
    expect(desktopExploreButton).toBeDefined();
    if (desktopExploreButton) {
      // Check if it has active state classes
      expect(desktopExploreButton).toHaveClass('text-primary');
      expect(desktopExploreButton).toHaveClass('bg-primary/10');
      expect(desktopExploreButton).toHaveClass('shadow-sm');
    }
  });

  it('should not show active state styling for non-current pages in desktop navigation', () => {
    render(<Header {...mockProps} currentPage={Page.Explore} />);
    
    // Get the desktop navigation button specifically
    const navButtons = screen.getAllByRole('button');
    const desktopUploadButton = navButtons.find(button => 
      button.textContent === 'Upload' && 
      button.className.includes('font-satoshi text-lg')
    );
    
    expect(desktopUploadButton).toBeDefined();
    if (desktopUploadButton) {
      // Check if it has inactive state classes
      expect(desktopUploadButton).toHaveClass('text-text-secondary');
      expect(desktopUploadButton).not.toHaveClass('text-primary');
      expect(desktopUploadButton).not.toHaveClass('bg-primary/10');
    }
  });

  it('should update active states when navigation changes', () => {
    const { rerender } = render(<Header {...mockProps} currentPage={Page.Explore} />);
    
    // Get desktop navigation buttons specifically
    let navButtons = screen.getAllByRole('button');
    let desktopExploreButton = navButtons.find(button => 
      button.textContent === 'Explore' && 
      button.className.includes('font-satoshi text-lg')
    );
    let desktopUploadButton = navButtons.find(button => 
      button.textContent === 'Upload' && 
      button.className.includes('font-satoshi text-lg')
    );
    
    expect(desktopExploreButton).toBeDefined();
    expect(desktopUploadButton).toBeDefined();
    
    if (desktopExploreButton && desktopUploadButton) {
      // Initially Explore should be active
      expect(desktopExploreButton).toHaveClass('text-primary');
      expect(desktopUploadButton).toHaveClass('text-text-secondary');
      
      // Change current page to Upload
      rerender(<Header {...mockProps} currentPage={Page.Upload} />);
      
      // Get buttons again after rerender
      navButtons = screen.getAllByRole('button');
      desktopExploreButton = navButtons.find(button => 
        button.textContent === 'Explore' && 
        button.className.includes('font-satoshi text-lg')
      );
      desktopUploadButton = navButtons.find(button => 
        button.textContent === 'Upload' && 
        button.className.includes('font-satoshi text-lg')
      );
      
      // Now Upload should be active and Explore inactive
      if (desktopUploadButton && desktopExploreButton) {
        expect(desktopUploadButton).toHaveClass('text-primary');
        expect(desktopExploreButton).toHaveClass('text-text-secondary');
      }
    }
  });

  it('should show active state styling for current page in mobile navigation', () => {
    render(<Header {...mockProps} currentPage={Page.Dashboard} />);
    
    // Find mobile navigation buttons (they have different classes than desktop)
    const navButtons = screen.getAllByRole('button');
    const mobileButtons = navButtons.filter(button => 
      button.className.includes('flex flex-col items-center') &&
      button.textContent?.includes('Dashboard')
    );
    
    expect(mobileButtons.length).toBeGreaterThan(0);
    const dashboardButton = mobileButtons[0];
    
    expect(dashboardButton).toHaveClass('text-primary');
    expect(dashboardButton).toHaveClass('bg-primary/15');
    expect(dashboardButton).toHaveClass('scale-105');
  });

  it('should call onNavigate when navigation items are clicked', () => {
    render(<Header {...mockProps} />);
    
    // Get the desktop navigation button specifically
    const navButtons = screen.getAllByRole('button');
    const desktopUploadButton = navButtons.find(button => 
      button.textContent === 'Upload' && 
      button.className.includes('font-satoshi text-lg')
    );
    
    expect(desktopUploadButton).toBeDefined();
    if (desktopUploadButton) {
      fireEvent.click(desktopUploadButton);
      expect(mockProps.onNavigate).toHaveBeenCalledWith(Page.Upload);
    }
  });

  it('should show consistent active state styling across all navigation items', () => {
    const pages = [Page.Explore, Page.Upload, Page.Dashboard, Page.CreatorProfile, Page.Governance];
    
    pages.forEach(page => {
      const { rerender } = render(<Header {...mockProps} currentPage={page} />);
      
      // Find the active navigation button
      const navButtons = screen.getAllByRole('button');
      const activeButton = navButtons.find(button => 
        button.classList.contains('text-primary') && 
        button.classList.contains('bg-primary/10')
      );
      
      expect(activeButton).toBeDefined();
      if (activeButton) {
        // Check for consistent active state classes
        expect(activeButton).toHaveClass('text-primary');
        expect(activeButton).toHaveClass('bg-primary/10');
        expect(activeButton).toHaveClass('shadow-sm');
      }
      
      rerender(<div />); // Clean up
    });
  });

  it('should have hover states for inactive navigation items', () => {
    render(<Header {...mockProps} currentPage={Page.Explore} />);
    
    // Get the desktop navigation button specifically
    const navButtons = screen.getAllByRole('button');
    const desktopUploadButton = navButtons.find(button => 
      button.textContent === 'Upload' && 
      button.className.includes('font-satoshi text-lg')
    );
    
    expect(desktopUploadButton).toBeDefined();
    if (desktopUploadButton) {
      // Check for hover state classes
      expect(desktopUploadButton).toHaveClass('hover:text-white');
      expect(desktopUploadButton).toHaveClass('hover:bg-white/5');
    }
  });

  it('should show underline indicator for active desktop navigation', () => {
    render(<Header {...mockProps} currentPage={Page.Explore} />);
    
    // Get the desktop navigation button specifically
    const navButtons = screen.getAllByRole('button');
    const desktopExploreButton = navButtons.find(button => 
      button.textContent === 'Explore' && 
      button.className.includes('font-satoshi text-lg')
    );
    
    expect(desktopExploreButton).toBeDefined();
    if (desktopExploreButton) {
      // Check for after pseudo-element classes that create the underline
      const className = desktopExploreButton.className;
      expect(className).toContain('after:absolute');
      expect(className).toContain('after:bottom-[-8px]');
      expect(className).toContain('after:bg-primary');
      expect(className).toContain('after:rounded-full');
    }
  });

  it('should show top indicator for active mobile navigation', () => {
    render(<Header {...mockProps} currentPage={Page.Dashboard} />);
    
    // Find mobile navigation buttons (they have different classes than desktop)
    const navButtons = screen.getAllByRole('button');
    const mobileButtons = navButtons.filter(button => 
      button.className.includes('flex flex-col items-center') &&
      button.textContent?.includes('Dashboard')
    );
    
    expect(mobileButtons.length).toBeGreaterThan(0);
    const dashboardButton = mobileButtons[0];
    
    const className = dashboardButton.className;
    expect(className).toContain('after:absolute');
    expect(className).toContain('after:top-0');
    expect(className).toContain('after:bg-primary');
    expect(className).toContain('after:rounded-full');
  });
});

describe('Header Navigation Accessibility', () => {
  const mockProps = {
    onNavigate: vi.fn(),
    onOpenRegistrationModal: vi.fn(),
    currentPage: Page.Explore
  };

  it('should have proper button roles for navigation items', () => {
    render(<Header {...mockProps} />);
    
    const navButtons = screen.getAllByRole('button');
    const navigationButtons = navButtons.filter(button => 
      ['Explore', 'Upload', 'Dashboard', 'Creator Profile', 'Governance'].includes(button.textContent || '')
    );
    
    expect(navigationButtons.length).toBeGreaterThan(0);
    navigationButtons.forEach(button => {
      expect(button).toBeInTheDocument();
      // HTML buttons don't have type="button" by default, they are buttons by nature
      expect(button.tagName).toBe('BUTTON');
    });
  });

  it('should maintain focus states for keyboard navigation', () => {
    render(<Header {...mockProps} />);
    
    // Get the desktop navigation button specifically
    const navButtons = screen.getAllByRole('button');
    const desktopExploreButton = navButtons.find(button => 
      button.textContent === 'Explore' && 
      button.className.includes('font-satoshi text-lg')
    );
    
    expect(desktopExploreButton).toBeDefined();
    if (desktopExploreButton) {
      // Focus the button
      desktopExploreButton.focus();
      expect(desktopExploreButton).toHaveFocus();
    }
  });
});