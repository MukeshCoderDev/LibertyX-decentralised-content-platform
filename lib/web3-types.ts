export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'rainbow' | 'phantom';

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  address?: string;
}

export interface Chain {
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
    tipJar: string; // Added TipJar contract
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

export interface ContractManager {
  contracts: {
    libertyToken: any; // ethers.Contract;
    creatorRegistry: any; // ethers.Contract;
    contentRegistry: any; // ethers.Contract;
    revenueSplitter: any; // ethers.Contract;
    subscriptionManager: any; // ethers.Contract;
    nftAccess: any; // ethers.Contract;
    libertyDAO: any; // ethers.Contract;
    tipJar: any; // Added TipJar contract
  };
  getContract: (name: keyof Chain['contracts'], chainId: number) => any; // ethers.Contract;
  executeTransaction: (contractName: keyof Chain['contracts'], method: string, params: any[]) => Promise<TransactionResult>;
  listenToEvents: (contractName: keyof Chain['contracts'], eventName: string, callback: Function) => void;
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