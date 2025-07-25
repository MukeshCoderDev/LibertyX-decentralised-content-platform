export enum Page {
  Landing = 'LANDING',
  Explore = 'EXPLORE',
  Watch = 'WATCH',
  Upload = 'UPLOAD',
  Dashboard = 'DASHBOARD',
  Profile = 'PROFILE',
  CreatorProfile = 'CREATOR_PROFILE', // Add new page type
}

export interface NavigationProps {
  onNavigate: (page: Page) => void;
}

export interface ContentCardData {
  id: number;
  creatorAvatar: string;
  creatorName: string;
  creatorAddress?: string;
  thumbnail: string;
  price: number;
  likes: number;
  isVerified: boolean;
  isHD: boolean;
  isVR: boolean;
  category: string;
  accessLevel?: 'public' | 'subscription' | 'nft' | 'premium';
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
