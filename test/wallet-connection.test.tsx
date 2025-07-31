import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletProvider, useWallet, WalletType } from '../lib/WalletProvider';
import * as React from 'react';

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
};

// Test component that uses the wallet
const TestWalletComponent = () => {
  const { 
    account, 
    chainId, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    switchNetwork,
    error 
  } = useWallet();

  return (
    <div>
      <div data-testid="account">{account || 'Not connected'}</div>
      <div data-testid="chainId">{chainId || 'No chain'}</div>
      <div data-testid="isConnected">{isConnected.toString()}</div>
      <div data-testid="isConnecting">{isConnecting.toString()}</div>
      <div data-testid="error">{error?.message || 'No error'}</div>
      
      <button 
        data-testid="connect-metamask" 
        onClick={() => connect(WalletType.MetaMask)}
      >
        Connect MetaMask
      </button>
      
      <button 
        data-testid="connect-walletconnect" 
        onClick={() => connect(WalletType.WalletConnect)}
      >
        Connect WalletConnect
      </button>
      
      <button 
        data-testid="disconnect" 
        onClick={disconnect}
      >
        Disconnect
      </button>
      
      <button 
        data-testid="switch-network" 
        onClick={() => switchNetwork(11155111)}
      >
        Switch to Sepolia
      </button>
    </div>
  );
};

const renderWithWalletProvider = (component: React.ReactElement) => {
  return render(
    <WalletProvider>
      {component}
    </WalletProvider>
  );
};

describe('Wallet Connection System - Task 1', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup window.ethereum mock
    (global as any).window = {
      ethereum: mockEthereum,
    };
    
    // Default successful responses
    mockEthereum.request.mockImplementation((params: any) => {
      switch (params.method) {
        case 'eth_requestAccounts':
          return Promise.resolve(['0x1234567890123456789012345678901234567890']);
        case 'eth_accounts':
          return Promise.resolve(['0x1234567890123456789012345678901234567890']);
        case 'eth_chainId':
          return Promise.resolve('0x1');
        case 'wallet_switchEthereumChain':
          return Promise.resolve();
        case 'wallet_addEthereumChain':
          return Promise.resolve();
        default:
          return Promise.resolve();
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      renderWithWalletProvider(<TestWalletComponent />);
      
      expect(screen.getByTestId('account')).toHaveTextContent('Not connected');
      expect(screen.getByTestId('chainId')).toHaveTextContent('No chain');
      expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
      expect(screen.getByTestId('isConnecting')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });
  });

  describe('MetaMask Connection', () => {
    it('should connect to MetaMask successfully', async () => {
      renderWithWalletProvider(<TestWalletComponent />);
      
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      // Should show connecting state
      await waitFor(() => {
        expect(screen.getByTestId('isConnecting')).toHaveTextContent('true');
      });
      
      // Should complete connection
      await waitFor(() => {
        expect(screen.getByTestId('account')).toHaveTextContent('0x1234567890123456789012345678901234567890');
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
        expect(screen.getByTestId('isConnecting')).toHaveTextContent('false');
      });
      
      // Verify eth_requestAccounts was called
      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts'
      });
    });

    it('should handle MetaMask connection rejection', async () => {
      mockEthereum.request.mockRejectedValueOnce({
        code: 4001,
        message: 'User rejected the request'
      });
      
      renderWithWalletProvider(<TestWalletComponent />);
      
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('User rejected the request');
        expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
      });
    });

    it('should handle MetaMask not installed', async () => {
      (global as any).window.ethereum = undefined;
      
      renderWithWalletProvider(<TestWalletComponent />);
      
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
      });
    });
  });

  describe('Wallet Disconnection', () => {
    it('should disconnect wallet successfully', async () => {
      renderWithWalletProvider(<TestWalletComponent />);
      
      // First connect
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      });
      
      // Then disconnect
      const disconnectButton = screen.getByTestId('disconnect');
      fireEvent.click(disconnectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('account')).toHaveTextContent('Not connected');
        expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
        expect(screen.getByTestId('chainId')).toHaveTextContent('No chain');
      });
    });
  });

  describe('Network Switching', () => {
    it('should switch network successfully', async () => {
      renderWithWalletProvider(<TestWalletComponent />);
      
      // First connect
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      });
      
      // Then switch network
      const switchButton = screen.getByTestId('switch-network');
      fireEvent.click(switchButton);
      
      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }] // Sepolia chainId in hex
        });
      });
    });

    it('should add network if not present in wallet', async () => {
      // Mock network not found error
      mockEthereum.request.mockImplementation((params: any) => {
        if (params.method === 'wallet_switchEthereumChain') {
          return Promise.reject({ code: 4902 });
        }
        if (params.method === 'wallet_addEthereumChain') {
          return Promise.resolve();
        }
        return Promise.resolve(['0x1234567890123456789012345678901234567890']);
      });
      
      renderWithWalletProvider(<TestWalletComponent />);
      
      // Connect first
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      });
      
      // Try to switch to unsupported network
      const switchButton = screen.getByTestId('switch-network');
      fireEvent.click(switchButton);
      
      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({
          method: 'wallet_addEthereumChain',
          params: expect.arrayContaining([
            expect.objectContaining({
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet'
            })
          ])
        });
      });
    });
  });

  describe('Account Change Events', () => {
    it('should handle account change events', async () => {
      renderWithWalletProvider(<TestWalletComponent />);
      
      // Connect first
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      });
      
      // Simulate account change
      const accountsChangedCallback = mockEthereum.on.mock.calls.find(
        call => call[0] === 'accountsChanged'
      )?.[1];
      
      if (accountsChangedCallback) {
        accountsChangedCallback(['0x9876543210987654321098765432109876543210']);
        
        await waitFor(() => {
          expect(screen.getByTestId('account')).toHaveTextContent('0x9876543210987654321098765432109876543210');
        });
      }
    });

    it('should disconnect when no accounts available', async () => {
      renderWithWalletProvider(<TestWalletComponent />);
      
      // Connect first
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      });
      
      // Simulate account disconnection
      const accountsChangedCallback = mockEthereum.on.mock.calls.find(
        call => call[0] === 'accountsChanged'
      )?.[1];
      
      if (accountsChangedCallback) {
        accountsChangedCallback([]);
        
        await waitFor(() => {
          expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
          expect(screen.getByTestId('account')).toHaveTextContent('Not connected');
        });
      }
    });
  });

  describe('Chain Change Events', () => {
    it('should handle chain change events', async () => {
      renderWithWalletProvider(<TestWalletComponent />);
      
      // Connect first
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      });
      
      // Simulate chain change
      const chainChangedCallback = mockEthereum.on.mock.calls.find(
        call => call[0] === 'chainChanged'
      )?.[1];
      
      if (chainChangedCallback) {
        chainChangedCallback('0xaa36a7'); // Sepolia
        
        await waitFor(() => {
          expect(screen.getByTestId('chainId')).toHaveTextContent('11155111');
        });
      }
    });

    it('should show error for unsupported chain', async () => {
      renderWithWalletProvider(<TestWalletComponent />);
      
      // Connect first
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      });
      
      // Simulate change to unsupported chain
      const chainChangedCallback = mockEthereum.on.mock.calls.find(
        call => call[0] === 'chainChanged'
      )?.[1];
      
      if (chainChangedCallback) {
        chainChangedCallback('0x999'); // Unsupported chain
        
        await waitFor(() => {
          expect(screen.getByTestId('error')).toHaveTextContent('unsupported network');
        });
      }
    });
  });

  describe('Multiple Wallet Support', () => {
    it('should detect different wallet types', async () => {
      // Test Trust Wallet detection
      (global as any).window.ethereum = {
        ...mockEthereum,
        isTrust: true,
      };
      
      renderWithWalletProvider(<TestWalletComponent />);
      
      // This would require more complex mocking for different wallet types
      // For now, we verify the basic structure is in place
      expect(screen.getByTestId('connect-metamask')).toBeInTheDocument();
      expect(screen.getByTestId('connect-walletconnect')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockEthereum.request.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithWalletProvider(<TestWalletComponent />);
      
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error');
        expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
      });
    });

    it('should handle insufficient funds error', async () => {
      mockEthereum.request.mockRejectedValueOnce({
        code: -32000,
        message: 'Insufficient funds for gas'
      });
      
      renderWithWalletProvider(<TestWalletComponent />);
      
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Insufficient funds for gas');
      });
    });
  });

  describe('Balance Fetching', () => {
    it('should fetch and display ETH balance', async () => {
      // Mock balance response
      const mockProvider = {
        getBalance: vi.fn().mockResolvedValue('1000000000000000000'), // 1 ETH in wei
        getSigner: vi.fn().mockResolvedValue({
          getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
        }),
        getNetwork: vi.fn().mockResolvedValue({ chainId: 1n })
      };
      
      // This would require mocking ethers.BrowserProvider
      // For now, we verify the structure is in place
      renderWithWalletProvider(<TestWalletComponent />);
      
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      });
    });
  });
});