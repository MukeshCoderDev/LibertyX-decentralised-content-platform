import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { TokenBalance, NetworkConfig } from './web3-types';
import { supportedNetworks } from './networks';
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
  balance: TokenBalance[];
  isConnected: boolean;
  isConnecting: boolean;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
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


  const connect = useCallback(async (walletType: WalletType) => {
    setIsConnecting(true);
    try {
      let provider: ethers.BrowserProvider | undefined;

      if (walletType === WalletType.MetaMask && (window as any).ethereum) {
        provider = new ethers.BrowserProvider((window as any).ethereum);
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      } else if (walletType === WalletType.WalletConnect) {
        const wcProvider = new WalletConnectProvider({
          rpc: supportedNetworks.reduce((acc: { [key: number]: string }, network: NetworkConfig) => {
            acc[network.chainId] = network.rpcUrl;
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
        setIsConnected(true);

        // Fetch balance (placeholder for now, will implement proper token balance fetching later)
        const ethBalance = ethers.formatEther(await provider.getBalance(address));
        setBalance([{ symbol: 'ETH', balance: ethBalance, decimals: 18 }]);

        // Check for supported network
        if (!supportedNetworks.some(net => net.chainId === currentChainId)) {
          alert(`Unsupported network detected. Please switch to a supported network like Sepolia.`);
          // Optionally prompt to switch here
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setIsConnected(false);
      setAccount(null);
      setChainId(null);
      setBalance([]);
      alert(`Wallet connection failed: ${(error as Error).message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [supportedNetworks]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setBalance([]);
    setIsConnected(false);
    console.log('Wallet disconnected.');
  }, []);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!(window as any).ethereum) {
      alert('MetaMask is not installed. Please install it to switch networks.');
      return;
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      // Network change will be detected by the 'chainChanged' event listener
    } catch (error) {
      console.error('Failed to switch network:', error);
      alert(`Failed to switch network: ${(error as any).message}`);
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
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error(`Failed to sign message: ${(error as Error).message}`);
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
      if (!supportedNetworks.some(net => net.chainId === newChainId)) {
        alert(`Switched to unsupported network (Chain ID: ${newChainId}). Please switch to a supported network like Sepolia.`);
      }
      // Re-initialize contracts or update UI based on new chainId
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
  }, [connect, disconnect, supportedNetworks]);

  const value = {
    account,
    chainId,
    balance,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    switchNetwork,
    signMessage,
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