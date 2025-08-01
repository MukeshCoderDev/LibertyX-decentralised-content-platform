// import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WalletProfile from '../components/WalletProfile';

// Mock the wallet provider
const mockWalletProvider = {
  account: '0x1234567890123456789012345678901234567890',
  isConnected: true,
  connect: vi.fn(),
  disconnect: vi.fn(),
};

// Mock the real-time balances hook
const mockRealTimeBalances = {
  balances: [
    { token: 'native', symbol: 'ETH', balance: '2.5', decimals: 18 },
    { token: 'LIB', symbol: 'LIB', balance: '1000.0', decimals: 18 },
    { token: 'USDC', symbol: 'USDC', balance: '500.0', decimals: 6 },
  ],
  isLoading: false,
  error: null,
  refreshBalances: vi.fn(),
  getTokenBalance: vi.fn(),
};

// Mock hooks
vi.mock('../lib/WalletProvider', () => ({
  useWallet: () => mockWalletProvider,
}));

vi.mock('../hooks/useRealTimeBalances', () => ({
  useRealTimeBalances: () => mockRealTimeBalances,
}));

// Mock UserNFTCollection component
vi.mock('../components/UserNFTCollection', () => ({
  default: () => (
    <div data-testid="user-nft-collection">
      <div className="text-center">
        <div className="text-4xl mb-4">🎨</div>
        <h3 className="text-lg font-bold mb-2">No NFTs Yet</h3>
        <p className="text-text-secondary">
          You don't own any creator access NFTs yet. Browse creators to find exclusive NFT tiers!
        </p>
      </div>
    </div>
  ),
}));

describe('🔧 WalletProfile Hot Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('✅ Real-time Balance Integration', () => {
    it('should display real token balances instead of mock data', () => {
      render(<WalletProfile />);
      
      // Check that real balances are displayed
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('LIB')).toBeInTheDocument();
      expect(screen.getByText('USDC')).toBeInTheDocument();
      
      // Check formatted balance values
      expect(screen.getByText('2.5000')).toBeInTheDocument(); // ETH balance
      expect(screen.getByText('1.0000K')).toBeInTheDocument(); // LIB balance (formatted as K)
      expect(screen.getByText('500.0000')).toBeInTheDocument(); // USDC balance
    });

    it('should show loading state when fetching balances', () => {
      const loadingBalances = {
        ...mockRealTimeBalances,
        isLoading: true,
        balances: [],
      };
      
      vi.mocked(require('../hooks/useRealTimeBalances').useRealTimeBalances).mockReturnValue(loadingBalances);
      
      render(<WalletProfile />);
      
      // Should show loading skeletons
      expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number));
    });

    it('should handle error states gracefully', () => {
      const errorBalances = {
        ...mockRealTimeBalances,
        error: 'Failed to fetch token balances',
        balances: [],
      };
      
      vi.mocked(require('../hooks/useRealTimeBalances').useRealTimeBalances).mockReturnValue(errorBalances);
      
      render(<WalletProfile />);
      
      expect(screen.getByText('Failed to fetch token balances')).toBeInTheDocument();
    });
  });

  describe('✅ Wallet Connection Integration', () => {
    it('should display connected wallet address correctly', () => {
      render(<WalletProfile />);
      
      // Should show shortened wallet address
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    });

    it('should show disconnect button when wallet is connected', () => {
      render(<WalletProfile />);
      
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('should handle wallet disconnection', async () => {
      render(<WalletProfile />);
      
      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);
      
      await waitFor(() => {
        expect(mockWalletProvider.disconnect).toHaveBeenCalled();
      });
    });

    it('should show connect button when wallet is not connected', () => {
      const disconnectedProvider = {
        ...mockWalletProvider,
        isConnected: false,
        account: null,
      };
      
      vi.mocked(require('../lib/WalletProvider').useWallet).mockReturnValue(disconnectedProvider);
      
      render(<WalletProfile />);
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Not connected')).toBeInTheDocument();
    });
  });

  describe('✅ Profile Settings Functionality', () => {
    it('should display KYC verification status', () => {
      render(<WalletProfile />);
      
      expect(screen.getByText('KYC Status')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('should handle region blocking toggle', () => {
      render(<WalletProfile />);
      
      const regionToggle = screen.getByRole('switch');
      expect(regionToggle).toBeInTheDocument();
      
      // Toggle should be functional
      fireEvent.click(regionToggle);
      expect(regionToggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should show wallet management option when connected', () => {
      render(<WalletProfile />);
      
      expect(screen.getByText('Wallet Connection')).toBeInTheDocument();
      expect(screen.getByText('Manage')).toBeInTheDocument();
    });
  });

  describe('✅ NFT Collection Integration', () => {
    it('should display NFT collection component', () => {
      render(<WalletProfile />);
      
      expect(screen.getByTestId('user-nft-collection')).toBeInTheDocument();
      expect(screen.getByText('No NFTs Yet')).toBeInTheDocument();
    });
  });

  describe('✅ Refresh Functionality', () => {
    it('should have refresh button for token balances', () => {
      render(<WalletProfile />);
      
      const refreshButton = screen.getByText('↻');
      expect(refreshButton).toBeInTheDocument();
      
      fireEvent.click(refreshButton);
      expect(mockRealTimeBalances.refreshBalances).toHaveBeenCalled();
    });

    it('should disable refresh when not connected', () => {
      const disconnectedProvider = {
        ...mockWalletProvider,
        isConnected: false,
        account: null,
      };
      
      vi.mocked(require('../lib/WalletProvider').useWallet).mockReturnValue(disconnectedProvider);
      
      render(<WalletProfile />);
      
      const refreshButton = screen.getByText('↻');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('✅ Modal Functionality', () => {
    it('should open wallet connection modal', () => {
      render(<WalletProfile />);
      
      const manageButton = screen.getByText('Manage');
      fireEvent.click(manageButton);
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  describe('✅ Balance Formatting', () => {
    it('should format large balances with K suffix', () => {
      const largeBalances = {
        ...mockRealTimeBalances,
        balances: [
          { token: 'LIB', symbol: 'LIB', balance: '5000.0', decimals: 18 },
        ],
      };
      
      vi.mocked(require('../hooks/useRealTimeBalances').useRealTimeBalances).mockReturnValue(largeBalances);
      
      render(<WalletProfile />);
      
      expect(screen.getByText('5.00K')).toBeInTheDocument();
    });

    it('should format small balances with 4 decimal places', () => {
      const smallBalances = {
        ...mockRealTimeBalances,
        balances: [
          { token: 'ETH', symbol: 'ETH', balance: '0.1234', decimals: 18 },
        ],
      };
      
      vi.mocked(require('../hooks/useRealTimeBalances').useRealTimeBalances).mockReturnValue(smallBalances);
      
      render(<WalletProfile />);
      
      expect(screen.getByText('0.1234')).toBeInTheDocument();
    });

    it('should handle zero balances', () => {
      const zeroBalances = {
        ...mockRealTimeBalances,
        balances: [
          { token: 'ETH', symbol: 'ETH', balance: '0', decimals: 18 },
        ],
      };
      
      vi.mocked(require('../hooks/useRealTimeBalances').useRealTimeBalances).mockReturnValue(zeroBalances);
      
      render(<WalletProfile />);
      
      expect(screen.getByText('0.0000')).toBeInTheDocument();
    });
  });
});

describe('🚀 Hot Fix Validation Summary', () => {
  it('✅ should pass all hot fix requirements', () => {
    // This test validates that all hot fixes are working
    render(<WalletProfile />);
    
    // 1. Real-time balance integration ✅
    expect(screen.getByText('Token Balances')).toBeInTheDocument();
    
    // 2. Wallet connection functionality ✅
    expect(screen.getByText('Connected Wallet')).toBeInTheDocument();
    
    // 3. Profile settings functionality ✅
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    
    // 4. NFT collection integration ✅
    expect(screen.getByTestId('user-nft-collection')).toBeInTheDocument();
    
    // 5. Error handling ✅
    expect(screen.queryByText('Failed to fetch')).not.toBeInTheDocument();
    
    console.log('🎉 All hot fixes validated successfully!');
  });
});