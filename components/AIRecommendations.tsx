import React, { useState, useEffect } from 'react';
import { useAIRecommendations, ContentRecommendation } from '../hooks/useAIRecommendations';
import { useWallet } from '../lib/WalletProvider';
import { NavigationProps } from '../types';
import Button from './ui/Button';

interface AIRecommendationsProps extends NavigationProps {
  category?: string;
  creatorAddress?: string;
  limit?: number;
  showFilters?: boolean;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  onNavigate,
  category,
  creatorAddress,
  limit = 12,
  showFilters = true
}) => {
  const { account } = useWallet();
  const {
    recommendations,
    userPreferences,
    isLoading,
    error,
    getPersonalizedRecommendations,
    getCategoryRecommendations,
    getCreatorRecommendations,
    trackUserInteraction,
    updateUserPreferences
  } = useAIRecommendations();

  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'personalized' | 'trending' | 'newest'>('personalized');
  const [filteredRecommendations, setFilteredRecommendations] = useState<ContentRecommendation[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, [selectedCategory, creatorAddress, account]);

  useEffect(() => {
    applyFilters();
  }, [recommendations, priceFilter, sortBy]);

  const loadRecommendations = async () => {
    if (!account) return;

    try {
      let recs: ContentRecommendation[] = [];
      
      if (creatorAddress) {
        recs = await getCreatorRecommendations(creatorAddress, limit);
      } else if (selectedCategory && selectedCategory !== 'all') {
        recs = await getCategoryRecommendations(selectedCategory, limit);
      } else {
        recs = await getPersonalizedRecommendations(limit);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...recommendations];

    // Apply price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(rec => rec.price.amount === 0);
    } else if (priceFilter === 'premium') {
      filtered = filtered.filter(rec => rec.price.amount > 0);
    }

    // Apply sorting
    switch (sortBy) {
      case 'personalized':
        filtered.sort((a, b) => b.personalizedScore - a.personalizedScore);
        break;
      case 'trending':
        filtered.sort((a, b) => b.trendingScore - a.trendingScore);
        break;
      case 'newest':
        filtered.sort((a, b) => b.contentId - a.contentId); // Assuming higher ID = newer
        break;
    }

    setFilteredRecommendations(filtered);
  };

  const handleContentClick = (recommendation: ContentRecommendation) => {
    // Track interaction
    trackUserInteraction(recommendation.contentId, 'view', {
      category: recommendation.category,
      creator: recommendation.creatorAddress
    });

    // Navigate to content
    onNavigate({ page: 'content', contentId: recommendation.contentId });
  };

  const handleLike = (recommendation: ContentRecommendation, event: React.MouseEvent) => {
    event.stopPropagation();
    trackUserInteraction(recommendation.contentId, 'like', {
      category: recommendation.category
    });
  };

  const handleShare = (recommendation: ContentRecommendation, event: React.MouseEvent) => {
    event.stopPropagation();
    trackUserInteraction(recommendation.contentId, 'share', {
      category: recommendation.category
    });
    
    // Copy link to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/content/${recommendation.contentId}`);
    alert('Link copied to clipboard!');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High Match';
    if (confidence >= 0.7) return 'Good Match';
    return 'Fair Match';
  };

  if (!account) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <div className="text-4xl mb-4">🤖</div>
        <h3 className="text-lg font-medium mb-2">AI-Powered Recommendations</h3>
        <p className="text-text-secondary mb-4">
          Connect your wallet to get personalized content recommendations based on your interests and viewing history.
        </p>
        <Button variant="primary" onClick={() => onNavigate({ page: 'wallet' })}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-satoshi font-bold">
            {creatorAddress ? 'Creator Recommendations' : 
             selectedCategory !== 'all' ? `${selectedCategory} Recommendations` : 
             'Personalized For You'}
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            AI-curated content based on your preferences and behavior
          </p>
        </div>
        
        {!creatorAddress && (
          <Button
            variant="secondary"
            onClick={loadRecommendations}
            disabled={isLoading}
            className="text-sm"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && !creatorAddress && (
        <div className="bg-card p-4 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="DeFi">DeFi</option>
                <option value="NFTs">NFTs</option>
                <option value="Trading">Trading</option>
                <option value="Blockchain">Blockchain</option>
                <option value="Crypto News">Crypto News</option>
                <option value="Education">Education</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Price
              </label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                <option value="all">All Content</option>
                <option value="free">Free Only</option>
                <option value="premium">Premium Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                <option value="personalized">Best Match</option>
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
              <div className="h-48 bg-border"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-border rounded w-3/4"></div>
                <div className="h-3 bg-border rounded w-1/2"></div>
                <div className="h-3 bg-border rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      {!isLoading && filteredRecommendations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecommendations.map((recommendation) => (
            <div
              key={recommendation.contentId}
              onClick={() => handleContentClick(recommendation)}
              className="bg-card rounded-2xl overflow-hidden cursor-pointer hover:transform hover:scale-105 transition-all duration-200 group"
            >
              {/* Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
                <img
                  src={recommendation.thumbnail}
                  alt={recommendation.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/api/placeholder/300/200';
                  }}
                />
                
                {/* Confidence Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-black/70 ${getConfidenceColor(recommendation.confidence)}`}>
                    {getConfidenceLabel(recommendation.confidence)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleLike(recommendation, e)}
                    className="p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
                    title="Like"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleShare(recommendation, e)}
                    className="p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
                    title="Share"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                    {recommendation.category}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {recommendation.confidence >= 0.9 ? '🎯' : 
                     recommendation.confidence >= 0.7 ? '👍' : '💡'}
                  </span>
                </div>

                <h3 className="font-medium text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {recommendation.title}
                </h3>

                <p className="text-sm text-text-secondary mb-3">
                  by {recommendation.creatorName}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-lg">🗽</span>
                    <span className="font-medium text-primary">
                      {recommendation.price.amount === 0 ? 'Free' : 
                       `${recommendation.price.amount} ${recommendation.price.token}`}
                    </span>
                  </div>
                  
                  <div className="text-xs text-text-secondary">
                    {Math.round(recommendation.confidence * 100)}% match
                  </div>
                </div>

                {/* Recommendation Reason */}
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-xs text-text-secondary italic">
                    {recommendation.reason}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {recommendation.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-background/50 text-xs text-text-secondary rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredRecommendations.length === 0 && (
        <div className="bg-card p-8 rounded-2xl text-center">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-lg font-medium mb-2">No Recommendations Yet</h3>
          <p className="text-text-secondary mb-4">
            {selectedCategory !== 'all' 
              ? `No content found in the ${selectedCategory} category with your current filters.`
              : 'Start exploring content to help our AI learn your preferences and provide better recommendations.'
            }
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedCategory('all');
                setPriceFilter('all');
                setSortBy('personalized');
              }}
            >
              Clear Filters
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigate({ page: 'explore' })}
            >
              Explore Content
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;