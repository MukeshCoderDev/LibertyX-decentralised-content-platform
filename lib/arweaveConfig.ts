import Arweave from 'arweave';

// Arweave configuration for different environments
export const arweaveConfig = {
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 20000,
  logging: false,
};

// Initialize Arweave client
export const arweave = Arweave.init(arweaveConfig);

// Arweave transaction types
export interface ArweaveUploadResult {
  transactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  size: number;
  contentType: string;
  timestamp: number;
}

export interface ArweaveUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ArweaveError {
  code: string;
  message: string;
  details?: any;
}

// Content metadata structure for on-chain storage
export interface ContentMetadata {
  arweaveId: string;
  title: string;
  description: string;
  contentType: string;
  size: number;
  price: string; // In wei
  accessLevel: 'public' | 'subscription' | 'nft' | 'premium';
  nftTierRequired?: number;
  tags: string[];
  thumbnail?: string; // Optional thumbnail Arweave ID
  duration?: number; // For video content
  createdAt: number;
}

// Arweave transaction tags for better organization
export const createArweaveTags = (metadata: Partial<ContentMetadata>) => {
  const tags = [
    { name: 'App-Name', value: 'LibertyX' },
    { name: 'App-Version', value: '1.0.0' },
    { name: 'Content-Type', value: metadata.contentType || 'application/octet-stream' },
    { name: 'Title', value: metadata.title || 'Untitled' },
    { name: 'Access-Level', value: metadata.accessLevel || 'public' },
    { name: 'Created-At', value: Date.now().toString() },
  ];

  // Add optional tags
  if (metadata.description) {
    tags.push({ name: 'Description', value: metadata.description });
  }
  
  if (metadata.tags && metadata.tags.length > 0) {
    tags.push({ name: 'Tags', value: metadata.tags.join(',') });
  }

  if (metadata.nftTierRequired) {
    tags.push({ name: 'NFT-Tier', value: metadata.nftTierRequired.toString() });
  }

  if (metadata.duration) {
    tags.push({ name: 'Duration', value: metadata.duration.toString() });
  }

  return tags;
};

// Helper function to estimate Arweave cost
export const estimateArweaveCost = async (dataSize: number): Promise<string> => {
  try {
    const cost = await arweave.transactions.getPrice(dataSize);
    return arweave.ar.winstonToAr(cost);
  } catch (error) {
    console.error('Error estimating Arweave cost:', error);
    return '0';
  }
};

// Helper function to check transaction status
export const checkTransactionStatus = async (txId: string): Promise<'pending' | 'confirmed' | 'failed'> => {
  try {
    const status = await arweave.transactions.getStatus(txId);
    
    if (status.status === 200) {
      return 'confirmed';
    } else if (status.status === 202) {
      return 'pending';
    } else {
      return 'failed';
    }
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return 'failed';
  }
};