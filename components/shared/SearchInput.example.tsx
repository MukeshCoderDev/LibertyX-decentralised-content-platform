/**
 * Example usage of the SearchInput component
 * This file demonstrates how to use the enhanced search input
 */

import React, { useState } from 'react';
import { SearchInput, SimpleSearchInput, useSearchHistory, useSearchSuggestions } from './SearchInput';

export const SearchInputExamples: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { recentSearches, addSearch, clearHistory } = useSearchHistory(10);

  // Mock trending searches
  const trendingSearches = [
    'NFT collections',
    'crypto art',
    'gaming videos',
    'DeFi tutorials',
    'blockchain news',
  ];

  // Mock search suggestions
  const allSuggestions = [
    'videos about crypto',
    'creators in gaming',
    'NFT marketplace',
    'DeFi protocols',
    'blockchain tutorials',
    'crypto trading',
    'NFT art collections',
    'gaming streamers',
  ];

  const filteredSuggestions = useSearchSuggestions(searchQuery, allSuggestions);

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    setSearchQuery(query);
    if (query.trim()) {
      addSearch(query);
    }
  };

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="p-8 space-y-8 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">SearchInput Component Examples</h1>

      {/* Basic Search Input */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Basic Enhanced Search</h2>
        <div className="space-y-4">
          <SearchInput
            onSearch={handleSearch}
            placeholder="Search videos, creators, NFTs…"
            className="max-w-md"
          />
          <p className="text-sm text-gray-400">
            Notice the descriptive placeholder text instead of generic "Type here to search"
          </p>
        </div>
      </section>

      {/* Search with Filters */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Search with Filters</h2>
        <div className="space-y-4">
          <SearchInput
            onSearch={handleSearch}
            onFilterToggle={handleFilterToggle}
            showFilters={true}
            className="max-w-md"
          />
          {showFilters && (
            <div className="max-w-md p-4 bg-gray-800 rounded-lg">
              <h3 className="font-medium mb-2">Filters</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Videos only</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Verified creators</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">NFT content</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Search with Suggestions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Search with Trending & Recent</h2>
        <div className="space-y-4">
          <SearchInput
            onSearch={handleSearch}
            showTrending={true}
            recentSearches={recentSearches}
            trendingSearches={trendingSearches}
            className="max-w-md"
          />
          <div className="flex gap-4">
            <div>
              <h4 className="font-medium mb-2">Recent Searches:</h4>
              <div className="text-sm text-gray-400">
                {recentSearches.length > 0 ? (
                  <ul className="space-y-1">
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <li key={index}>• {search}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No recent searches</p>
                )}
              </div>
            </div>
            <div>
              <button
                onClick={clearHistory}
                className="text-sm text-primary hover:underline"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Size Variants */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Size Variants</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Small</h3>
            <SearchInput
              onSearch={handleSearch}
              size="small"
              className="max-w-sm"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Medium (Default)</h3>
            <SearchInput
              onSearch={handleSearch}
              size="medium"
              className="max-w-md"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Large</h3>
            <SearchInput
              onSearch={handleSearch}
              size="large"
              className="max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* Simple Search Input */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Simple Search Input</h2>
        <div className="space-y-4">
          <SimpleSearchInput
            onSearch={handleSearch}
            className="max-w-md"
          />
          <p className="text-sm text-gray-400">
            Simplified version without filters or suggestions
          </p>
        </div>
      </section>

      {/* Custom Placeholder */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Custom Placeholder</h2>
        <div className="space-y-4">
          <SearchInput
            onSearch={handleSearch}
            placeholder="Find your favorite content creators..."
            className="max-w-md"
          />
          <SearchInput
            onSearch={handleSearch}
            placeholder="Search NFT collections and digital art..."
            className="max-w-md"
          />
        </div>
      </section>

      {/* Auto Focus Example */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Auto Focus</h2>
        <div className="space-y-4">
          <SearchInput
            onSearch={handleSearch}
            autoFocus={true}
            placeholder="This input is auto-focused"
            className="max-w-md"
          />
          <p className="text-sm text-gray-400">
            Useful for search pages or modal dialogs
          </p>
        </div>
      </section>

      {/* Debounce Demo */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Debounce Settings</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Fast (100ms debounce)</h3>
            <SearchInput
              onSearch={(query) => console.log('Fast search:', query)}
              debounceMs={100}
              placeholder="Fast search response..."
              className="max-w-md"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Slow (1000ms debounce)</h3>
            <SearchInput
              onSearch={(query) => console.log('Slow search:', query)}
              debounceMs={1000}
              placeholder="Slower search response..."
              className="max-w-md"
            />
          </div>
        </div>
      </section>

      {/* Integration Example */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Integration Example</h2>
        <SearchIntegrationExample />
      </section>
    </div>
  );
};

const SearchIntegrationExample: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock search results
  const mockResults = [
    'Crypto Trading Basics - Creator: CryptoGuru',
    'NFT Art Collection - Creator: DigitalArtist',
    'DeFi Explained - Creator: BlockchainTeacher',
    'Gaming Highlights - Creator: ProGamer',
    'Tech Reviews - Creator: TechExpert',
  ];

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const filtered = mockResults.filter(result =>
        result.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-4">
      <SearchInput
        onSearch={handleSearch}
        showFilters={true}
        onFilterToggle={() => console.log('Toggle filters')}
        className="max-w-lg"
      />
      
      <div className="max-w-lg">
        {query && (
          <div className="mb-4">
            <h4 className="font-medium">
              {isLoading ? 'Searching...' : `Results for "${query}"`}
            </h4>
          </div>
        )}
        
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <p className="text-sm">{result}</p>
              </div>
            ))}
            {query && results.length === 0 && !isLoading && (
              <p className="text-gray-400 text-sm">No results found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInputExamples;