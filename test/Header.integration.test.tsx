import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../components/Header';
import { Page } from '../types';

// Mock the wallet provider
vi.mock('../lib/WalletProvider', () => ({
  useWallet: () => ({
    account: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4',
    chainId: 1,
    currentChain: {
      name: 'Ethereum',
      chainId: 1,
      nativeCurrency: { symbol: 'ETH' }
    },
    balance: [
      { symbol: 'LIB', balance: '100.5', decimals: 18 },
      { symbol: 'ETH', balance: '2.5', decimals: 18 }
    ],
    isConnected: true,
    isConnecting: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    switchNetwork: vi.fn(),
    error: null
  }),
  WalletType: {
    MetaMask: 'MetaMask'
  }
}));

// Mock the blockchain config
vi.mock('../lib/blockchainConfig', () => ({
  SUPPORTED_CHAINS: [
    { chainId: 1, name: 'Ethereum' },
    { chainId: 137, name: 'Polygon' }
  ]
}));

// Mock the Logo component
vi.mock('../components/icons/Logo', () => ({
  default: () => <div data-testid="logo">Logo</div>
}));

// Mock the StableBalanceDisplay component
vi.mock('../components/StableBalanceDisplay', () => ({
  StableBalanceDisplay: ({ tokenSymbol }: { tokenSymbol: string }) => (
    <span data-testid={`balance-${tokenSymbol}`}>100.5 {tokenSymbol}</span>
  )
}));

describe('Header Integration', () => {
  const mockProps = {
    onNavigate: vi.fn(),
    currentPage: Page.Explore,
    onOpenRegistrationModal: vi.fn()
  };

  it('should render with updated utilities', () => {
    render(<Header {...mockProps} />);
    
    // Check if logo is rendered
    expect(screen.getByTestId('logo')).toBeInTheDocument();
    
    // Check if navigation items are rendered
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should show network status with NetworkStatus component', () => {
    render(<Header {...mockProps} />);
    
    // Check if network name is displayed
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    
    // Check if connection status is shown
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should show shortened wallet address', () => {
    render(<Header {...mockProps} />);
    
    // The address should be shortened using our utility
    // 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4 -> 0x742d…d4d4
    expect(screen.getByText('0x742d…d4d4')).toBeInTheDocument();
  });

  it('should show active navigation state', () => {
    render(<Header {...mockProps} currentPage={Page.Explore} />);
    
    const exploreButton = screen.getByText('Explore');
    expect(exploreButton).toHaveClass('text-primary');
  });

  it('should show balance displays', () => {
    render(<Header {...mockProps} />);
    
    // Check if balance displays are rendered
    expect(screen.getByTestId('balance-LIB')).toBeInTheDocument();
    expect(screen.getByTestId('balance-ETH')).toBeInTheDocument();
  });

  it('should show action buttons when connected', () => {
    render(<Header {...mockProps} />);
    
    expect(screen.getByText('Register as Creator')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });
});

describe('Header Navigation Active States', () => {
  const mockProps = {
    onNavigate: vi.fn(),
    onOpenRegistrationModal: vi.fn()
  };

  it('should show active state for Explore page', () => {
    render(<Header {...mockProps} currentPage={Page.Explore} />);
    
    const exploreButton = screen.getByText('Explore');
    expect(exploreButton).toHaveClass('text-primary');
  });

  it('should show active state for Upload page', () => {
    render(<Header {...mockProps} currentPage={Page.Upload} />);
    
    const uploadButton = screen.getByText('Upload');
    expect(uploadButton).toHaveClass('text-primary');
  });

  it('should show active state for Dashboard page', () => {
    render(<Header {...mockProps} currentPage={Page.Dashboard} />);
    
    const dashboardButton = screen.getByText('Dashboard');
    expect(dashboardButton).toHaveClass('text-primary');
  });

  it('should not show active state for non-current pages', () => {
    render(<Header {...mockProps} currentPage={Page.Explore} />);
    
    const uploadButton = screen.getByText('Upload');
    expect(uploadButton).not.toHaveClass('text-primary');
    expect(uploadButton).toHaveClass('text-text-secondary');
  });
});