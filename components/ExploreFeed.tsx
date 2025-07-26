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

const categories = ['All', 'Verified', 'HD', 'VR', 'Solo', 'Couple'];

const ExploreFeed: React.FC<NavigationProps> = memo(({ onNavigate }) => {
  const [maxPrice, setMaxPrice] = useState(100);
  const [selectedToken, setSelectedToken] = useState('LIB');
  const [activeCategory, setActiveCategory] = useState('All');
  const [displayedItems, setDisplayedItems] = useState(12); // Show 12 items initially

  // Memoize the filtered data to prevent unnecessary re-renders
  const filteredData = useMemo(() => {
    return exploreFeedData.slice(0, displayedItems);
  }, [displayedItems]);

  // Memoize the load more handler
  const handleLoadMore = useCallback(() => {
    setDisplayedItems(prev => Math.min(prev + 8, exploreFeedData.length));
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 md:mb-0">
      {/* Sticky Filters */}
      <div className="sticky top-20 z-40 bg-background/90 backdrop-blur-sm py-4 mb-8 rounded-xl">
        <div className="flex flex-col gap-4">
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
          <CryptoPriceRangeSelector
            selectedToken={selectedToken}
            maxPrice={maxPrice}
            onTokenChange={setSelectedToken}
            onPriceChange={setMaxPrice}
            className="px-2"
          />
        </div>
      </div>

      {/* Infinite Scroll Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredData.map(item => (
          <ErrorBoundary key={item.id} fallback={
            <SimpleContentCard item={item} onNavigate={onNavigate} />
          }>
            <ContentCard item={item} onNavigate={onNavigate} />
          </ErrorBoundary>
        ))}
      </div>
       {/* Load More - for infinite scroll simulation */}
       {displayedItems < exploreFeedData.length && (
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
