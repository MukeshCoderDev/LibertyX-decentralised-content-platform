export enum Page {
  Landing = 'LANDING',
  Explore = 'EXPLORE',
  Watch = 'WATCH',
  Upload = 'UPLOAD',
  Dashboard = 'DASHBOARD',
  Profile = 'PROFILE',
  CreatorProfile = 'CREATOR_PROFILE', // Add new page type
  Governance = 'GOVERNANCE', // Add governance page type
  SocialTest = 'SOCIAL_TEST', // Add social test page
  Gamification = 'GAMIFICATION', // Add gamification page type
  Admin = 'ADMIN', // Add admin page for video management
}

export interface NavigationProps {
  onNavigate: (page: Page) => void;
}

export interface TokenPrice {
  amount: string; // Using string to handle large numbers and decimals
  token: string;
  decimals: number;
  symbol: string;
  icon?: string;
}

export interface ContentCardData {
  id: number;
  creatorAvatar: string;
  creatorName: string;
  creatorAddress?: string;
  thumbnail: string;
  price: TokenPrice; // Changed from number to TokenPrice
  likes: number;
  isVerified: boolean;
  isHD: boolean;
  isVR: boolean;
  category: string;
  accessLevel?: 'public' | 'subscription' | 'nft' | 'premium';
  nftTierRequired?: number;
}

export interface ChartData {
    name: string;
    earnings: number;
}

export interface TokenBalance {
    amount: string; // Using string to handle large numbers and decimals
    token: string;
    decimals: number;
    symbol: string;
    icon?: string;
}

export interface SubscriptionPlan {
    priceWei: string;
    duration: number; // in seconds
    priceEth: string; // formatted price in ETH
    durationDays: number; // duration in days for display
    isActive: boolean;
}

export interface SubscriptionStatus {
    expiresAt: number;
    isActive: boolean;
    daysRemaining: number;
}

export interface NFTTier {
    id: number;
    creatorAddress: string;
    uri: string;
    maxSupply: number;
    currentSupply: number;
    priceWei: string;
    priceEth: string;
    isActive: boolean;
}

export interface NFTHolding {
    tierId: number;
    amount: number;
    tier: NFTTier;
}

export interface NFTTierStats {
    tierId: number;
    holderCount: number;
    totalMinted: number;
    maxSupply: number;
    revenue: string; // in wei
    revenueEth: string; // formatted in ETH
}
// Governance types
export interface Proposal {
  id: number;
  description: string;
  votesFor: string;
  votesAgainst: string;
  endTime: number;
  executed: boolean;
  hasVoted?: boolean;
  userVote?: boolean;
  status: 'active' | 'ended' | 'executed' | 'failed';
  quorumReached: boolean;
  passed: boolean;
}

export interface VotingPower {
  balance: string;
  formattedBalance: string;
  canCreateProposal: boolean;
  canVote: boolean;
}

// Governance constants
export const GOVERNANCE_CONSTANTS = {
  QUORUM: '500000', // 500k LIB
  MIN_PROPOSAL_TOKENS: '1000', // 1000 LIB
  VOTING_PERIOD: 7 * 24 * 60 * 60, // 7 days in seconds
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;

// Contract addresses on Sepolia
export const GOVERNANCE_CONTRACTS = {
  LIBERTY_TOKEN: '0x12bdF4aEB6F85bEc7c55de6c418f5d88e9203319',
  LIBERTY_DAO: '0x1e1e418F9a1eE0e887Bd6Ba8CbeCD07C6B1e1FcA',
} as const;

// Error types for governance operations
export interface GovernanceError {
  code: string;
  message: string;
  details?: any;
}

export type GovernanceErrorType = 
  | 'WALLET_NOT_CONNECTED'
  | 'INSUFFICIENT_TOKENS'
  | 'INVALID_PROPOSAL'
  | 'VOTING_ENDED'
  | 'ALREADY_VOTED'
  | 'TRANSACTION_FAILED'
  | 'NETWORK_ERROR'
  | 'CONTRACT_ERROR';