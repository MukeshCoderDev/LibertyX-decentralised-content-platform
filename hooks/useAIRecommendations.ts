import { useState, useCallback, useRef, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from './useContractManager';

export interface UserPreferences {
  categories: string[];
  creators: string[];
  priceRange: {
    min: number;
    max: number;
    token: string;
  };
  contentTypes: string[];
  viewingHistory: ViewingSession[];
  interactionPatterns: InteractionPattern[];
}

export interface ViewingSession {
  contentId: number;
  duration: number;
  completionRate: number;
  timestamp: number;
  liked: boolean;
  shared: boolean;
  subscribed: boolean;
}

export interface InteractionPattern {
  type: 'view' | 'like' | 'share' | 'subscribe' | 'purchase';
  frequency: number;
  timeOfDay: number[];
  dayOfWeek: number[];
  categories: string[];
}

export interface ContentRecommendation {
  contentId: number;
  title: string;
  creatorAddress: string;
  creatorName: string;
  thumbnail: string;
  category: string;
  tags: string[];
  price: {
    amount: number;
    token: string;
  };
  confidence: number;
  reason: string;
  similarityScore: number;
  trendingScore: number;
  personalizedScore: number;
}

export interface TrendingContent {
  contentId: number;
  title: string;
  creatorName: string;
  category: string;
  views: number;
  growth: number;
  trendScore: number;
  timeframe: string;
}

export interface SearchSuggestion {
  query: string;
  type: 'category' | 'creator' | 'tag' | 'content';
  popularity: number;
  relevance: number;
}

interface AIRecommendationsHook {
  recommendations: ContentRecommendation[];
  trendingContent: TrendingContent[];
  searchSuggestions: SearchSuggestion[];
  userPreferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  getPersonalizedRecommendations: (limit?: number) => Promise<ContentRecommendation[]>;
  getTrendingContent: (category?: string, timeframe?: string) => Promise<TrendingContent[]>;
  getSearchSuggestions: (query: string) => Promise<SearchSuggestion[]>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  trackUserInteraction: (contentId: number, interactionType: string, metadata?: any) => void;
  getCategoryRecommendations: (category: string, limit?: number) => Promise<ContentRecommendation[]>;
  getCreatorRecommendations: (creatorAddress: string, limit?: number) => Promise<ContentRecommendation[]>;
  getSimilarContent: (contentId: number, limit?: number) => Promise<ContentRecommendation[]>;
}

const CATEGORIES = [
  'DeFi', 'NFTs', 'Trading', 'Blockchain', 'Crypto News', 'Education',
  'Technical Analysis', 'Market Updates', 'Project Reviews', 'Tutorials'
];

const CONTENT_TYPES = [
  'Video', 'Article', 'Live Stream', 'Podcast', 'Course', 'Analysis'
];

export const useAIRecommendations = (): AIRecommendationsHook => {
  const { account } = useWallet();
  const contractManager = useContractManager();
  
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [trendingContent, setTrendingContent] = useState<TrendingContent[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recommendationCache = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Load user preferences on mount
  useEffect(() => {
    if (account) {
      loadUserPreferences();
    }
  }, [account]);

  const getCachedData = useCallback((key: string) => {
    const cached = recommendationCache.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    recommendationCache.current.set(key, { data, timestamp: Date.now() });
  }, []);

  const loadUserPreferences = useCallback(async () => {
    if (!account) return;

    try {
      // Load from localStorage first
      const stored = localStorage.getItem(`userPreferences_${account}`);
      if (stored) {
        const preferences = JSON.parse(stored);
        setUserPreferences(preferences);
      } else {
        // Initialize default preferences
        const defaultPreferences: UserPreferences = {
          categories: ['DeFi', 'Trading'],
          creators: [],
          priceRange: {
            min: 0,
            max: 100,
            token: 'LIB'
          },
          contentTypes: ['Video', 'Article'],
          viewingHistory: [],
          interactionPatterns: []
        };
        setUserPreferences(defaultPreferences);
        localStorage.setItem(`userPreferences_${account}`, JSON.stringify(defaultPreferences));
      }
    } catch (err) {
      console.error('Error loading user preferences:', err);
    }
  }, [account]);

  const getPersonalizedRecommendations = useCallback(async (
    limit: number = 10
  ): Promise<ContentRecommendation[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const cacheKey = `personalized-${account}-${limit}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        setRecommendations(cached);
        return cached;
      }

      if (!userPreferences) {
        await loadUserPreferences();
      }

      // Simulate AI recommendation algorithm
      const mockRecommendations: ContentRecommendation[] = [
        {
          contentId: 1,
          title: 'Advanced DeFi Yield Strategies 2024',
          creatorAddress: '0x1234567890123456789012345678901234567890',
          creatorName: 'DeFiMaster',
          thumbnail: '/api/placeholder/300/200',
          category: 'DeFi',
          tags: ['yield-farming', 'liquidity-pools', 'advanced'],
          price: { amount: 25.5, token: 'LIB' },
          confidence: 0.92,
          reason: 'Based on your DeFi viewing history and high engagement with yield farming content',
          similarityScore: 0.88,
          trendingScore: 0.75,
          personalizedScore: 0.95
        },
        {
          contentId: 2,
          title: 'NFT Market Analysis: Hidden Gems',
          creatorAddress: '0x2345678901234567890123456789012345678901',
          creatorName: 'NFTAnalyst',
          thumbnail: '/api/placeholder/300/200',
          category: 'NFTs',
          tags: ['market-analysis', 'investment', 'gems'],
          price: { amount: 15.0, token: 'LIB' },
          confidence: 0.85,
          reason: 'Trending in NFT category with high user ratings',
          similarityScore: 0.72,
          trendingScore: 0.90,
          personalizedScore: 0.78
        },
        {
          contentId: 3,
          title: 'Technical Analysis Masterclass',
          creatorAddress: '0x3456789012345678901234567890123456789012',
          creatorName: 'TradingPro',
          thumbnail: '/api/placeholder/300/200',
          category: 'Trading',
          tags: ['technical-analysis', 'charts', 'patterns'],
          price: { amount: 35.0, token: 'LIB' },
          confidence: 0.89,
          reason: 'Matches your trading interests and preferred price range',
          similarityScore: 0.85,
          trendingScore: 0.65,
          personalizedScore: 0.92
        },
        {
          contentId: 4,
          title: 'Blockchain Fundamentals Explained',
          creatorAddress: '0x4567890123456789012345678901234567890123',
          creatorName: 'BlockchainEdu',
          thumbnail: '/api/placeholder/300/200',
          category: 'Education',
          tags: ['fundamentals', 'beginner', 'blockchain'],
          price: { amount: 12.0, token: 'LIB' },
          confidence: 0.76,
          reason: 'Popular educational content in your preferred categories',
          similarityScore: 0.68,
          trendingScore: 0.82,
          personalizedScore: 0.71
        },
        {
          contentId: 5,
          title: 'Crypto Market Weekly Update',
          creatorAddress: '0x5678901234567890123456789012345678901234',
          creatorName: 'MarketInsider',
          thumbnail: '/api/placeholder/300/200',
          category: 'Crypto News',
          tags: ['market-update', 'weekly', 'analysis'],
          price: { amount: 8.0, token: 'LIB' },
          confidence: 0.81,
          reason: 'Fresh content from creators you follow',
          similarityScore: 0.75,
          trendingScore: 0.88,
          personalizedScore: 0.79
        }
      ];

      // Apply personalization based on user preferences
      const personalizedRecommendations = mockRecommendations
        .filter(rec => {
          if (!userPreferences) return true;
          
          // Filter by categories
          if (userPreferences.categories.length > 0 && 
              !userPreferences.categories.includes(rec.category)) {
            return false;
          }
          
          // Filter by price range
          if (rec.price.amount < userPreferences.priceRange.min || 
              rec.price.amount > userPreferences.priceRange.max) {
            return false;
          }
          
          return true;
        })
        .sort((a, b) => b.personalizedScore - a.personalizedScore)
        .slice(0, limit);

      setCachedData(cacheKey, personalizedRecommendations);
      setRecommendations(personalizedRecommendations);
      return personalizedRecommendations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [account, userPreferences, getCachedData, setCachedData, loadUserPreferences]);

  const getTrendingContent = useCallback(async (
    category?: string,
    timeframe: string = '24h'
  ): Promise<TrendingContent[]> => {
    try {
      const cacheKey = `trending-${category || 'all'}-${timeframe}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        setTrendingContent(cached);
        return cached;
      }

      // Simulate trending content algorithm
      const mockTrending: TrendingContent[] = [
        {
          contentId: 10,
          title: 'Bitcoin ETF Approval Impact Analysis',
          creatorName: 'CryptoAnalyst',
          category: 'Crypto News',
          views: 15420,
          growth: 245.8,
          trendScore: 98,
          timeframe
        },
        {
          contentId: 11,
          title: 'Layer 2 Solutions Comparison 2024',
          creatorName: 'TechReviewer',
          category: 'Blockchain',
          views: 12350,
          growth: 189.2,
          trendScore: 94,
          timeframe
        },
        {
          contentId: 12,
          title: 'DeFi Protocol Security Audit',
          creatorName: 'SecurityExpert',
          category: 'DeFi',
          views: 9870,
          growth: 156.7,
          trendScore: 87,
          timeframe
        },
        {
          contentId: 13,
          title: 'NFT Royalties Debate Explained',
          creatorName: 'NFTExplainer',
          category: 'NFTs',
          views: 8540,
          growth: 134.5,
          trendScore: 82,
          timeframe
        },
        {
          contentId: 14,
          title: 'Altcoin Season Predictions',
          creatorName: 'MarketPredictor',
          category: 'Trading',
          views: 7890,
          growth: 123.4,
          trendScore: 79,
          timeframe
        }
      ];

      const filteredTrending = category 
        ? mockTrending.filter(content => content.category === category)
        : mockTrending;

      setCachedData(cacheKey, filteredTrending);
      setTrendingContent(filteredTrending);
      return filteredTrending;
    } catch (err) {
      console.error('Error getting trending content:', err);
      throw err;
    }
  }, [getCachedData, setCachedData]);

  const getSearchSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    try {
      if (query.length < 2) {
        setSearchSuggestions([]);
        return [];
      }

      const cacheKey = `search-${query.toLowerCase()}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        setSearchSuggestions(cached);
        return cached;
      }

      // Simulate intelligent search suggestions
      const allSuggestions: SearchSuggestion[] = [
        // Categories
        ...CATEGORIES.map(cat => ({
          query: cat,
          type: 'category' as const,
          popularity: Math.random() * 100,
          relevance: cat.toLowerCase().includes(query.toLowerCase()) ? 100 : 0
        })),
        // Popular searches
        { query: 'bitcoin price prediction', type: 'content', popularity: 95, relevance: 0 },
        { query: 'ethereum 2.0 staking', type: 'content', popularity: 88, relevance: 0 },
        { query: 'defi yield farming', type: 'content', popularity: 82, relevance: 0 },
        { query: 'nft marketplace guide', type: 'content', popularity: 76, relevance: 0 },
        { query: 'crypto tax guide', type: 'content', popularity: 71, relevance: 0 },
        // Creators
        { query: 'DeFiMaster', type: 'creator', popularity: 65, relevance: 0 },
        { query: 'TradingPro', type: 'creator', popularity: 58, relevance: 0 },
        { query: 'NFTAnalyst', type: 'creator', popularity: 52, relevance: 0 }
      ];

      // Calculate relevance based on query match
      const suggestions = allSuggestions
        .map(suggestion => ({
          ...suggestion,
          relevance: suggestion.query.toLowerCase().includes(query.toLowerCase()) 
            ? 100 - (Math.abs(suggestion.query.length - query.length) * 2)
            : suggestion.relevance
        }))
        .filter(suggestion => suggestion.relevance > 0 || suggestion.popularity > 70)
        .sort((a, b) => (b.relevance + b.popularity) - (a.relevance + a.popularity))
        .slice(0, 8);

      setCachedData(cacheKey, suggestions);
      setSearchSuggestions(suggestions);
      return suggestions;
    } catch (err) {
      console.error('Error getting search suggestions:', err);
      return [];
    }
  }, [getCachedData, setCachedData]);

  const updateUserPreferences = useCallback(async (
    preferences: Partial<UserPreferences>
  ): Promise<void> => {
    try {
      if (!account) throw new Error('No account connected');

      const updatedPreferences = {
        ...userPreferences,
        ...preferences
      } as UserPreferences;

      setUserPreferences(updatedPreferences);
      localStorage.setItem(`userPreferences_${account}`, JSON.stringify(updatedPreferences));

      // Clear recommendation cache to force refresh
      recommendationCache.current.clear();
    } catch (err) {
      console.error('Error updating user preferences:', err);
      throw err;
    }
  }, [account, userPreferences]);

  const trackUserInteraction = useCallback((
    contentId: number,
    interactionType: string,
    metadata?: any
  ) => {
    try {
      if (!account || !userPreferences) return;

      const interaction: ViewingSession = {
        contentId,
        duration: metadata?.duration || 0,
        completionRate: metadata?.completionRate || 0,
        timestamp: Date.now(),
        liked: interactionType === 'like',
        shared: interactionType === 'share',
        subscribed: interactionType === 'subscribe'
      };

      const updatedPreferences = {
        ...userPreferences,
        viewingHistory: [interaction, ...userPreferences.viewingHistory].slice(0, 100) // Keep last 100
      };

      setUserPreferences(updatedPreferences);
      localStorage.setItem(`userPreferences_${account}`, JSON.stringify(updatedPreferences));

      // Update interaction patterns
      updateInteractionPatterns(interactionType, metadata);

      // Clear cache to refresh recommendations
      recommendationCache.current.clear();
    } catch (err) {
      console.error('Error tracking user interaction:', err);
    }
  }, [account, userPreferences]);

  const updateInteractionPatterns = useCallback((
    interactionType: string,
    metadata?: any
  ) => {
    if (!userPreferences) return;

    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    const existingPattern = userPreferences.interactionPatterns.find(
      p => p.type === interactionType as any
    );

    if (existingPattern) {
      existingPattern.frequency += 1;
      if (!existingPattern.timeOfDay.includes(timeOfDay)) {
        existingPattern.timeOfDay.push(timeOfDay);
      }
      if (!existingPattern.dayOfWeek.includes(dayOfWeek)) {
        existingPattern.dayOfWeek.push(dayOfWeek);
      }
    } else {
      const newPattern: InteractionPattern = {
        type: interactionType as any,
        frequency: 1,
        timeOfDay: [timeOfDay],
        dayOfWeek: [dayOfWeek],
        categories: metadata?.category ? [metadata.category] : []
      };
      userPreferences.interactionPatterns.push(newPattern);
    }
  }, [userPreferences]);

  const getCategoryRecommendations = useCallback(async (
    category: string,
    limit: number = 10
  ): Promise<ContentRecommendation[]> => {
    try {
      const allRecommendations = await getPersonalizedRecommendations(50);
      return allRecommendations
        .filter(rec => rec.category === category)
        .slice(0, limit);
    } catch (err) {
      console.error('Error getting category recommendations:', err);
      throw err;
    }
  }, [getPersonalizedRecommendations]);

  const getCreatorRecommendations = useCallback(async (
    creatorAddress: string,
    limit: number = 10
  ): Promise<ContentRecommendation[]> => {
    try {
      const allRecommendations = await getPersonalizedRecommendations(50);
      return allRecommendations
        .filter(rec => rec.creatorAddress.toLowerCase() === creatorAddress.toLowerCase())
        .slice(0, limit);
    } catch (err) {
      console.error('Error getting creator recommendations:', err);
      throw err;
    }
  }, [getPersonalizedRecommendations]);

  const getSimilarContent = useCallback(async (
    contentId: number,
    limit: number = 10
  ): Promise<ContentRecommendation[]> => {
    try {
      // In a real implementation, this would use content similarity algorithms
      const allRecommendations = await getPersonalizedRecommendations(50);
      return allRecommendations
        .filter(rec => rec.contentId !== contentId)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    } catch (err) {
      console.error('Error getting similar content:', err);
      throw err;
    }
  }, [getPersonalizedRecommendations]);

  return {
    recommendations,
    trendingContent,
    searchSuggestions,
    userPreferences,
    isLoading,
    error,
    getPersonalizedRecommendations,
    getTrendingContent,
    getSearchSuggestions,
    updateUserPreferences,
    trackUserInteraction,
    getCategoryRecommendations,
    getCreatorRecommendations,
    getSimilarContent
  };
};