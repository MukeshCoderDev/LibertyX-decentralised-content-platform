export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'rainbow' | 'phantom';

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  address?: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    libertyToken: string;
    creatorRegistry: string;
    contentRegistry: string;
    revenueSplitter: string;
    subscriptionManager: string;
    nftAccess: string;
    libertyDAO: string;
  };
}

export interface WalletContextType {
  account: string | null;
  chainId: number | null;
  balance: TokenBalance[];
  isConnected: boolean;
  isConnecting: boolean;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  error: string | null;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
}

export interface WalletError {
  code: number;
  message: string;
  type: 'connection' | 'network' | 'transaction' | 'permission';
}