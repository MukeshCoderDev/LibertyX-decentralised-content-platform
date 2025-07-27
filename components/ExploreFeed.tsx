import React, { useState, memo, useCallback, useMemo } from 'react';
import { Page, NavigationProps } from '../types';
import ContentCard from './ContentCard';
import SimpleContentCard from './SimpleContentCard';
import ErrorBoundary from './ErrorBoundary';
import { exploreFeedData } from '../lib/mock-data';
import VerifiedIcon from './icons/VerifiedIcon';
import HDIcon from './icons/HDIcon';
import VRIcon from './icons/VRIcon';
import CryptoPriceRangeSelector from './CryptoPriceRangeSelector';
import { SearchInput, useSearchHistory } from './shared/SearchInput';

const categories = ['All', 'Verified', 'HD', 'VR', 'Solo', 'Couple'];

const ExploreFeed: React.FC<NavigationProps> = memo(({ onNavigate }) => {
  const [maxPrice, setMaxPrice] = useState(100);
  const [selectedToken, setSelectedToken] = useState('LIB');
  const [activeCategory, setActiveCategory] = useState('All');
  const [displayedItems, setDisplayedItems] = useState(12); // Show 12 items initially
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Search history management
  const { recentSearches, addSearch } = useSearchHistory();

  // Sample trending searches
  const trendingSearches = useMemo(() => [
    'crypto art',
    'gaming videos',
    'music NFTs',
    'educational content',
    'live streams'
  ], []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      addSearch(query);
    }
  }, [addSearch]);

  // Handle filter toggle
  const handleFilterToggle = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Memoize the filtered data to prevent unnecessary re-renders
  const filteredData = useMemo(() => {
    let filtered = exploreFeedData;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.creatorName.toLowerCase().includes(query) ||
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (activeCategory !== 'All') {
      filtered = filtered.filter(item => {
        switch (activeCategory) {
          case 'Verified':
            return item.isVerified;
          case 'HD':
            return item.quality === 'HD';
          case 'VR':
            return item.isVR;
          case 'Solo':
            return item.category === 'Solo';
          case 'Couple':
            return item.category === 'Couple';
          default:
            return true;
        }
      });
    }

    // Apply price filter
    if (maxPrice < 100) {
      filtered = filtered.filter(item => {
        const price = parseFloat(item.price?.amount || '0');
        return price <= maxPrice;
      });
    }

    return filtered.slice(0, displayedItems);
  }, [searchQuery, activeCategory, maxPrice, displayedItems]);

  // Memoize the load more handler
  const handleLoadMore = useCallback(() => {
    setDisplayedItems(prev => Math.min(prev + 8, exploreFeedData.length));
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 md:mb-0">
      {/* Sticky Filters */}
      <div className="sticky top-20 z-40 bg-background/90 backdrop-blur-sm py-4 mb-8 rounded-xl">
        <div className="flex flex-col gap-4">
          {/* Enhanced Search Input */}
          <div className="px-2">
            <SearchInput
              placeholder="Search videos, creators, NFTs…"
              onSearch={handleSearch}
              onFilterToggle={handleFilterToggle}
              showFilters={true}
              showTrending={true}
              recentSearches={recentSearches}
              trendingSearches={trendingSearches}
              size="medium"
              className="w-full"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm font-satoshi font-medium rounded-full transition-colors ${
                  activeCategory === cat ? 'bg-primary text-white' : 'bg-card text-text-secondary hover:bg-opacity-80'
                }`}
              >
                {cat === 'Verified' ? <VerifiedIcon className="w-4 h-4 inline mr-1"/> : null}
                {cat === 'HD' ? <HDIcon className="w-4 h-4 inline mr-1"/> : null}
                {cat === 'VR' ? <VRIcon className="w-4 h-4 inline mr-1"/> : null}
                {cat}
              </button>
            ))}
          </div>

          {/* Price Filter - Show when filters are toggled or always visible */}
          {(showFilters || true) && (
            <CryptoPriceRangeSelector
              selectedToken={selectedToken}
              maxPrice={maxPrice}
              onTokenChange={setSelectedToken}
              onPriceChange={setMaxPrice}
              className="px-2"
            />
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="mb-6 px-2">
          <p className="text-text-secondary text-sm">
            {filteredData.length > 0 
              ? `Found ${filteredData.length} result${filteredData.length === 1 ? '' : 's'} for "${searchQuery}"`
              : `No results found for "${searchQuery}"`
            }
          </p>
          {filteredData.length === 0 && (
            <div className="mt-4 p-6 bg-card rounded-lg text-center">
              <p className="text-text-secondary mb-2">Try adjusting your search or filters:</p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Check your spelling</li>
                <li>• Use different keywords</li>
                <li>• Try broader search terms</li>
                <li>• Clear filters to see more results</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Content Grid */}
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredData.map(item => (
            <ErrorBoundary key={item.id} fallback={
              <SimpleContentCard item={item} onNavigate={onNavigate} />
            }>
              <ContentCard item={item} onNavigate={onNavigate} />
            </ErrorBoundary>
          ))}
        </div>
      ) : !searchQuery && (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">No content matches your current filters</p>
          <button
            onClick={() => {
              setActiveCategory('All');
              setMaxPrice(100);
              setSearchQuery('');
            }}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Load More - for infinite scroll simulation */}
      {!searchQuery && displayedItems < exploreFeedData.length && (
        <div className="text-center mt-12">
          <button 
            onClick={handleLoadMore}
            className="bg-card text-text-secondary px-6 py-3 rounded-full hover:bg-primary hover:text-white transition-colors"
          >
            Load More ({exploreFeedData.length - displayedItems} remaining)
          </button>
        </div>
      )}
    </div>
  );
});

export default ExploreFeed;

// Dummy icon components for filters
const DummyIcon: React.FC<{className?: string}> = ({className}) => <span className={className}></span>;
