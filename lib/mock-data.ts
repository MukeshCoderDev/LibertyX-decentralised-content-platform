import { ContentCardData, ChartData, TokenBalance } from '../types';

export const exploreFeedData: ContentCardData[] = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  creatorAvatar: `https://i.pravatar.cc/40?u=${i}`,
  creatorName: `Creator ${i + 1}`,
  thumbnail: `https://picsum.photos/seed/${i + 1}/360/640`,
  price: parseFloat((Math.random() * 20).toFixed(2)),
  likes: Math.floor(Math.random() * 5000) + 100,
  isVerified: Math.random() > 0.5,
  isHD: Math.random() > 0.3,
  isVR: Math.random() > 0.8,
  category: ['Solo', 'Couple', 'Toy Play', 'Exclusive'][i % 4],
}));

export const dashboardChartData: ChartData[] = [
  { name: 'Mon', earnings: 4000 },
  { name: 'Tue', earnings: 3000 },
  { name: 'Wed', earnings: 2000 },
  { name: 'Thu', earnings: 2780 },
  { name: 'Fri', earnings: 1890 },
  { name: 'Sat', earnings: 2390 },
  { name: 'Sun', earnings: 3490 },
];

export const walletBalances: TokenBalance[] = [
    { symbol: 'LIBERTY', balance: 1500.50, usdValue: 750.25 },
    { symbol: 'ETH', balance: 2.5, usdValue: 8750.00 },
    { symbol: 'USDC', balance: 520.10, usdValue: 520.10 },
];
