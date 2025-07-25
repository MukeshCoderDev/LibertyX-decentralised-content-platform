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
  thumbnail: string;
  price: number;
  likes: number;
  isVerified: boolean;
  isHD: boolean;
  isVR: boolean;
  category: string;
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
