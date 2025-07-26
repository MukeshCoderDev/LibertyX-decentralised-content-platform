export interface TokenConfig {
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  color: string;
  category: 'major' | 'defi' | 'layer2' | 'meme' | 'stable' | 'gaming' | 'ai' | 'privacy' | 'enterprise';
  minPrice: number;
  maxPrice: number;
}

export const SUPPORTED_TOKENS: Record<string, TokenConfig> = {
  // 🏛️ Major Layer 1 Blockchains
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    decimals: 8,
    color: '#F7931A',
    category: 'major',
    minPrice: 0.00001,
    maxPrice: 10
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    decimals: 18,
    color: '#627EEA',
    category: 'major',
    minPrice: 0.001,
    maxPrice: 100
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    icon: '◎',
    decimals: 9,
    color: '#9945FF',
    category: 'major',
    minPrice: 0.01,
    maxPrice: 1000
  },
  ADA: {
    symbol: 'ADA',
    name: 'Cardano',
    icon: '₳',
    decimals: 6,
    color: '#0033AD',
    category: 'major',
    minPrice: 0.1,
    maxPrice: 10000
  },
  AVAX: {
    symbol: 'AVAX',
    name: 'Avalanche',
    icon: '🔺',
    decimals: 18,
    color: '#E84142',
    category: 'major',
    minPrice: 0.01,
    maxPrice: 1000
  },
  DOT: {
    symbol: 'DOT',
    name: 'Polkadot',
    icon: '⚫',
    decimals: 10,
    color: '#E6007A',
    category: 'major',
    minPrice: 0.01,
    maxPrice: 1000
  },
  ATOM: {
    symbol: 'ATOM',
    name: 'Cosmos',
    icon: '⚛️',
    decimals: 6,
    color: '#2E3148',
    category: 'major',
    minPrice: 0.01,
    maxPrice: 1000
  },
  NEAR: {
    symbol: 'NEAR',
    name: 'NEAR Protocol',
    icon: '🌐',
    decimals: 24,
    color: '#00C08B',
    category: 'major',
    minPrice: 0.1,
    maxPrice: 10000
  },

  // ⚡ Layer 2 & Scaling Solutions
  MATIC: {
    symbol: 'MATIC',
    name: 'Polygon',
    icon: '◆',
    decimals: 18,
    color: '#8247E5',
    category: 'layer2',
    minPrice: 0.1,
    maxPrice: 10000
  },
  OP: {
    symbol: 'OP',
    name: 'Optimism',
    icon: '🔴',
    decimals: 18,
    color: '#FF0420',
    category: 'layer2',
    minPrice: 0.1,
    maxPrice: 10000
  },
  ARB: {
    symbol: 'ARB',
    name: 'Arbitrum',
    icon: '🔵',
    decimals: 18,
    color: '#28A0F0',
    category: 'layer2',
    minPrice: 0.1,
    maxPrice: 10000
  },
  LRC: {
    symbol: 'LRC',
    name: 'Loopring',
    icon: '🔄',
    decimals: 18,
    color: '#1C60FF',
    category: 'layer2',
    minPrice: 1,
    maxPrice: 100000
  },
  IMX: {
    symbol: 'IMX',
    name: 'Immutable X',
    icon: '⚡',
    decimals: 18,
    color: '#00D4FF',
    category: 'layer2',
    minPrice: 0.1,
    maxPrice: 10000
  },

  // 🦄 DeFi Powerhouses
  UNI: {
    symbol: 'UNI',
    name: 'Uniswap',
    icon: '🦄',
    decimals: 18,
    color: '#FF007A',
    category: 'defi',
    minPrice: 0.01,
    maxPrice: 1000
  },
  AAVE: {
    symbol: 'AAVE',
    name: 'Aave',
    icon: '👻',
    decimals: 18,
    color: '#B6509E',
    category: 'defi',
    minPrice: 0.001,
    maxPrice: 100
  },
  COMP: {
    symbol: 'COMP',
    name: 'Compound',
    icon: '🏛️',
    decimals: 18,
    color: '#00D395',
    category: 'defi',
    minPrice: 0.001,
    maxPrice: 100
  },
  MKR: {
    symbol: 'MKR',
    name: 'Maker',
    icon: '🏗️',
    decimals: 18,
    color: '#1AAB9B',
    category: 'defi',
    minPrice: 0.0001,
    maxPrice: 10
  },
  SNX: {
    symbol: 'SNX',
    name: 'Synthetix',
    icon: '⚗️',
    decimals: 18,
    color: '#5FCDF9',
    category: 'defi',
    minPrice: 0.1,
    maxPrice: 10000
  },
  CRV: {
    symbol: 'CRV',
    name: 'Curve',
    icon: '📈',
    decimals: 18,
    color: '#40649F',
    category: 'defi',
    minPrice: 1,
    maxPrice: 100000
  },
  SUSHI: {
    symbol: 'SUSHI',
    name: 'SushiSwap',
    icon: '🍣',
    decimals: 18,
    color: '#FA52A0',
    category: 'defi',
    minPrice: 0.1,
    maxPrice: 10000
  },
  YFI: {
    symbol: 'YFI',
    name: 'Yearn Finance',
    icon: '💰',
    decimals: 18,
    color: '#006AE3',
    category: 'defi',
    minPrice: 0.00001,
    maxPrice: 1
  },

  // 🐕 Meme & Community Tokens
  DOGE: {
    symbol: 'DOGE',
    name: 'Dogecoin',
    icon: '🐕',
    decimals: 8,
    color: '#C2A633',
    category: 'meme',
    minPrice: 10,
    maxPrice: 1000000
  },
  SHIB: {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    icon: '🐕‍🦺',
    decimals: 18,
    color: '#FFA409',
    category: 'meme',
    minPrice: 100000,
    maxPrice: 100000000
  },
  PEPE: {
    symbol: 'PEPE',
    name: 'Pepe',
    icon: '🐸',
    decimals: 18,
    color: '#17C654',
    category: 'meme',
    minPrice: 1000000,
    maxPrice: 1000000000
  },
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    icon: '🔨',
    decimals: 5,
    color: '#FF6B35',
    category: 'meme',
    minPrice: 100000,
    maxPrice: 100000000
  },

  // 💵 Stablecoins
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    icon: '💵',
    decimals: 6,
    color: '#26A17B',
    category: 'stable',
    minPrice: 0.1,
    maxPrice: 10000
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '💰',
    decimals: 6,
    color: '#2775CA',
    category: 'stable',
    minPrice: 0.1,
    maxPrice: 10000
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai',
    icon: '💎',
    decimals: 18,
    color: '#F5AC37',
    category: 'stable',
    minPrice: 0.1,
    maxPrice: 10000
  },
  FRAX: {
    symbol: 'FRAX',
    name: 'Frax',
    icon: '🏦',
    decimals: 18,
    color: '#000000',
    category: 'stable',
    minPrice: 0.1,
    maxPrice: 10000
  },

  // 🎮 Gaming & NFT Tokens
  AXS: {
    symbol: 'AXS',
    name: 'Axie Infinity',
    icon: '🎮',
    decimals: 18,
    color: '#0055D4',
    category: 'gaming',
    minPrice: 0.01,
    maxPrice: 1000
  },
  SAND: {
    symbol: 'SAND',
    name: 'The Sandbox',
    icon: '🏖️',
    decimals: 18,
    color: '#00ADEF',
    category: 'gaming',
    minPrice: 0.1,
    maxPrice: 10000
  },
  MANA: {
    symbol: 'MANA',
    name: 'Decentraland',
    icon: '🌍',
    decimals: 18,
    color: '#FF2D55',
    category: 'gaming',
    minPrice: 0.1,
    maxPrice: 10000
  },
  ENJ: {
    symbol: 'ENJ',
    name: 'Enjin',
    icon: '⚔️',
    decimals: 18,
    color: '#624DBF',
    category: 'gaming',
    minPrice: 1,
    maxPrice: 100000
  },
  GALA: {
    symbol: 'GALA',
    name: 'Gala',
    icon: '🎪',
    decimals: 8,
    color: '#F5AC37',
    category: 'gaming',
    minPrice: 10,
    maxPrice: 1000000
  },

  // 🤖 AI & Technology
  FET: {
    symbol: 'FET',
    name: 'Fetch.ai',
    icon: '🤖',
    decimals: 18,
    color: '#02D9FF',
    category: 'ai',
    minPrice: 0.1,
    maxPrice: 10000
  },
  AGIX: {
    symbol: 'AGIX',
    name: 'SingularityNET',
    icon: '🧠',
    decimals: 8,
    color: '#5D2EFF',
    category: 'ai',
    minPrice: 1,
    maxPrice: 100000
  },
  OCEAN: {
    symbol: 'OCEAN',
    name: 'Ocean Protocol',
    icon: '🌊',
    decimals: 18,
    color: '#7B1AF7',
    category: 'ai',
    minPrice: 0.1,
    maxPrice: 10000
  },
  RNDR: {
    symbol: 'RNDR',
    name: 'Render',
    icon: '🎨',
    decimals: 18,
    color: '#FF6B35',
    category: 'ai',
    minPrice: 0.01,
    maxPrice: 1000
  },
  GRT: {
    symbol: 'GRT',
    name: 'The Graph',
    icon: '📊',
    decimals: 18,
    color: '#6747ED',
    category: 'ai',
    minPrice: 1,
    maxPrice: 100000
  },
  LINK: {
    symbol: 'LINK',
    name: 'Chainlink',
    icon: '🔗',
    decimals: 18,
    color: '#375BD2',
    category: 'ai',
    minPrice: 0.01,
    maxPrice: 1000
  },

  // 🔒 Privacy Coins
  XMR: {
    symbol: 'XMR',
    name: 'Monero',
    icon: '🔒',
    decimals: 12,
    color: '#FF6600',
    category: 'privacy',
    minPrice: 0.001,
    maxPrice: 100
  },
  ZEC: {
    symbol: 'ZEC',
    name: 'Zcash',
    icon: '🛡️',
    decimals: 8,
    color: '#F4B728',
    category: 'privacy',
    minPrice: 0.001,
    maxPrice: 100
  },

  // 🏢 Enterprise & Utility
  VET: {
    symbol: 'VET',
    name: 'VeChain',
    icon: '🏭',
    decimals: 18,
    color: '#15BDFF',
    category: 'enterprise',
    minPrice: 10,
    maxPrice: 1000000
  },
  XRP: {
    symbol: 'XRP',
    name: 'Ripple',
    icon: '💧',
    decimals: 6,
    color: '#23292F',
    category: 'enterprise',
    minPrice: 1,
    maxPrice: 100000
  },
  XLM: {
    symbol: 'XLM',
    name: 'Stellar',
    icon: '⭐',
    decimals: 7,
    color: '#7D00FF',
    category: 'enterprise',
    minPrice: 1,
    maxPrice: 100000
  },
  BAT: {
    symbol: 'BAT',
    name: 'Basic Attention Token',
    icon: '🦇',
    decimals: 18,
    color: '#FF5000',
    category: 'enterprise',
    minPrice: 1,
    maxPrice: 100000
  },

  // 🗽 Platform Token
  LIB: {
    symbol: 'LIB',
    name: 'Liberty Token',
    icon: '🗽',
    decimals: 18,
    color: '#FF0050',
    category: 'major',
    minPrice: 0.1,
    maxPrice: 10000
  },

  // Additional popular tokens
  BNB: {
    symbol: 'BNB',
    name: 'BNB',
    icon: '🔶',
    decimals: 18,
    color: '#F3BA2F',
    category: 'major',
    minPrice: 0.001,
    maxPrice: 100
  },
  TRX: {
    symbol: 'TRX',
    name: 'TRON',
    icon: '🔺',
    decimals: 6,
    color: '#FF060A',
    category: 'major',
    minPrice: 10,
    maxPrice: 1000000
  },
  LTC: {
    symbol: 'LTC',
    name: 'Litecoin',
    icon: '🥈',
    decimals: 8,
    color: '#BFBBBB',
    category: 'major',
    minPrice: 0.001,
    maxPrice: 100
  }
};

export const getTokensByCategory = (category: TokenConfig['category']): TokenConfig[] => {
  return Object.values(SUPPORTED_TOKENS).filter(token => token.category === category);
};

export const getAllTokens = (): TokenConfig[] => {
  return Object.values(SUPPORTED_TOKENS);
};

export const getTokenConfig = (symbol: string): TokenConfig | undefined => {
  return SUPPORTED_TOKENS[symbol.toUpperCase()];
};

export const formatTokenAmount = (amount: string, decimals: number, symbol: string): string => {
  const value = parseFloat(amount) / Math.pow(10, decimals);
    // Format based on token value
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M ${symbol}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K ${symbol}`;
  } else if (value >= 1) {
    return `${value.toFixed(4)} ${symbol}`;
  } else if (value >= 0.0001) {
    return `${value.toFixed(6)} ${symbol}`;
  } else {
    return `${value.toExponential(2)} ${symbol}`;
  }
};

export const TOKEN_CATEGORIES = {
  major: '🏛️ Major Blockchains',
  defi: '🦄 DeFi Tokens',
  layer2: '⚡ Layer 2 Solutions',
  meme: '🐕 Meme Tokens',
  stable: '💵 Stablecoins',
  gaming: '🎮 Gaming & NFTs',
  ai: '🤖 AI & Technology',
  privacy: '🔒 Privacy Coins',
  enterprise: '🏢 Enterprise & Utility'
};