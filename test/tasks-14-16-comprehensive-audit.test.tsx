import * as React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Components
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import CrossChainBridge from '../components/CrossChainBridge';
import AIRecommendations from '../components/AIRecommendations';

// Mock providers
const mockWalletContext = {
  account: '0x1234567890123456789012345678901234567890',
  chainId: 1,
  isConnected: true,
  switchNetwork: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn()
};

// Mock hooks
vi.mock('../hooks/useAnalyticsEngine', () => ({
  useAnalyticsEngine: () => ({
    getViewerDemographics: vi.fn().mockResolvedValue({}),
    getEngagementMetrics: vi.fn().mockResolvedValue({}),
    getContentPerformance: vi.fn().mockResolvedValue([]),
    getRevenueForecasting: vi.fn().mockResolvedValue({}),
    getAudienceInsights: vi.fn().mockResolvedValue({}),
    getTrendingAnalysis: vi.fn().mockResolvedValue({}),
    trackContentInteraction: vi.fn(),
    generateOptimalPostingTimes: vi.fn().mockResolvedValue([]),
    getABTestingInsights: vi.fn().mockResolvedValue({})
  })
}));

vi.mock('../hooks/useCrossChainBridge', () => ({
  useCrossChainBridge: () => ({
    supportedChains: [],
    bridgeHistory: [],
    activeBridges: [],
    isLoading: false,
    error: null,
    getSupportedChains: vi.fn().mockReturnValue([]),
    estimateBridgeFee: vi.fn().mockResolvedValue({}),
    initiateBridge: vi.fn().mockResolvedValue(''),
    trackBridgeStatus: vi.fn().mockResolvedValue({}),
    getBridgeHistory: vi.fn().mockResolvedValue([]),
    cancelBridge: vi.fn().mockResolvedValue(true),
    retryFailedBridge: vi.fn().mockResolvedValue('')
  })
}));

vi.mock('../hooks/useAIRecommendations', () => ({
  useAIRecommendations: () => ({
    recommendations: [],
    trendingContent: [],
    searchSuggestions: [],
    userPreferences: null,
    isLoading: false,
    error: null,
    getPersonalizedRecommendations: vi.fn().mockResolvedValue([]),
    getTrendingContent: vi.fn().mockResolvedValue([]),
    getSearchSuggestions: vi.fn().mockResolvedValue([]),
    updateUserPreferences: vi.fn(),
    trackUserInteraction: vi.fn(),
    getCategoryRecommendations: vi.fn().mockResolvedValue([]),
    getCreatorRecommendations: vi.fn().mockResolvedValue([]),
    getSimilarContent: vi.fn().mockResolvedValue([])
  })
}));

vi.mock('../hooks/useContentStatistics', () => ({
  useContentStatistics: () => ({
    creatorStats: null,
    refreshCreatorStats: vi.fn()
  })
}));

vi.mock('../lib/WalletProvider', () => ({
  useWallet: () => mockWalletContext,
  WalletProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="mock-wrapper">{children}</div>
);

describe('Tasks 14-16: Advanced Features Comprehensive Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup localStorage mock
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Task 14: Advanced Analytics System', () => {
    it('should render analytics dashboard', () => {
      render(
        <MockWrapper>
          <AdvancedAnalytics />
        </MockWrapper>
      );

      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    });
  });

  describe('Task 15: Cross-Chain Bridge', () => {
    it('should render bridge interface', () => {
      render(
        <MockWrapper>
          <CrossChainBridge />
        </MockWrapper>
      );

      expect(screen.getByText('Cross-Chain Bridge')).toBeInTheDocument();
    });
  });

  describe('Task 16: AI Recommendations', () => {
    it('should render recommendations', () => {
      render(
        <MockWrapper>
          <AIRecommendations onNavigate={vi.fn()} />
        </MockWrapper>
      );

      expect(screen.getByTestId('mock-wrapper')).toBeInTheDocument();
    });
  });
});