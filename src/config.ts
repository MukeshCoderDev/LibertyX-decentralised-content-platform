// Contract addresses - hardcoded for reliability
export const CONTRACT_ADDRESSES = {
  // Localhost/Development addresses
  localhost: {
    libertyToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    creatorRegistry: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    contentRegistry: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    revenueSplitter: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    subscriptionManager: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    nftAccess: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    libertyDAO: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  // Sepolia testnet addresses (REAL DEPLOYED CONTRACTS)
  sepolia: {
    libertyToken: '0x1234567890123456789012345678901234567890', // TODO: Deploy real token
    creatorRegistry: '0x28bCAB7F0458CE2ae28c6072E0bE5722A0dCEdCe', // ✅ DEPLOYED!
    contentRegistry: '0x3456789012345678901234567890123456789012', // TODO: Deploy real contract
    revenueSplitter: '0x4567890123456789012345678901234567890123', // TODO: Deploy real contract
    subscriptionManager: '0xd8819e13267c9a237381fec9aA69b827D980Ae0D', // ✅ DEPLOYED!
    nftAccess: '0xCe964eeadf8655d46FdF5462a4a357b8cDA1ac3F', // ✅ DEPLOYED!
    libertyDAO: '0x7890123456789012345678901234567890123456', // TODO: Deploy real contract
  }
};

// Get contract addresses based on chain ID
export function getContractAddresses(chainId: number) {
  switch (chainId) {
    case 31337: // Localhost
      return CONTRACT_ADDRESSES.localhost;
    case 11155111: // Sepolia
      return CONTRACT_ADDRESSES.sepolia;
    default:
      return CONTRACT_ADDRESSES.localhost; // Fallback to localhost
  }
}

// Direct exports for easy access (your mentor's suggestion)
export const CREATOR_REGISTRY = CONTRACT_ADDRESSES.sepolia.creatorRegistry; // ✅ Real deployed address
export const LIBERTY_TOKEN = CONTRACT_ADDRESSES.sepolia.libertyToken;
export const CONTENT_REGISTRY = CONTRACT_ADDRESSES.sepolia.contentRegistry;

// Network configurations
export const SUPPORTED_NETWORKS = {
  localhost: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/7cddccd83fda404b941fe80581c76c0a',
  }
};

// Faucet URLs for testnet
export const FAUCET_URLS = {
  sepolia: 'https://sepoliafaucet.com',
};

// Helper function to open faucet (your mentor's suggestion)
export function openFaucet(network: string = 'sepolia') {
  const faucetUrl = FAUCET_URLS[network as keyof typeof FAUCET_URLS];
  if (faucetUrl) {
    window.open(faucetUrl, '_blank');
  }
}