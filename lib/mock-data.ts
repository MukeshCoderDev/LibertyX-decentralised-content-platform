import { ContentCardData, ChartData, TokenBalance } from '../types';

export const exploreFeedData: ContentCardData[] = Array.from({ length: 20 }).map((_, i) => {
  const accessLevels = ['public', 'subscription', 'nft', 'premium'];
  const accessLevel = accessLevels[i % 4] as 'public' | 'subscription' | 'nft' | 'premium';
  
  return {
    id: i + 1,
    creatorAvatar: `https://i.pravatar.cc/40?u=${i}`,
    creatorName: `Creator ${i + 1}`,
    creatorAddress: `0x${Math.random().toString(16).substr(2, 40)}`, // Mock address
    thumbnail: `https://picsum.photos/seed/${i + 1}/360/640`,
    price: parseFloat((Math.random() * 20).toFixed(2)),
    likes: Math.floor(Math.random() * 5000) + 100,
    isVerified: Math.random() > 0.5,
    isHD: Math.random() > 0.3,
    isVR: Math.random() > 0.8,
    category: ['Solo', 'Couple', 'Toy Play', 'Exclusive'][i % 4],
    accessLevel: accessLevel,
    nftTierRequired: accessLevel === 'nft' || accessLevel === 'premium' ? Math.floor(Math.random() * 3) + 1 : undefined,
  };
});

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
    { amount: '1500.50', token: 'LIBERTY', decimals: 18, symbol: 'LIB' },
    { amount: '2.5', token: 'ETH', decimals: 18, symbol: 'ETH' },
    { amount: '520.10', token: 'USDC', decimals: 6, symbol: 'USDC' },
];
