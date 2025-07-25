import { ContentCardData, ChartData, TokenBalance, TokenPrice } from '../types';

export const exploreFeedData: ContentCardData[] = Array.from({ length: 20 }).map((_, i) => {
  const accessLevels = ['public', 'subscription', 'nft', 'premium'];
  const accessLevel = accessLevels[i % 4] as 'public' | 'subscription' | 'nft' | 'premium';
  
  // Generate random crypto prices from expanded token list
  const tokens = [
    'LIB', 'ETH', 'BTC', 'BNB', 'SOL', 'ADA', 'AVAX', 'DOT', 'MATIC', 'OP', 'ARB',
    'UNI', 'AAVE', 'COMP', 'LINK', 'DOGE', 'SHIB', 'USDT', 'USDC', 'AXS', 'SAND',
    'MANA', 'FET', 'AGIX', 'OCEAN', 'XMR', 'VET', 'XRP', 'BAT'
  ];
  const selectedToken = tokens[i % tokens.length];
  
  let priceAmount: string;
  let decimals: number;
  
  switch (selectedToken) {
    case 'LIB':
      priceAmount = (Math.random() * 500 * Math.pow(10, 18)).toFixed(0); // 0-500 LIB
      decimals = 18;
      break;
    case 'ETH':
      priceAmount = (Math.random() * 5 * Math.pow(10, 18)).toFixed(0); // 0-5 ETH
      decimals = 18;
      break;
    case 'BTC':
      priceAmount = (Math.random() * 0.1 * Math.pow(10, 8)).toFixed(0); // 0-0.1 BTC
      decimals = 8;
      break;
    case 'BNB':
      priceAmount = (Math.random() * 20 * Math.pow(10, 18)).toFixed(0); // 0-20 BNB
      decimals = 18;
      break;
    case 'SOL':
      priceAmount = (Math.random() * 50 * Math.pow(10, 9)).toFixed(0); // 0-50 SOL
      decimals = 9;
      break;
    case 'ADA':
      priceAmount = (Math.random() * 1000 * Math.pow(10, 6)).toFixed(0); // 0-1000 ADA
      decimals = 6;
      break;
    case 'AVAX':
      priceAmount = (Math.random() * 50 * Math.pow(10, 18)).toFixed(0); // 0-50 AVAX
      decimals = 18;
      break;
    case 'DOT':
      priceAmount = (Math.random() * 100 * Math.pow(10, 10)).toFixed(0); // 0-100 DOT
      decimals = 10;
      break;
    case 'MATIC':
      priceAmount = (Math.random() * 1000 * Math.pow(10, 18)).toFixed(0); // 0-1000 MATIC
      decimals = 18;
      break;
    case 'OP':
      priceAmount = (Math.random() * 100 * Math.pow(10, 18)).toFixed(0); // 0-100 OP
      decimals = 18;
      break;
    case 'ARB':
      priceAmount = (Math.random() * 100 * Math.pow(10, 18)).toFixed(0); // 0-100 ARB
      decimals = 18;
      break;
    case 'UNI':
      priceAmount = (Math.random() * 50 * Math.pow(10, 18)).toFixed(0); // 0-50 UNI
      decimals = 18;
      break;
    case 'AAVE':
      priceAmount = (Math.random() * 10 * Math.pow(10, 18)).toFixed(0); // 0-10 AAVE
      decimals = 18;
      break;
    case 'COMP':
      priceAmount = (Math.random() * 5 * Math.pow(10, 18)).toFixed(0); // 0-5 COMP
      decimals = 18;
      break;
    case 'LINK':
      priceAmount = (Math.random() * 100 * Math.pow(10, 18)).toFixed(0); // 0-100 LINK
      decimals = 18;
      break;
    case 'DOGE':
      priceAmount = (Math.random() * 10000 * Math.pow(10, 8)).toFixed(0); // 0-10000 DOGE
      decimals = 8;
      break;
    case 'SHIB':
      priceAmount = (Math.random() * 100000000 * Math.pow(10, 18)).toFixed(0); // 0-100M SHIB
      decimals = 18;
      break;
    case 'USDT':
    case 'USDC':
      priceAmount = (Math.random() * 1000 * Math.pow(10, 6)).toFixed(0); // 0-1000 USD
      decimals = 6;
      break;
    case 'AXS':
      priceAmount = (Math.random() * 50 * Math.pow(10, 18)).toFixed(0); // 0-50 AXS
      decimals = 18;
      break;
    case 'SAND':
    case 'MANA':
      priceAmount = (Math.random() * 1000 * Math.pow(10, 18)).toFixed(0); // 0-1000 SAND/MANA
      decimals = 18;
      break;
    case 'FET':
    case 'AGIX':
    case 'OCEAN':
      priceAmount = (Math.random() * 1000 * Math.pow(10, 18)).toFixed(0); // 0-1000 AI tokens
      decimals = 18;
      break;
    case 'XMR':
      priceAmount = (Math.random() * 5 * Math.pow(10, 12)).toFixed(0); // 0-5 XMR
      decimals = 12;
      break;
    case 'VET':
      priceAmount = (Math.random() * 10000 * Math.pow(10, 18)).toFixed(0); // 0-10000 VET
      decimals = 18;
      break;
    case 'XRP':
      priceAmount = (Math.random() * 1000 * Math.pow(10, 6)).toFixed(0); // 0-1000 XRP
      decimals = 6;
      break;
    case 'BAT':
      priceAmount = (Math.random() * 1000 * Math.pow(10, 18)).toFixed(0); // 0-1000 BAT
      decimals = 18;
      break;
    default:
      priceAmount = (Math.random() * 100 * Math.pow(10, 18)).toFixed(0);
      decimals = 18;
  }
  
  return {
    id: i + 1,
    creatorAvatar: `https://i.pravatar.cc/40?u=${i}`,
    creatorName: `Creator ${i + 1}`,
    creatorAddress: `0x${Math.random().toString(16).substr(2, 40)}`, // Mock address
    thumbnail: `https://picsum.photos/seed/${i + 1}/360/640`,
    price: {
      amount: priceAmount,
      token: selectedToken,
      decimals: decimals,
      symbol: selectedToken
    } as TokenPrice,
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
  { name: 'Mon', earnings: 40 }, // Earnings in LIB tokens
  { name: 'Tue', earnings: 30 },
  { name: 'Wed', earnings: 20 },
  { name: 'Thu', earnings: 27.8 },
  { name: 'Fri', earnings: 18.9 },
  { name: 'Sat', earnings: 23.9 },
  { name: 'Sun', earnings: 34.9 },
];

export const walletBalances: TokenBalance[] = [
    { amount: '1500.50', token: 'LIBERTY', decimals: 18, symbol: 'LIB' },
    { amount: '2.5', token: 'ETH', decimals: 18, symbol: 'ETH' },
    { amount: '520.10', token: 'USDC', decimals: 6, symbol: 'USDC' },
];
