import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Filter, TrendingUp, Clock } from 'lucide-react';

export interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilterToggle?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showFilters?: boolean;
  showTrending?: boolean;
  recentSearches?: string[];
  trendingSearches?: string[];
  debounceMs?: number;
  autoFocus?: boolean;
}

/**
 * Enhanced search input component with descriptive placeholder and improved UX
 * Replaces generic "Type here to search" with "Search videos, creators, NFTs…"
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search videos, creators, NFTs…",
  onSearch,
  onFilterToggle,
  className = '',
  size = 'medium',
  showFilters = false,
  showTrending = false,
  recentSearches = [],
  trendingSearches = [],
  debounceMs = 300,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Size configurations
  const sizeClasses = {
    small: {
      container: 'h-8',
      input: 'text-sm px-3 py-1',
      icon: 'w-4 h-4',
      button: 'p-1',
    },
    medium: {
      container: 'h-10',
      input: 'text-sm px-4 py-2',
      icon: 'w-5 h-5',
      button: 'p-2',
    },
    large: {
      container: 'h-12',
      input: 'text-base px-5 py-3',
      icon: 'w-6 h-6',
      button: 'p-2.5',
    },
  };

  const sizeConfig = sizeClasses[size];

  // Debounced search
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);
  }, [onSearch, debounceMs]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearch(query);
    setShowSuggestions(false);
  }, [query, onSearch]);

  // Handle clear
  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }, [onSearch]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (showTrending && (recentSearches.length > 0 || trendingSearches.length > 0)) {
      setShowSuggestions(true);
    }
  }, [showTrending, recentSearches.length, trendingSearches.length]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  // Auto focus effect
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            relative flex items-center ${sizeConfig.container}
            bg-card border border-gray-600 rounded-lg
            transition-all duration-200
            ${isFocused ? 'border-primary ring-2 ring-primary/20' : 'hover:border-gray-500'}
          `}
        >
          {/* Search Icon */}
          <div className={`flex items-center justify-center ${sizeConfig.button} text-gray-400`}>
            <Search className={sizeConfig.icon} />
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`
              flex-1 bg-transparent text-white placeholder-gray-400
              ${sizeConfig.input} pr-0
              focus:outline-none
            `}
            aria-label="Search input"
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className={`
                flex items-center justify-center ${sizeConfig.button}
                text-gray-400 hover:text-white transition-colors
              `}
              aria-label="Clear search"
            >
              <X className={sizeConfig.icon} />
            </button>
          )}

          {/* Filter Button */}
          {showFilters && onFilterToggle && (
            <button
              type="button"
              onClick={onFilterToggle}
              className={`
                flex items-center justify-center ${sizeConfig.button}
                text-gray-400 hover:text-primary transition-colors
                border-l border-gray-600 ml-1
              `}
              aria-label="Toggle filters"
            >
              <Filter className={sizeConfig.icon} />
            </button>
          )}
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (recentSearches.length > 0 || trendingSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Recent Searches</span>
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {trendingSearches.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-300">Trending</span>
              </div>
              <div className="space-y-1">
                {trendingSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Simple search input without suggestions
 */
export const SimpleSearchInput: React.FC<{
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}> = ({ 
  placeholder = "Search videos, creators, NFTs…", 
  onSearch, 
  className = '', 
  size = 'medium' 
}) => {
  return (
    <SearchInput
      placeholder={placeholder}
      onSearch={onSearch}
      className={className}
      size={size}
      showFilters={false}
      showTrending={false}
    />
  );
};

/**
 * Hook for managing search state and history
 */
export const useSearchHistory = (maxItems: number = 10) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== query);
      return [query, ...filtered].slice(0, maxItems);
    });
  }, [maxItems]);

  const clearHistory = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    recentSearches,
    addSearch,
    clearHistory,
  };
};

/**
 * Hook for search suggestions and autocomplete
 */
export const useSearchSuggestions = (
  searchQuery: string,
  suggestions: string[] = []
) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuggestions([]);
      return;
    }

    const filtered = suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 8);

    setFilteredSuggestions(filtered);
  }, [searchQuery, suggestions]);

  return filteredSuggestions;
};

export default SearchInput;