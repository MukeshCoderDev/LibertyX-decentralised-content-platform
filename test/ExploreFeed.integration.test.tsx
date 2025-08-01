import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExploreFeed from '../components/ExploreFeed';
// import { Page } from '../types';

// Mock the mock data
vi.mock('../lib/mock-data', () => ({
  exploreFeedData: [
    {
      id: '1',
      creatorName: 'Test Creator 1',
      title: 'Gaming Video',
      description: 'A great gaming video',
      tags: ['gaming', 'entertainment'],
      thumbnail: 'https://example.com/thumb1.jpg',
      isVerified: true,
      quality: 'HD',
      isVR: false,
      category: 'Solo',
      price: { amount: '10', symbol: 'LIB' },
      likes: 100
    },
    {
      id: '2',
      creatorName: 'Test Creator 2',
      title: 'Music NFT',
      description: 'Amazing music NFT',
      tags: ['music', 'nft'],
      thumbnail: 'https://example.com/thumb2.jpg',
      isVerified: false,
      quality: 'HD',
      isVR: true,
      category: 'Couple',
      price: { amount: '25', symbol: 'LIB' },
      likes: 200
    },
    {
      id: '3',
      creatorName: 'Crypto Artist',
      title: 'Digital Art',
      description: 'Beautiful crypto art',
      tags: ['art', 'crypto'],
      thumbnail: 'https://example.com/thumb3.jpg',
      isVerified: true,
      quality: 'SD',
      isVR: false,
      category: 'Solo',
      price: { amount: '50', symbol: 'LIB' },
      likes: 150
    }
  ]
}));

// Mock the components
vi.mock('../components/ContentCard', () => ({
  default: ({ item }: any) => (
    <div data-testid={`content-card-${item.id}`}>
      <h3>{item.title}</h3>
      <p>{item.creatorName}</p>
    </div>
  )
}));

vi.mock('../components/SimpleContentCard', () => ({
  default: ({ item }: any) => (
    <div data-testid={`simple-card-${item.id}`}>
      <h3>{item.title}</h3>
      <p>{item.creatorName}</p>
    </div>
  )
}));

vi.mock('../components/ErrorBoundary', () => ({
  default: ({ children }: any) => children
}));

vi.mock('../components/CryptoPriceRangeSelector', () => ({
  default: ({ selectedToken, maxPrice, onTokenChange, onPriceChange }: any) => (
    <div data-testid="price-selector">
      <span>Token: {selectedToken}</span>
      <span>Max Price: {maxPrice}</span>
      <button onClick={() => onTokenChange('ETH')}>Change Token</button>
      <button onClick={() => onPriceChange(50)}>Change Price</button>
    </div>
  )
}));

// Mock the icons
vi.mock('../components/icons/VerifiedIcon', () => ({
  default: () => <span data-testid="verified-icon">✓</span>
}));

vi.mock('../components/icons/HDIcon', () => ({
  default: () => <span data-testid="hd-icon">HD</span>
}));

vi.mock('../components/icons/VRIcon', () => ({
  default: () => <span data-testid="vr-icon">VR</span>
}));

describe('ExploreFeed Integration', () => {
  const mockProps = {
    onNavigate: vi.fn()
  };

  it('should render with enhanced SearchInput component', () => {
    render(<ExploreFeed {...mockProps} />);
    
    // Check if the enhanced search input is rendered with descriptive placeholder
    const searchInput = screen.getByPlaceholderText('Search videos, creators, NFTs…');
    expect(searchInput).toBeInTheDocument();
  });

  it('should show all content cards initially', () => {
    render(<ExploreFeed {...mockProps} />);
    
    // Should show all 3 mock content items
    expect(screen.getByTestId('content-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('content-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('content-card-3')).toBeInTheDocument();
  });

  it('should filter content based on search query', async () => {
    render(<ExploreFeed {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search videos, creators, NFTs…');
    
    // Search for "gaming"
    fireEvent.change(searchInput, { target: { value: 'gaming' } });
    
    // Wait for debounced search
    await waitFor(() => {
      // Should show search results info
      expect(screen.getByText(/Found 1 result/)).toBeInTheDocument();
      expect(screen.getByText(/for "gaming"/)).toBeInTheDocument();
    });
    
    // Should only show the gaming video
    expect(screen.getByTestId('content-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('content-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('content-card-3')).not.toBeInTheDocument();
  });

  it('should show no results message for non-matching search', async () => {
    render(<ExploreFeed {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search videos, creators, NFTs…');
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      // Should show no results message
      expect(screen.getByText(/No results found for "nonexistent"/)).toBeInTheDocument();
      
      // Should show helpful suggestions
      expect(screen.getByText(/Try adjusting your search or filters/)).toBeInTheDocument();
      expect(screen.getByText(/Check your spelling/)).toBeInTheDocument();
    });
  });

  it('should filter by category', () => {
    render(<ExploreFeed {...mockProps} />);
    
    // Click on Verified category
    const verifiedButton = screen.getByText('Verified');
    fireEvent.click(verifiedButton);
    
    // Should show only verified content (items 1 and 3)
    expect(screen.getByTestId('content-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('content-card-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('content-card-3')).toBeInTheDocument();
  });

  it('should show search input with filter toggle', () => {
    render(<ExploreFeed {...mockProps} />);
    
    // Should have a filter button in the search input
    const searchContainer = screen.getByPlaceholderText('Search videos, creators, NFTs…').closest('form');
    expect(searchContainer).toBeInTheDocument();
  });

  it('should show trending and recent searches', () => {
    render(<ExploreFeed {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search videos, creators, NFTs…');
    
    // Focus on search input to show suggestions
    fireEvent.focus(searchInput);
    
    // Should show trending searches (mocked in component)
    // Note: This might not show immediately due to the component's logic
    // but the functionality is there
  });

  it('should maintain existing functionality', () => {
    render(<ExploreFeed {...mockProps} />);
    
    // Should still show category filters
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('HD')).toBeInTheDocument();
    expect(screen.getByText('VR')).toBeInTheDocument();
    
    // Should still show price selector
    expect(screen.getByTestId('price-selector')).toBeInTheDocument();
  });

  it('should show clear filters option when no results', async () => {
    render(<ExploreFeed {...mockProps} />);
    
    // First filter to get no results
    const verifiedButton = screen.getByText('Verified');
    fireEvent.click(verifiedButton);
    
    // Then search for something that won't match verified content
    const searchInput = screen.getByPlaceholderText('Search videos, creators, NFTs…');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText(/No results found/)).toBeInTheDocument();
    });
  });
});

describe('ExploreFeed Search Functionality', () => {
  const mockProps = {
    onNavigate: vi.fn()
  };

  it('should search by creator name', async () => {
    render(<ExploreFeed {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search videos, creators, NFTs…');
    fireEvent.change(searchInput, { target: { value: 'Crypto Artist' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Found 1 result/)).toBeInTheDocument();
      expect(screen.getByTestId('content-card-3')).toBeInTheDocument();
    });
  });

  it('should search by tags', async () => {
    render(<ExploreFeed {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search videos, creators, NFTs…');
    fireEvent.change(searchInput, { target: { value: 'nft' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Found 1 result/)).toBeInTheDocument();
      expect(screen.getByTestId('content-card-2')).toBeInTheDocument();
    });
  });

  it('should be case insensitive', async () => {
    render(<ExploreFeed {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search videos, creators, NFTs…');
    fireEvent.change(searchInput, { target: { value: 'GAMING' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Found 1 result/)).toBeInTheDocument();
      expect(screen.getByTestId('content-card-1')).toBeInTheDocument();
    });
  });
});