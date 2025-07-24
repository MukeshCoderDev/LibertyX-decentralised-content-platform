import { Chain } from './web3-types';

export const SUPPORTED_CHAINS: Chain[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: `https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_PROJECT_ID || import.meta.env.VITE_ALCHEMY_MAINNET_ID}`,
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      libertyToken: '0x...', // Replace with actual deployed address for Ethereum Mainnet
      creatorRegistry: '0x...', // Replace with actual deployed address for Ethereum Mainnet
      contentRegistry: '0x...', // Replace with actual deployed address for Ethereum Mainnet
      revenueSplitter: '0x...', // Replace with actual deployed address for Ethereum Mainnet
      subscriptionManager: '0x...', // Replace with actual deployed address for Ethereum Mainnet
      nftAccess: '0x...', // Replace with actual deployed address for Ethereum Mainnet
      libertyDAO: '0x...', // Replace with actual deployed address for Ethereum Mainnet
      tipJar: '0x...', // Placeholder for TipJar
    },
  },
  {
    chainId: 11155111, // Sepolia Testnet
    name: 'Sepolia Testnet',
    rpcUrl: `${import.meta.env.VITE_ALCHEMY_SEPOLIA_URL || `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_PROJECT_ID}`}`, // Use Alchemy URL if available, fallback to Infura
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      libertyToken: '0x76404FEB7c5dA01881CCD1dB1E201D0351Ad6994',
      creatorRegistry: '0x5cB5536CAA837f1B1B8Ed994deD3F939FadCb27d',
      contentRegistry: '0x9Fc0552df6fA4ca99b2701cfD8bBDbD3F98723E8',
      revenueSplitter: '0xEAEdEe015e7cCd4f99161F85Ec9e4f6a6fb0e408',
      subscriptionManager: '0x...', // Placeholder, update with actual deployed address
      nftAccess: '0x...', // Placeholder, update with actual deployed address
      libertyDAO: '0x...', // Placeholder, update with actual deployed address
      tipJar: '0xC85a1A189Bfe4C602506b790EE1d98ec642c5EA9', // New contract from deployment output
    },
  },
  {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    contracts: {
      libertyToken: '0x...',
      creatorRegistry: '0x...',
      contentRegistry: '0x...',
      revenueSplitter: '0x...',
      subscriptionManager: '0x...',
      nftAccess: '0x...',
      libertyDAO: '0x...',
      tipJar: '0x...', // Placeholder for TipJar
    },
  },
  {
    chainId: 56,
    name: 'BNB Smart Chain Mainnet',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    contracts: {
      libertyToken: '0x...',
      creatorRegistry: '0x...',
      contentRegistry: '0x...',
      revenueSplitter: '0x...',
      subscriptionManager: '0x...',
      nftAccess: '0x...',
      libertyDAO: '0x...',
      tipJar: '0x...', // Placeholder for TipJar
    },
  },
  {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      libertyToken: '0x...',
      creatorRegistry: '0x...',
      contentRegistry: '0x...',
      revenueSplitter: '0x...',
      subscriptionManager: '0x...',
      nftAccess: '0x...',
      libertyDAO: '0x...',
      tipJar: '0x...', // Placeholder for TipJar
    },
  },
  {
    chainId: 10,
    name: 'Optimism Mainnet',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      libertyToken: '0x...',
      creatorRegistry: '0x...',
      contentRegistry: '0x...',
      revenueSplitter: '0x...',
      subscriptionManager: '0x...',
      nftAccess: '0x...',
      libertyDAO: '0x...',
      tipJar: '0x...', // Placeholder for TipJar
    },
  },
  {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    contracts: {
      libertyToken: '0x...',
      creatorRegistry: '0x...',
      contentRegistry: '0x...',
      revenueSplitter: '0x...',
      subscriptionManager: '0x...',
      nftAccess: '0x...',
      libertyDAO: '0x...',
      tipJar: '0x...', // Placeholder for TipJar
    },
  },
];

export const getChainByChainId = (chainId: number): Chain | undefined => {
  return SUPPORTED_CHAINS.find(chain => chain.chainId === chainId);
};