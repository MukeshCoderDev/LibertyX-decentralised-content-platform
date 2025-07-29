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
    },
  },
  {
    chainId: 31337, // Localhost/Hardhat
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      libertyToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      creatorRegistry: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      contentRegistry: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      revenueSplitter: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
      subscriptionManager: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      nftAccess: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      libertyDAO: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    },
  },
  {
    chainId: 11155111, // Sepolia Testnet
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/7cddccd83fda404b941fe80581c76c0a',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      libertyToken: '0x1234567890123456789012345678901234567890', // TODO: Deploy real token
      creatorRegistry: '0x28bCAB7F0458CE2ae28c6072E0bE5722A0dCEdCe', // ✅ DEPLOYED!
      contentRegistry: '0x3456789012345678901234567890123456789012', // TODO: Deploy real contract
      revenueSplitter: '0x4567890123456789012345678901234567890123', // TODO: Deploy real contract
      subscriptionManager: '0x5678901234567890123456789012345678901234', // TODO: Deploy real contract
      nftAccess: '0x6789012345678901234567890123456789012345', // TODO: Deploy real contract
      libertyDAO: '0x7890123456789012345678901234567890123456', // TODO: Deploy real contract
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
    },
  },
];

export const getChainByChainId = (chainId: number): Chain | undefined => {
  return SUPPORTED_CHAINS.find(chain => chain.chainId === chainId);
};