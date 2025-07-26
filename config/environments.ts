export interface EnvironmentConfig {
  name: string;
  apiUrl: string;
  rpcUrls: {
    [chainId: number]: string[];
  };
  contractAddresses: {
    [chainId: number]: {
      libertyToken: string;
      creatorRegistry: string;
      contentRegistry: string;
      revenueSplitter: string;
      subscriptionManager: string;
      nftAccess: string;
      libertyDAO: string;
    };
  };
  arweave: {
    host: string;
    port: number;
    protocol: string;
  };
  monitoring: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
  };
  features: {
    crossChainBridge: boolean;
    aiRecommendations: boolean;
    enterpriseFeatures: boolean;
  };
}

export const environments: { [key: string]: EnvironmentConfig } = {
  development: {
    name: 'Development',
    apiUrl: 'http://localhost:3001',
    rpcUrls: {
      1: ['http://localhost:8545'], // Local Ethereum
      137: ['http://localhost:8546'], // Local Polygon
      11155111: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'], // Sepolia testnet
    },
    contractAddresses: {
      11155111: {
        libertyToken: '0x0000000000000000000000000000000000000000',
        creatorRegistry: '0x0000000000000000000000000000000000000000',
        contentRegistry: '0x0000000000000000000000000000000000000000',
        revenueSplitter: '0x0000000000000000000000000000000000000000',
        subscriptionManager: '0x0000000000000000000000000000000000000000',
        nftAccess: '0x0000000000000000000000000000000000000000',
        libertyDAO: '0x0000000000000000000000000000000000000000',
      },
    },
    arweave: {
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    },
    monitoring: {
      enabled: false,
    },
    features: {
      crossChainBridge: true,
      aiRecommendations: true,
      enterpriseFeatures: true,
    },
  },
  staging: {
    name: 'Staging',
    apiUrl: 'https://api-staging.libertyx.io',
    rpcUrls: {
      1: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
      137: ['https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY'],
      42161: ['https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY'],
      10: ['https://optimism-mainnet.infura.io/v3/YOUR_INFURA_KEY'],
      56: ['https://bsc-dataseed.binance.org/'],
      43114: ['https://api.avax.network/ext/bc/C/rpc'],
    },
    contractAddresses: {
      1: {
        libertyToken: '0x0000000000000000000000000000000000000000',
        creatorRegistry: '0x0000000000000000000000000000000000000000',
        contentRegistry: '0x0000000000000000000000000000000000000000',
        revenueSplitter: '0x0000000000000000000000000000000000000000',
        subscriptionManager: '0x0000000000000000000000000000000000000000',
        nftAccess: '0x0000000000000000000000000000000000000000',
        libertyDAO: '0x0000000000000000000000000000000000000000',
      },
      137: {
        libertyToken: '0x0000000000000000000000000000000000000000',
        creatorRegistry: '0x0000000000000000000000000000000000000000',
        contentRegistry: '0x0000000000000000000000000000000000000000',
        revenueSplitter: '0x0000000000000000000000000000000000000000',
        subscriptionManager: '0x0000000000000000000000000000000000000000',
        nftAccess: '0x0000000000000000000000000000000000000000',
        libertyDAO: '0x0000000000000000000000000000000000000000',
      },
    },
    arweave: {
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    },
    monitoring: {
      enabled: true,
      endpoint: 'https://monitoring-staging.libertyx.io',
      apiKey: process.env.MONITORING_API_KEY,
    },
    features: {
      crossChainBridge: true,
      aiRecommendations: true,
      enterpriseFeatures: true,
    },
  },
  production: {
    name: 'Production',
    apiUrl: 'https://api.libertyx.io',
    rpcUrls: {
      1: [
        'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
        'https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY',
        'https://mainnet.infura.io/v3/BACKUP_INFURA_KEY',
      ],
      137: [
        'https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY',
        'https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
      ],
      42161: ['https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY'],
      10: ['https://optimism-mainnet.infura.io/v3/YOUR_INFURA_KEY'],
      56: ['https://bsc-dataseed.binance.org/', 'https://bsc-dataseed1.defibit.io/'],
      43114: ['https://api.avax.network/ext/bc/C/rpc'],
    },
    contractAddresses: {
      1: {
        libertyToken: '0x0000000000000000000000000000000000000000',
        creatorRegistry: '0x0000000000000000000000000000000000000000',
        contentRegistry: '0x0000000000000000000000000000000000000000',
        revenueSplitter: '0x0000000000000000000000000000000000000000',
        subscriptionManager: '0x0000000000000000000000000000000000000000',
        nftAccess: '0x0000000000000000000000000000000000000000',
        libertyDAO: '0x0000000000000000000000000000000000000000',
      },
      137: {
        libertyToken: '0x0000000000000000000000000000000000000000',
        creatorRegistry: '0x0000000000000000000000000000000000000000',
        contentRegistry: '0x0000000000000000000000000000000000000000',
        revenueSplitter: '0x0000000000000000000000000000000000000000',
        subscriptionManager: '0x0000000000000000000000000000000000000000',
        nftAccess: '0x0000000000000000000000000000000000000000',
        libertyDAO: '0x0000000000000000000000000000000000000000',
      },
    },
    arweave: {
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    },
    monitoring: {
      enabled: true,
      endpoint: 'https://monitoring.libertyx.io',
      apiKey: process.env.MONITORING_API_KEY,
    },
    features: {
      crossChainBridge: true,
      aiRecommendations: true,
      enterpriseFeatures: true,
    },
  },
};

export const getCurrentEnvironment = (): EnvironmentConfig => {
  const env = process.env.NODE_ENV || 'development';
  return environments[env] || environments.development;
};

export const getEnvironmentByName = (name: string): EnvironmentConfig => {
  return environments[name] || environments.development;
};