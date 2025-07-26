import React, { useState, useEffect } from 'react';
import { useAIRecommendations, TrendingContent } from '../hooks/useAIRecommendations';
import { NavigationProps } from '../types';
import Button from './ui/Button';

interface TrendingDiscoveryProps extends NavigationProps {
  category?: string;
  timeframe?: string;
  limit?: number;
}

const TrendingDiscovery: React.FC<TrendingDiscoveryProps> = ({
  onNavigate,
  category,
  timeframe = '24h',
  limit = 20
}) => {
  const {
    trendingContent,
    isLoading,
    error,
    getTrendingContent,
    trackUserInteraction
  } = useAIRecommendations();

  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadTrendingContent();
  }, [selectedTimeframe, selectedCategory]);

  const loadTrendingContent = async () => {
    try {
      await getTrendingContent(
        selectedCategory === 'all' ? undefined : selectedCategory,
        selectedTimeframe
      );
    } catch (err) {
      console.error('Error loading trending content:', err);
    }
  };

  const handleContentClick = (content: TrendingContent) => {
    trackUserInteraction(content.contentId, 'view', {
      category: content.category,
      source: 'trending'
    });

    onNavigate({ page: 'content', contentId: content.contentId });
  };

  const getTrendIcon = (trendScore: number) => {
    if (trendScore >= 90) return '🔥';
    if (trendScore >= 80) return '📈';
    if (trendScore >= 70) return '⭐';
    return '💡';
  };

  const getTrendColor = (trendScore: number) => {
    if (trendScore >= 90) return 'text-red-400';
    if (trendScore >= 80) return 'text-orange-400';
    if (trendScore >= 70) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const formatGrowth = (growth: number) => {
    return `+${growth.toFixed(1)}%`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case '1h': return 'Last Hour';
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      default: return tf;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-satoshi font-bold flex items-center gap-2">
            <span>🔥</span>
            Trending Now
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Discover what's hot in the crypto content space
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-card rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'
              }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          <Button
            variant="secondary"
            onClick={loadTrendingContent}
            disabled={isLoading}
            className="text-sm"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Timeframe
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

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
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className={viewMode === 'grid' ? 
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : 
          "space-y-4"
        }>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`bg-card rounded-2xl overflow-hidden animate-pulse ${
              viewMode === 'list' ? 'flex items-center p-4 gap-4' : ''
            }`}>
              {viewMode === 'grid' ? (
                <>
                  <div className="h-48 bg-border"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-border rounded w-3/4"></div>
                    <div className="h-3 bg-border rounded w-1/2"></div>
                    <div className="h-3 bg-border rounded w-2/3"></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-16 bg-border rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-border rounded w-3/4"></div>
                    <div className="h-3 bg-border rounded w-1/2"></div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Trending Content */}
      {!isLoading && trendingContent.length > 0 && (
        <>
          {/* Top Trending Banner */}
          {trendingContent.length > 0 && (
            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🔥</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-400 mb-1">
                    #{1} Trending in {getTimeframeLabel(selectedTimeframe)}
                  </h3>
                  <h4 className="font-medium text-white mb-2">
                    {trendingContent[0].title}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>by {trendingContent[0].creatorName}</span>
                    <span>{formatViews(trendingContent[0].views)} views</span>
                    <span className="text-red-400">{formatGrowth(trendingContent[0].growth)} growth</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleContentClick(trendingContent[0])}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Watch Now
                </Button>
              </div>
            </div>
          )}

          {/* Content Grid/List */}
          <div className={viewMode === 'grid' ? 
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : 
            "space-y-4"
          }>
            {trendingContent.slice(1).map((content, index) => (
              <div
                key={content.contentId}
                onClick={() => handleContentClick(content)}
                className={`bg-card rounded-2xl overflow-hidden cursor-pointer hover:transform hover:scale-105 transition-all duration-200 group ${
                  viewMode === 'list' ? 'flex items-center p-4 gap-4' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View */}
                    <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      
                      {/* Rank Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-black/70 text-white text-sm font-bold rounded">
                          #{index + 2}
                        </span>
                      </div>

                      {/* Trend Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded text-sm font-medium bg-black/70 ${getTrendColor(content.trendScore)}`}>
                          {getTrendIcon(content.trendScore)} {content.trendScore}
                        </span>
                      </div>

                      {/* Growth Indicator */}
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-1 bg-green-500/80 text-white text-xs font-medium rounded">
                          {formatGrowth(content.growth)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                          {content.category}
                        </span>
                      </div>

                      <h3 className="font-medium text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {content.title}
                      </h3>

                      <p className="text-sm text-text-secondary mb-3">
                        by {content.creatorName}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">
                          {formatViews(content.views)} views
                        </span>
                        <span className={`font-medium ${getTrendColor(content.trendScore)}`}>
                          Trend: {content.trendScore}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="relative w-24 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded"></div>
                      <div className="absolute top-1 left-1">
                        <span className="px-1 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
                          #{index + 2}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                          {content.category}
                        </span>
                        <span className={`text-xs ${getTrendColor(content.trendScore)}`}>
                          {getTrendIcon(content.trendScore)} {content.trendScore}
                        </span>
                      </div>

                      <h3 className="font-medium text-white mb-1 truncate group-hover:text-primary transition-colors">
                        {content.title}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span>by {content.creatorName}</span>
                        <span>{formatViews(content.views)} views</span>
                        <span className="text-green-400">{formatGrowth(content.growth)}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentClick(content);
                        }}
                        className="text-sm px-4 py-2"
                      >
                        View
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && trendingContent.length === 0 && (
        <div className="bg-card p-8 rounded-2xl text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-medium mb-2">No Trending Content</h3>
          <p className="text-text-secondary mb-4">
            {selectedCategory !== 'all' 
              ? `No trending content found in the ${selectedCategory} category for ${getTimeframeLabel(selectedTimeframe).toLowerCase()}.`
              : `No trending content found for ${getTimeframeLabel(selectedTimeframe).toLowerCase()}.`
            }
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedTimeframe('24h');
              }}
            >
              Reset Filters
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigate({ page: 'explore' })}
            >
              Explore All Content
            </Button>
          </div>
        </div>
      )}

      {/* Trending Stats */}
      {trendingContent.length > 0 && (
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">Trending Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {trendingContent.filter(c => c.trendScore >= 90).length}
              </div>
              <div className="text-sm text-text-secondary">🔥 Hot Trending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {trendingContent.filter(c => c.trendScore >= 80 && c.trendScore < 90).length}
              </div>
              <div className="text-sm text-text-secondary">📈 Rising Fast</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {trendingContent.filter(c => c.trendScore >= 70 && c.trendScore < 80).length}
              </div>
              <div className="text-sm text-text-secondary">⭐ Popular</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingDiscovery;