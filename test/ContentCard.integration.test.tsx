import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentCard from '../components/ContentCard';
import { Page } from '../types';

// Mock the wallet provider
vi.mock('../lib/WalletProvider', () => ({
  useWallet: () => ({
    account: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4',
    isConnected: true,
    balance: [
      { symbol: 'LIB', balance: '50.5', decimals: 18 }, // Insufficient for 100 LIB subscription
      { symbol: 'ETH', balance: '2.5', decimals: 18 }
    ]
  })
}));

// Mock the hooks
vi.mock('../hooks/useSubscriptionManager', () => ({
  useSubscriptionManager: () => ({
    checkAccess: vi.fn().mockResolvedValue(false)
  })
}));

vi.mock('../hooks/useNFTAccess', () => ({
  useNFTAccess: () => ({
    checkNFTAccess: vi.fn().mockResolvedValue(false)
  })
}));

vi.mock('../hooks/useContractManager', () => ({
  useContractManager: () => ({
    executeTransaction: vi.fn()
  })
}));

// Mock the icons
vi.mock('../components/icons/HeartIcon', () => ({
  default: () => <div data-testid="heart-icon">❤️</div>
}));

describe('ContentCard Integration', () => {
  const mockItem = {
    id: '1',
    thumbnail: 'https://example.com/thumb.jpg',
    creatorName: 'Test Creator',
    creatorAvatar: '', // No avatar to test Identicon
    creatorAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4',
    likes: 100,
    price: {
      amount: '100', // 100 LIB - more than user's 50.5 balance
      token: 'LIB',
      decimals: 18,
      symbol: 'LIB'
    },
    accessLevel: 'subscription' as const,
    nftTierRequired: 2
  };

  const mockProps = {
    item: mockItem,
    onNavigate: vi.fn()
  };

  it('should render with LockBadge component', () => {
    render(<ContentCard {...mockProps} />);
    
    // Should show subscription required badge
    expect(screen.getByText('Subscribe Required')).toBeInTheDocument();
  });

  it('should show Identicon when no creator avatar', () => {
    render(<ContentCard {...mockProps} />);
    
    // Should render identicon since creatorAvatar is empty
    const identicon = screen.getByRole('img', { name: /identicon/i });
    expect(identicon).toBeInTheDocument();
  });

  it('should show disabled Subscribe button with insufficient balance', () => {
    render(<ContentCard {...mockProps} />);
    
    // Should show Subscribe button but disabled due to insufficient balance
    const subscribeButton = screen.getByText('Subscribe Now');
    expect(subscribeButton).toBeInTheDocument();
    expect(subscribeButton).toBeDisabled();
  });

  it('should show LockBadgeText under creator name', () => {
    render(<ContentCard {...mockProps} />);
    
    // Should show subscription required text under creator name
    expect(screen.getByText('Subscription required')).toBeInTheDocument();
  });

  it('should render NFT access correctly', () => {
    const nftItem = {
      ...mockItem,
      accessLevel: 'nft' as const,
      nftTierRequired: 3
    };

    render(<ContentCard {...mockProps} item={nftItem} />);
    
    // Should show NFT tier requirement
    expect(screen.getByText('Need NFT Tier #3')).toBeInTheDocument();
  });

  it('should render premium access correctly', () => {
    const premiumItem = {
      ...mockItem,
      accessLevel: 'premium' as const
    };

    render(<ContentCard {...mockProps} item={premiumItem} />);
    
    // Should show premium requirement
    expect(screen.getByText('Premium Required')).toBeInTheDocument();
    expect(screen.getByText('Get Premium Access')).toBeInTheDocument();
  });

  it('should show creator avatar when available', () => {
    const itemWithAvatar = {
      ...mockItem,
      creatorAvatar: 'https://example.com/avatar.jpg'
    };

    render(<ContentCard {...mockProps} item={itemWithAvatar} />);
    
    // Should show creator avatar instead of identicon
    const avatar = screen.getByAltText('Test Creator');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('should not show access controls for public content', () => {
    const publicItem = {
      ...mockItem,
      accessLevel: 'public' as const
    };

    render(<ContentCard {...mockProps} item={publicItem} />);
    
    // Should not show any access control elements
    expect(screen.queryByText('Subscribe Required')).not.toBeInTheDocument();
    expect(screen.queryByText('Subscription required')).not.toBeInTheDocument();
  });
});

describe('ContentCard Balance Validation', () => {
  const mockItem = {
    id: 1,
    thumbnail: 'https://example.com/thumb.jpg',
    creatorName: 'Test Creator',
    creatorAvatar: '',
    creatorAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4',
    likes: 100,
    isVerified: true,
    isHD: true,
    isVR: false,
    category: 'entertainment',
    price: {
      amount: '25', // 25 LIB - less than user's 50.5 balance
      token: 'LIB',
      decimals: 18,
      symbol: 'LIB'
    },
    accessLevel: 'subscription' as const
  };

  it('should enable Subscribe button with sufficient balance', () => {
    render(<ContentCard item={mockItem} onNavigate={vi.fn()} />);
    
    const subscribeButton = screen.getByText('Subscribe Now');
    expect(subscribeButton).toBeInTheDocument();
    expect(subscribeButton).not.toBeDisabled();
  });
});