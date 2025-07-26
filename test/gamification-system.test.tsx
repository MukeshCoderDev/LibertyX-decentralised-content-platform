import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GamificationDashboard } from '../components/GamificationDashboard';
import { CreatorGoals } from '../components/CreatorGoals';
import { CommunityRewards } from '../components/CommunityRewards';
import { TokenStaking } from '../components/TokenStaking';
import { SeasonalEvents } from '../components/SeasonalEvents';
import { WalletProvider } from '../lib/WalletProvider';

// Mock the hooks
vi.mock('../hooks/useGamification', () => ({
  useGamification: () => ({
    userStats: {
      level: 5,
      xp: 2500,
      xpToNextLevel: 1500,
      totalXp: 12500,
      achievements: [
        {
          id: 'first_upload',
          name: 'Content Creator',
          description: 'Upload your first piece of content',
          icon: '🎬',
          rarity: 'common',
          progress: 1,
          maxProgress: 1,
          completed: true,
          reward: { xp: 100, tokens: 10 }
        }
      ],
      badges: ['early_adopter'],
      referralCount: 3,
      stakingRewards: 500,
      loyaltyTier: 'silver'
    },
    achievements: [
      {
        id: 'first_upload',
        name: 'Content Creator',
        description: 'Upload your first piece of content',
        icon: '🎬',
        rarity: 'common',
        progress: 1,
        maxProgress: 1,
        completed: true,
        reward: { xp: 100, tokens: 10 }
      }
    ],
    creatorGoals: [
      {
        id: 'monthly_earnings_100',
        name: 'Monthly Milestone',
        description: 'Earn 100 LIB tokens in a month',
        targetValue: 100,
        currentValue: 75,
        reward: { revenueShareIncrease: 2, tokens: 50 },
        completed: false
      }
    ],
    isLoading: false,
    error: null,
    awardXP: vi.fn(),
    claimReward: vi.fn(),
    getSeasonalEvents: vi.fn().mockResolvedValue([]),
    getReferralLink: vi.fn().mockReturnValue('https://libertyx.io/ref/12345678'),
    stakeTokens: vi.fn(),
    processReferral: vi.fn(),
    updateCreatorGoalProgress: vi.fn(),
    refreshData: vi.fn()
  })
}));

vi.mock('../hooks/useContractManager', () => ({
  useContractManager: () => ({
    contracts: {},
    isLoading: false,
    error: null
  })
}));

// Mock wallet provider
const MockWalletProvider = ({ children }: { children: React.ReactNode }) => (
  <WalletProvider>
    {children}
  </WalletProvider>
);

describe('Gamification System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GamificationDashboard', () => {
    it('renders gamification dashboard with user stats', () => {
      render(
        <MockWalletProvider>
          <GamificationDashboard />
        </MockWalletProvider>
      );

      expect(screen.getByText('Gamification Hub')).toBeInTheDocument();
      expect(screen.getByText('Level 5')).toBeInTheDocument();
      expect(screen.getByText('SILVER TIER')).toBeInTheDocument();
    });

    it('displays navigation tabs correctly', () => {
      render(
        <MockWalletProvider>
          <GamificationDashboard />
        </MockWalletProvider>
      );

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('Creator Goals')).toBeInTheDocument();
      expect(screen.getByText('Community')).toBeInTheDocument();
      expect(screen.getByText('Staking')).toBeInTheDocument();
      expect(screen.getByText('Rewards')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    it('switches between tabs correctly', async () => {
      render(
        <MockWalletProvider>
          <GamificationDashboard />
        </MockWalletProvider>
      );

      // Click on Achievements tab
      fireEvent.click(screen.getByText('Achievements'));
      await waitFor(() => {
        expect(screen.getByText('Content Creator')).toBeInTheDocument();
      });

      // Click on Creator Goals tab
      fireEvent.click(screen.getByText('Creator Goals'));
      await waitFor(() => {
        expect(screen.getByText('Creator Goals')).toBeInTheDocument();
      });
    });
  });

  describe('CreatorGoals', () => {
    it('renders creator goals with progress', () => {
      render(
        <MockWalletProvider>
          <CreatorGoals />
        </MockWalletProvider>
      );

      expect(screen.getByText('Creator Goals')).toBeInTheDocument();
      expect(screen.getByText('Monthly Milestone')).toBeInTheDocument();
      expect(screen.getByText('75 / 100')).toBeInTheDocument();
    });

    it('shows reward information correctly', () => {
      render(
        <MockWalletProvider>
          <CreatorGoals />
        </MockWalletProvider>
      );

      expect(screen.getByText('+2% Revenue Share + 50 LIB')).toBeInTheDocument();
    });
  });

  describe('CommunityRewards', () => {
    it('renders referral program information', () => {
      render(
        <MockWalletProvider>
          <CommunityRewards />
        </MockWalletProvider>
      );

      expect(screen.getByText('Community Rewards')).toBeInTheDocument();
      expect(screen.getByText('Referral Program')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total referrals
    });

    it('displays referral link correctly', () => {
      render(
        <MockWalletProvider>
          <CommunityRewards />
        </MockWalletProvider>
      );

      const referralInput = screen.getByDisplayValue('https://libertyx.io/ref/12345678');
      expect(referralInput).toBeInTheDocument();
    });

    it('handles copy referral link', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        }
      });

      render(
        <MockWalletProvider>
          <CommunityRewards />
        </MockWalletProvider>
      );

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://libertyx.io/ref/12345678');
      });
    });
  });

  describe('TokenStaking', () => {
    it('renders staking pools correctly', () => {
      render(
        <MockWalletProvider>
          <TokenStaking />
        </MockWalletProvider>
      );

      expect(screen.getByText('Token Staking')).toBeInTheDocument();
      expect(screen.getByText('Flexible Staking')).toBeInTheDocument();
      expect(screen.getByText('30-Day Lock')).toBeInTheDocument();
      expect(screen.getByText('90-Day Lock')).toBeInTheDocument();
      expect(screen.getByText('365-Day Lock')).toBeInTheDocument();
    });

    it('displays staking pool details', () => {
      render(
        <MockWalletProvider>
          <TokenStaking />
        </MockWalletProvider>
      );

      expect(screen.getByText('8%')).toBeInTheDocument(); // Flexible staking APY
      expect(screen.getByText('12%')).toBeInTheDocument(); // 30-day lock APY
      expect(screen.getByText('18%')).toBeInTheDocument(); // 90-day lock APY
      expect(screen.getByText('25%')).toBeInTheDocument(); // 365-day lock APY
    });

    it('shows voting power multipliers', () => {
      render(
        <MockWalletProvider>
          <TokenStaking />
        </MockWalletProvider>
      );

      expect(screen.getByText('1x')).toBeInTheDocument(); // Flexible
      expect(screen.getByText('1.5x')).toBeInTheDocument(); // 30-day
      expect(screen.getByText('2x')).toBeInTheDocument(); // 90-day
      expect(screen.getByText('3x')).toBeInTheDocument(); // 365-day
    });
  });

  describe('SeasonalEvents', () => {
    it('renders seasonal events section', () => {
      render(
        <MockWalletProvider>
          <SeasonalEvents />
        </MockWalletProvider>
      );

      expect(screen.getByText('Seasonal Events')).toBeInTheDocument();
    });

    it('shows no events message when no events are active', () => {
      render(
        <MockWalletProvider>
          <SeasonalEvents />
        </MockWalletProvider>
      );

      expect(screen.getByText('No Active Events')).toBeInTheDocument();
      expect(screen.getByText('Check back soon for exciting seasonal challenges and competitions!')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('gamification system components work together', async () => {
      render(
        <MockWalletProvider>
          <GamificationDashboard />
        </MockWalletProvider>
      );

      // Test navigation between different sections
      fireEvent.click(screen.getByText('Creator Goals'));
      await waitFor(() => {
        expect(screen.getByText('Monthly Milestone')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Community'));
      await waitFor(() => {
        expect(screen.getByText('Referral Program')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Staking'));
      await waitFor(() => {
        expect(screen.getByText('Flexible Staking')).toBeInTheDocument();
      });
    });

    it('displays consistent user data across components', () => {
      render(
        <MockWalletProvider>
          <GamificationDashboard />
        </MockWalletProvider>
      );

      // Check that user stats are displayed consistently
      expect(screen.getByText('Level 5')).toBeInTheDocument();
      expect(screen.getByText('SILVER TIER')).toBeInTheDocument();
      expect(screen.getByText('12,500')).toBeInTheDocument(); // Total XP
    });
  });
});