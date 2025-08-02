import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers, Signer, Provider } from 'ethers'; // Import Signer and Provider
import { TokenBalance, Chain, WalletError } from './web3-types';
import { SUPPORTED_CHAINS, getChainByChainId } from './blockchainConfig';
// Import WalletConnect and Coinbase with error handling
let WalletConnectProvider: any;
let CoinbaseWalletSDK: any;

try {
  WalletConnectProvider = require('@walletconnect/web3-provider').default;
} catch (error) {
  console.warn('WalletConnect not available:', error);
}

try {
  CoinbaseWalletSDK = require('@coinbase/wallet-sdk').default;
} catch (error) {
  console.warn('Coinbase Wallet SDK not available:', error);
}

// Define WalletType enum for supported wallets
export enum WalletType {
  MetaMask = 'MetaMask',
  WalletConnect = 'WalletConnect',
  CoinbaseWallet = 'CoinbaseWallet',
  TrustWallet = 'TrustWallet',
  Rainbow = 'Rainbow',
  Phantom = 'Phantom',
}

// WalletContextType interface as per design document
export interface WalletContextType { // Export the interface
  account: string | null;
  chainId: number | null;
  signer: Signer | null; // Add signer
  provider: Provider | null; // Add provider
  currentChain: Chain | undefined;
  balance: TokenBalance[];
  isConnected: boolean;
  isConnecting: boolean;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  error: WalletError | null;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined); // Export the context

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<TokenBalance[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<WalletError | null>(null);
  const [currentChain, setCurrentChain] = useState<Chain | undefined>(undefined);
  const [signer, setSigner] = useState<Signer | null>(null); // New state for signer
  const [provider, setProvider] = useState<Provider | null>(null); // New state for provider


  const connect = useCallback(async (walletType: WalletType) => {
    setIsConnecting(true);
    try {
      let ethProvider: ethers.BrowserProvider | undefined;

      if (walletType === WalletType.MetaMask && (window as any).ethereum) {
        ethProvider = new ethers.BrowserProvider((window as any).ethereum);
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      } else if (walletType === WalletType.WalletConnect) {
        if (!WalletConnectProvider) {
          throw new Error('WalletConnect is not available. Please install the required dependencies.');
        }
        const wcProvider = new WalletConnectProvider({
          rpc: SUPPORTED_CHAINS.reduce((acc: { [key: number]: string }, chain: Chain) => {
            acc[chain.chainId] = chain.rpcUrl;
            return acc;
          }, {}),
          qrcode: true,
        });
        await wcProvider.enable();
        ethProvider = new ethers.BrowserProvider(wcProvider);
      } else if (walletType === WalletType.CoinbaseWallet) {
        if (!CoinbaseWalletSDK) {
          throw new Error('Coinbase Wallet SDK is not available. Please install the required dependencies.');
        }
        const coinbaseWallet = new CoinbaseWalletSDK({
          appName: 'LibertyX',
          appLogoUrl: 'https://example.com/logo.png', // Replace with your app logo
        });
        const cbProvider = coinbaseWallet.makeWeb3Provider();
        ethProvider = new ethers.BrowserProvider(cbProvider);
        await cbProvider.request({ method: 'eth_requestAccounts' });
      } else if (walletType === WalletType.TrustWallet && (window as any).ethereum && (window as any).ethereum.isTrust) {
        ethProvider = new ethers.BrowserProvider((window as any).ethereum);
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      } else if (walletType === WalletType.Rainbow && (window as any).ethereum && (window as any).ethereum.isRainbow) {
        ethProvider = new ethers.BrowserProvider((window as any).ethereum);
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      } else if (walletType === WalletType.Phantom && (window as any).ethereum && (window as any).ethereum.isPhantom) {
        // Phantom is primarily a Solana wallet, but if it supports EVM and injects window.ethereum, this will work.
        // More robust integration might require @phantom-auth/sdk or similar for full features.
        ethProvider = new ethers.BrowserProvider((window as any).ethereum);
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      }
      // If none of the above, it's an unsupported or unhandled wallet type.
      else {
        console.warn(`Wallet type ${walletType} not supported or detected.`);
        alert(`Wallet type ${walletType} is not supported or detected. Please ensure the wallet extension is installed and active.`);
        setIsConnecting(false);
        return;
      }

      if (ethProvider) {
        const currentSigner = await ethProvider.getSigner();
        const address = await currentSigner.getAddress();
        const network = await ethProvider.getNetwork();
        const currentChainId = Number(network.chainId);

        setAccount(address);
        setChainId(currentChainId);
        setCurrentChain(getChainByChainId(currentChainId));
        setSigner(currentSigner); // Set signer state
        setProvider(ethProvider); // Set provider state
        setIsConnected(true);
        setError(null);

        // Fetch balance (placeholder for now, will implement proper token balance fetching later)
        const ethBalance = ethers.formatEther(await ethProvider.getBalance(address));
        setBalance([{ symbol: 'ETH', balance: ethBalance, decimals: 18 }]); // Placeholder, will be dynamic

        // Check for supported network
        if (!getChainByChainId(currentChainId)) {
          setError({
            code: 4901, // Custom code for unsupported network
            message: `Unsupported network detected. Please switch to a supported network.`,
            type: 'network',
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setIsConnected(false);
      setAccount(null);
      setChainId(null);
      setBalance([]);
      setSigner(null); // Clear signer state on error
      setProvider(null); // Clear provider state on error
      setError({
        code: err.code || -1,
        message: err.message || 'An unknown error occurred during connection.',
        type: 'connection',
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => { // Make it async
    setAccount(null);
    setChainId(null);
    setCurrentChain(undefined);
    setBalance([]);
    setSigner(null); // Clear signer state on disconnect
    setProvider(null); // Clear provider state on disconnect
    setIsConnected(false);
    setError(null);
    console.log('Wallet disconnected.');

    // Attempt to disconnect from wallet provider (e.g., MetaMask)
    if ((window as any).ethereum && (window as any).ethereum.isMetaMask) {
      try {
        // MetaMask's recommended way to "disconnect" from the dApp's perspective
        // This revokes permissions for the current origin
        await (window as any).ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }] // Revoke eth_accounts permission
        });
        console.log('MetaMask permissions revoked for this origin.');
      } catch (err) {
        console.error('Failed to revoke MetaMask permissions:', err);
        // Handle error, but don't block the internal disconnect
      }
    } else if (provider && (provider as any).disconnect) {
      // For WalletConnect and similar providers that might have a disconnect method
      try {
        await (provider as any).disconnect();
        console.log('Provider disconnected.');
      } catch (err) {
        console.error('Failed to disconnect provider:', err);
      }
    }
  }, [provider]); // Add provider to dependencies

  const switchNetwork = useCallback(async (targetChainId: number) => {
    setError(null); // Clear previous errors
    const targetChain = getChainByChainId(targetChainId);

    if (!targetChain) {
      setError({
        code: 4902, // Custom code for unknown chain
        message: `Chain with ID ${targetChainId} is not supported.`,
        type: 'network',
      });
      return;
    }

    if (!(window as any).ethereum) {
      setError({
        code: -1,
        message: 'No Ethereum wallet detected. Please install MetaMask or another compatible wallet.',
        type: 'connection',
      });
      return;
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      // If switch is successful, chainChanged event will update state
      // The useEffect below will handle updating signer/provider based on new chainId
    } catch (err: any) {
      console.error('Failed to switch network:', err);
      if (err.code === 4902) {
        // Chain not added to wallet, try adding it
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: targetChain.name,
                rpcUrls: [targetChain.rpcUrl],
                nativeCurrency: targetChain.nativeCurrency,
                blockExplorerUrls: [targetChain.blockExplorer],
              },
            ],
          });
          // If adding is successful, chainChanged event will update state
        } catch (addError: any) {
          console.error('Failed to add network:', addError);
          setError({
            code: addError.code || -1,
            message: addError.message || 'Failed to add network to wallet.',
            type: 'network',
          });
        }
      } else {
        setError({
          code: err.code || -1,
          message: err.message || 'Failed to switch network.',
          type: 'network',
        });
      }
    }
  }, []);

  const signMessage = useCallback(async (message: string) => {
    if (!account || !isConnected || !signer) { // Ensure signer is available
      throw new Error('No wallet connected or signer available to sign message.');
    }
    try {
      const signature = await signer.signMessage(message);
      return signature;
    } catch (err: any) {
      console.error('Failed to sign message:', err);
      setError({
        code: err.code || -1,
        message: err.message || 'Failed to sign message.',
        type: 'transaction',
      });
      throw err; // Re-throw to allow component to handle
    }
  }, [account, isConnected, signer]); // Add signer to dependencies

  useEffect(() => {
    const { ethereum } = window as any;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        // Re-fetch balance and network if account changes
        if (ethereum) {
          const currentProvider = new ethers.BrowserProvider(ethereum);
          currentProvider.getBalance(accounts[0]).then(bal => {
            setBalance([{ symbol: 'ETH', balance: ethers.formatEther(bal), decimals: 18 }]);
          });
          // Update signer and provider on account change
          currentProvider.getSigner().then(setSigner).catch(console.error);
          setProvider(currentProvider);
        }
      }
    };

    const handleChainChanged = (hexChainId: string) => {
      const newChainId = Number(hexChainId);
      setChainId(newChainId);
      setCurrentChain(getChainByChainId(newChainId));
      if (!getChainByChainId(newChainId)) {
        setError({
          code: 4901,
          message: `Switched to unsupported network (Chain ID: ${newChainId}). Please switch to a supported network.`,
          type: 'network',
        });
      } else {
        setError(null); // Clear network error if switched to supported chain
      }
      // Update signer and provider on chain change
      if (ethereum) {
        const currentProvider = new ethers.BrowserProvider(ethereum);
        currentProvider.getSigner().then(setSigner).catch(console.error);
        setProvider(currentProvider);
      }
    };
    if (ethereum) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      // Initial check if already connected
      ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          connect(WalletType.MetaMask); // Attempt to connect if accounts exist
        }
      }).catch((error: any) => {
        console.warn('Failed to check existing accounts:', error);
      });
    }

    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [connect, disconnect]); // Removed account from dependencies to avoid infinite loop, handled inside

  const value = {
    account,
    chainId,
    signer, // Include signer state
    provider, // Include provider state
    currentChain,
    balance,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    switchNetwork,
    signMessage,
    error,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};