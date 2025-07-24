import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { TokenBalance, Chain, WalletError } from './web3-types';
import { SUPPORTED_CHAINS, getChainByChainId } from './blockchainConfig';
import WalletConnectProvider from '@walletconnect/web3-provider';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

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
interface WalletContextType {
  account: string | null;
  chainId: number | null;
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

const WalletContext = createContext<WalletContextType | undefined>(undefined);

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


  const connect = useCallback(async (walletType: WalletType) => {
    setIsConnecting(true);
    try {
      let provider: ethers.BrowserProvider | undefined;

      if (walletType === WalletType.MetaMask && (window as any).ethereum) {
        provider = new ethers.BrowserProvider((window as any).ethereum);
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      } else if (walletType === WalletType.WalletConnect) {
        const wcProvider = new WalletConnectProvider({
          rpc: SUPPORTED_CHAINS.reduce((acc: { [key: number]: string }, chain: Chain) => {
            acc[chain.chainId] = chain.rpcUrl;
            return acc;
          }, {}),
          qrcode: true,
        });
        await wcProvider.enable();
        provider = new ethers.BrowserProvider(wcProvider);
      } else if (walletType === WalletType.CoinbaseWallet) {
        const coinbaseWallet = new CoinbaseWalletSDK({
          appName: 'LibertyX',
          appLogoUrl: 'https://example.com/logo.png', // Replace with your app logo
        });
        const cbProvider = coinbaseWallet.makeWeb3Provider();
        provider = new ethers.BrowserProvider(cbProvider);
        await cbProvider.request({ method: 'eth_requestAccounts' });
      } else if (walletType === WalletType.TrustWallet && (window as any).ethereum && (window as any).ethereum.isTrust) {
        provider = new ethers.BrowserProvider((window as any).ethereum);
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      } else if (walletType === WalletType.Rainbow && (window as any).ethereum && (window as any).ethereum.isRainbow) {
        provider = new ethers.BrowserProvider((window as any).ethereum);
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      } else if (walletType === WalletType.Phantom && (window as any).ethereum && (window as any).ethereum.isPhantom) {
        // Phantom is primarily a Solana wallet, but if it supports EVM and injects window.ethereum, this will work.
        // More robust integration might require @phantom-auth/sdk or similar for full features.
        provider = new ethers.BrowserProvider((window as any).ethereum);
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      }
      // If none of the above, it's an unsupported or unhandled wallet type.
      else {
        console.warn(`Wallet type ${walletType} not supported or detected.`);
        alert(`Wallet type ${walletType} is not supported or detected. Please ensure the wallet extension is installed and active.`);
        setIsConnecting(false);
        return;
      }

      if (provider) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        const currentChainId = Number(network.chainId);

        setAccount(address);
        setChainId(currentChainId);
        setCurrentChain(getChainByChainId(currentChainId));
        setIsConnected(true);
        setError(null);

        // Fetch balance (placeholder for now, will implement proper token balance fetching later)
        const ethBalance = ethers.formatEther(await provider.getBalance(address));
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
      setError({
        code: err.code || -1,
        message: err.message || 'An unknown error occurred during connection.',
        type: 'connection',
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setCurrentChain(undefined);
    setBalance([]);
    setIsConnected(false);
    setError(null);
    console.log('Wallet disconnected.');
  }, []);

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
    if (!account || !isConnected) {
      throw new Error('No wallet connected to sign message.');
    }
    if (!(window as any).ethereum) {
      throw new Error('MetaMask is not installed.');
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
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
  }, [account, isConnected]);

  useEffect(() => {
    const { ethereum } = window as any;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        // Re-fetch balance and network if account changes
        if (ethereum) {
          const provider = new ethers.BrowserProvider(ethereum);
          provider.getBalance(accounts[0]).then(bal => {
            setBalance([{ symbol: 'ETH', balance: ethers.formatEther(bal), decimals: 18 }]);
          });
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
    };
    if (ethereum) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      // Initial check if already connected
      ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          connect(WalletType.MetaMask); // Attempt to connect if accounts exist
        }
      });
    }

    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [connect, disconnect, account]);

  const value = {
    account,
    chainId,
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