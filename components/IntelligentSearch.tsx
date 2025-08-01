import React, { useState, useEffect, useRef } from 'react';
import { useAIRecommendations, SearchSuggestion } from '../hooks/useAIRecommendations';
import { NavigationProps } from '../types';
import Button from './ui/Button';

interface IntelligentSearchProps extends NavigationProps {
  placeholder?: string;
  showFilters?: boolean;
  onSearchResults?: (results: any[]) => void;
}

const IntelligentSearch: React.FC<IntelligentSearchProps> = ({
  onNavigate: _onNavigate,
  placeholder = "Search for content, creators, or topics...",
  showFilters = true,
  onSearchResults
}) => {
  const {
    searchSuggestions,
    getSearchSuggestions,
    getPersonalizedRecommendations,
    getCategoryRecommendations,
    trackUserInteraction
  } = useAIRecommendations();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    category: 'all',
    priceRange: 'all',
    contentType: 'all',
    sortBy: 'relevance'
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load search history from localStorage
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
  }, []);

  useEffect(() => {
    // Debounced search suggestions
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        loadSearchSuggestions();
      }, 300);
    } else {
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const loadSearchSuggestions = async () => {
    try {
      await getSearchSuggestions(query);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } catch (err) {
      console.error('Error loading search suggestions:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (query.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || searchSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    setShowSuggestions(false);
    performSearch(suggestion.query, suggestion.type);
  };

  const handleSearch = () => {
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const performSearch = async (searchQuery: string, suggestionType?: string) => {
    try {
      setIsSearching(true);
      
      // Add to search history
      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      // Track search interaction
      trackUserInteraction(0, 'search', {
        query: searchQuery,
        type: suggestionType,
        filters: searchFilters
      });

      // Perform search based on type
      let results: any[] = [];
      
      if (suggestionType === 'category') {
        results = await getCategoryRecommendations(searchQuery, 20);
      } else {
        // General search - get personalized recommendations and filter
        const allRecommendations = await getPersonalizedRecommendations(50);
        results = allRecommendations.filter(rec => 
          rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      // Apply additional filters
      results = applySearchFilters(results);

      // Call callback if provided
      if (onSearchResults) {
        onSearchResults(results);
      }

      // Navigate to search results page
      // onNavigate({ 
      //   page: 'search-results', 
      //   query: searchQuery,
      //   results 
      // });

    } catch (err) {
      console.error('Error performing search:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const applySearchFilters = (results: any[]) => {
    let filtered = [...results];

    // Category filter
    if (searchFilters.category !== 'all') {
      filtered = filtered.filter(item => item.category === searchFilters.category);
    }

    // Price filter
    if (searchFilters.priceRange !== 'all') {
      switch (searchFilters.priceRange) {
        case 'free':
          filtered = filtered.filter(item => item.price?.amount === 0);
          break;
        case 'low':
          filtered = filtered.filter(item => item.price?.amount > 0 && item.price?.amount <= 10);
          break;
        case 'medium':
          filtered = filtered.filter(item => item.price?.amount > 10 && item.price?.amount <= 50);
          break;
        case 'high':
          filtered = filtered.filter(item => item.price?.amount > 50);
          break;
      }
    }

    // Sort results
    switch (searchFilters.sortBy) {
      case 'relevance':
        // Already sorted by relevance
        break;
      case 'newest':
        filtered.sort((a, b) => b.contentId - a.contentId);
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
        break;
    }

    return filtered;
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'category':
        return '📁';
      case 'creator':
        return '👤';
      case 'tag':
        return '🏷️';
      case 'content':
        return '🎬';
      default:
        return '🔍';
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    performSearch(historyItem);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-card border border-border rounded-2xl pl-12 pr-12 py-4 text-white placeholder-text-secondary focus:border-primary focus:outline-none transition-colors"
          />
          
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Clear Button */}
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Button */}
        <Button
          variant="primary"
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="absolute right-2 top-2 bottom-2 px-6"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* AI Suggestions */}
          {searchSuggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-text-secondary px-3 py-2 font-medium">
                AI Suggestions
              </div>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-background/50 transition-colors flex items-center gap-3 ${
                    index === selectedSuggestionIndex ? 'bg-background/50' : ''
                  }`}
                >
                  <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                  <div className="flex-1">
                    <div className="font-medium">{suggestion.query}</div>
                    <div className="text-xs text-text-secondary capitalize">
                      {suggestion.type} • {Math.round(suggestion.popularity)}% popular
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {Math.round(suggestion.relevance)}% match
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && query.length < 2 && (
            <div className="p-2 border-t border-border/30">
              <div className="text-xs text-text-secondary px-3 py-2 font-medium">
                Recent Searches
              </div>
              {searchHistory.slice(0, 5).map((historyItem, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(historyItem)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-background/50 transition-colors flex items-center gap-3"
                >
                  <span className="text-lg">🕒</span>
                  <span className="flex-1">{historyItem}</span>
                </button>
              ))}
            </div>
          )}

          {/* No Suggestions */}
          {searchSuggestions.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-text-secondary">
              <div className="text-2xl mb-2">🤔</div>
              <p className="text-sm">No suggestions found for "{query}"</p>
              <p className="text-xs mt-1">Try a different search term or browse categories</p>
            </div>
          )}
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 bg-card p-4 rounded-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Category
              </label>
              <select
                value={searchFilters.category}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="all">All</option>
                <option value="DeFi">DeFi</option>
                <option value="NFTs">NFTs</option>
                <option value="Trading">Trading</option>
                <option value="Blockchain">Blockchain</option>
                <option value="Education">Education</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Price Range
              </label>
              <select
                value={searchFilters.priceRange}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="all">All</option>
                <option value="free">Free</option>
                <option value="low">1-10 LIB</option>
                <option value="medium">11-50 LIB</option>
                <option value="high">50+ LIB</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Content Type
              </label>
              <select
                value={searchFilters.contentType}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, contentType: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="article">Articles</option>
                <option value="course">Courses</option>
                <option value="live">Live Streams</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Sort By
              </label>
              <select
                value={searchFilters.sortBy}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentSearch;