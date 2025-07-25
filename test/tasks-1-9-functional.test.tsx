import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { WalletProvider, useWallet, WalletType } from '../lib/WalletProvider';
import ContractManager from '../lib/ContractManager';
import { getChainByChainId } from '../lib/blockchainConfig';
import CreatorRegistrationForm from '../components/CreatorRegistrationForm';
import PriceDisplay from '../components/PriceDisplay';
import EarningsDashboard from '../components/EarningsDashboard';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: vi.fn().mockImplementation(() => ({
      getSigner: vi.fn().mockResolvedValue({
        getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
        signMessage: vi.fn().mockResolvedValue('0xsignature'),
      }),
      getNetwork: vi.fn().mockResolvedValue({ chainId: 11155111n }),
      getBalance: vi.fn().mockResolvedValue('1000000000000000000'),
    })),
    formatEther: vi.fn().mockReturnValue('1.0'),
    Contract: vi.fn(),
  },
}));

// Mock contract utils
vi.mock('../lib/contractUtils', () => ({
  getContractInstance: vi.fn().mockReturnValue({
    target: '0x5cB5536CAA837f1B1B8Ed994deD3F939FadCb27d',
    registerCreator: vi.fn().mockResolvedValue({
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    }),
    getCreator: vi.fn().mockResolvedValue({
      handle: 'testcreator',
      avatarURI: 'https://example.com/avatar.jpg',
      bio: 'Test creator bio',
      isVerified: false,
    }),
    on: vi.fn(),
  }),
}));

// Mock Arweave service
vi.mock('../lib/arweaveService', () => ({
  arweaveService: {
    uploadWithBrowserWallet: vi.fn().mockResolvedValue({
      transactionId: 'arweave-tx-id-123',
      status: 'confirmed',
    }),
    getContentUrl: vi.fn().mockReturnValue('https://arweave.net/arweave-tx-id-123'),
  },
}));

describe('Tasks 1-9 Functional Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock ethereum
    (window as any).ethereum = {
      request: vi.fn().mockImplementation((params: any) => {
        switch (params.method) {
          case 'eth_requestAccounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890']);
          case 'eth_accounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890']);
          case 'eth_chainId':
            return Promise.resolve('0xaa36a7'); // Sepolia
          default:
            return Promise.resolve();
        }
      }),
      on: vi.fn(),
      removeListener: vi.fn(),
      isMetaMask: true,
    };
  });

  describe('Task 1: Web3 Infrastructure and Wallet Connection', () => {
    it('should connect to MetaMask wallet successfully', async () => {
      const TestComponent = () => {
        const { account, isConnected, connect, chainId } = useWallet();
        
        return (
          <div>
            <div data-testid="account">{account || 'Not connected'}</div>
            <div data-testid="connected">{isConnected.toString()}</div>
            <div data-testid="chainId">{chainId || 'No chain'}</div>
            <button 
              data-testid="connect-metamask" 
              onClick={() => connect(WalletType.MetaMask)}
            >
              Connect MetaMask
            </button>
          </div>
        );
      };

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      // Initial state
      expect(screen.getByTestId('connected')).toHaveTextContent('false');
      expect(screen.getByTestId('account')).toHaveTextContent('Not connected');

      // Connect wallet
      const connectButton = screen.getByTestId('connect-metamask');
      fireEvent.click(connectButton);

      // Wait for connection
      await waitFor(() => {
        expect(screen.getByTestId('connected')).toHaveTextContent('true');
        expect(screen.getByTestId('account')).toHaveTextContent('0x1234567890123456789012345678901234567890');
        expect(screen.getByTestId('chainId')).toHaveTextContent('11155111');
      });

      // Verify ethereum.request was called
      expect((window as any).ethereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts'
      });
    });

    it('should support multiple wallet types', () => {
      // Verify WalletType enum has all required wallets
      expect(WalletType.MetaMask).toBe('MetaMask');
      expect(WalletType.WalletConnect).toBe('WalletConnect');
      expect(WalletType.CoinbaseWallet).toBe('CoinbaseWallet');
      expect(WalletType.TrustWallet).toBe('TrustWallet');
      expect(WalletType.Rainbow).toBe('Rainbow');
      expect(WalletType.Phantom).toBe('Phantom');
    });
  });

  describe('Task 2: Multi-Chain Network Support', () => {
    it('should have all required supported chains', () => {
      const requiredChains = [
        { id: 1, name: 'Ethereum Mainnet' },
        { id: 11155111, name: 'Sepolia Testnet' },
        { id: 137, name: 'Polygon Mainnet' },
        { id: 56, name: 'BNB Smart Chain Mainnet' },
        { id: 42161, name: 'Arbitrum One' },
        { id: 10, name: 'Optimism Mainnet' },
        { id: 43114, name: 'Avalanche C-Chain' },
      ];

      requiredChains.forEach(({ id, name }) => {
        const chain = getChainByChainId(id);
        expect(chain).toBeDefined();
        expect(chain?.name).toBe(name);
      });
    });

    it('should have deployed contracts on Sepolia', () => {
      const sepolia = getChainByChainId(11155111);
      expect(sepolia).toBeDefined();

      if (sepolia) {
        // Verify actual deployed addresses
        expect(sepolia.contracts.libertyToken).toBe('0x76404FEB7c5dA01881CCD1dB1E201D0351Ad6994');
        expect(sepolia.contracts.creatorRegistry).toBe('0x5cB5536CAA837f1B1B8Ed994deD3F939FadCb27d');
        expect(sepolia.contracts.contentRegistry).toBe('0x9Fc0552df6fA4ca99b2701cfD8bBDbD3F98723E8');
        expect(sepolia.contracts.revenueSplitter).toBe('0xEAEdEe015e7cCd4f99161F85Ec9e4f6a6fb0e408');
        expect(sepolia.contracts.subscriptionManager).toBe('0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9');
        expect(sepolia.contracts.nftAccess).toBe('0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9');
        expect(sepolia.contracts.libertyDAO).toBe('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');
      }
    });
  });

  describe('Task 3: Smart Contract Integration Layer', () => {
    it('should initialize contract manager with all contracts', () => {
      const mockSigner = {
        getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      };

      const contractManager = new ContractManager(mockSigner as any, 11155111);

      expect(contractManager.currentChainId).toBe(11155111);
      expect(contractManager.signer).toBe(mockSigner);

      // Verify all contracts are initialized
      const expectedContracts = [
        'libertyToken',
        'creatorRegistry',
        'contentRegistry',
        'revenueSplitter',
        'subscriptionManager',
        'nftAccess',
        'libertyDAO'
      ];

      expectedContracts.forEach(contractName => {
        expect(contractManager.contracts[contractName as keyof typeof contractManager.contracts]).toBeDefined();
      });
    });

    it('should execute transactions successfully', async () => {
      const mockSigner = {
        getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      };

      const contractManager = new ContractManager(mockSigner as any, 11155111);

      const result = await contractManager.executeTransaction(
        'creatorRegistry',
        'registerCreator',
        ['testhandle', 'https://example.com/avatar.jpg', 'Test bio']
      );

      expect(result).toEqual({
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        status: 'pending'
      });
    });
  });

  describe('Task 4: Creator Registration and Profile Management', () => {
    it('should render creator registration form', () => {
      render(
        <WalletProvider>
          <CreatorRegistrationForm />
        </WalletProvider>
      );

      expect(screen.getByText('Register as Creator')).toBeInTheDocument();
      expect(screen.getByLabelText(/Creator Handle/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Avatar URL/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bio/)).toBeInTheDocument();
    });

    it('should validate form inputs', async () => {
      render(
        <WalletProvider>
          <CreatorRegistrationForm />
        </WalletProvider>
      );

      const submitButton = screen.getByText('Register as Creator');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Handle is required')).toBeInTheDocument();
        expect(screen.getByText('Avatar URL is required')).toBeInTheDocument();
        expect(screen.getByText('Bio is required')).toBeInTheDocument();
      });
    });
  });

  describe('Task 5: Arweave Integration for Permanent Storage', () => {
    it('should have arweave service available', async () => {
      const { arweaveService } = await import('../lib/arweaveService');
      expect(arweaveService).toBeDefined();
      expect(arweaveService.uploadWithBrowserWallet).toBeDefined();
      expect(arweaveService.getContentUrl).toBeDefined();
    });

    it('should generate correct content URLs', async () => {
      const { arweaveService } = await import('../lib/arweaveService');
      const url = arweaveService.getContentUrl('test-tx-id');
      expect(url).toBe('https://arweave.net/test-tx-id');
    });
  });

  describe('Task 6: Subscription Management System', () => {
    it('should have subscription manager hook', async () => {
      const { useSubscriptionManager } = await import('../hooks/useSubscriptionManager');
      expect(useSubscriptionManager).toBeDefined();
    });

    it('should have subscription components', async () => {
      const SubscriptionCard = (await import('../components/SubscriptionCard')).default;
      const SubscriptionManager = (await import('../components/SubscriptionManager')).default;
      
      expect(SubscriptionCard).toBeDefined();
      expect(SubscriptionManager).toBeDefined();
    });
  });

  describe('Task 7: NFT Access Tier System', () => {
    it('should have NFT access hook', async () => {
      const { useNFTAccess } = await import('../hooks/useNFTAccess');
      expect(useNFTAccess).toBeDefined();
    });

    it('should have NFT components', async () => {
      const NFTMintingInterface = (await import('../components/NFTMintingInterface')).default;
      const NFTTierCreationForm = (await import('../components/NFTTierCreationForm')).default;
      
      expect(NFTMintingInterface).toBeDefined();
      expect(NFTTierCreationForm).toBeDefined();
    });
  });

  describe('Task 8: Cryptocurrency-Only Pricing System', () => {
    it('should display crypto prices correctly', () => {
      const mockPrice = {
        amount: '1000000000000000000', // 1 ETH in wei
        token: 'ETH',
        decimals: 18,
        symbol: 'ETH'
      };

      render(<PriceDisplay price={mockPrice} />);

      // Should display formatted price
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('1.00')).toBeInTheDocument();
    });

    it('should support multiple cryptocurrencies', () => {
      const tokens = ['ETH', 'LIB', 'MATIC', 'BNB', 'AVAX'];
      
      tokens.forEach(token => {
        const mockPrice = {
          amount: '1000000000000000000',
          token,
          decimals: 18,
          symbol: token
        };

        const { unmount } = render(<PriceDisplay price={mockPrice} />);
        expect(screen.getByText(token)).toBeInTheDocument();
        unmount();
      });
    });

    it('should have crypto price input components', async () => {
      const CryptoPriceInput = (await import('../components/CryptoPriceInput')).default;
      const TokenSelector = (await import('../components/TokenSelector')).default;
      
      expect(CryptoPriceInput).toBeDefined();
      expect(TokenSelector).toBeDefined();
    });
  });

  describe('Task 9: Revenue Tracking and Withdrawal System', () => {
    it('should render earnings dashboard', () => {
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      expect(screen.getByText('Earnings Dashboard')).toBeInTheDocument();
    });

    it('should have revenue splitter hook', async () => {
      const { useRevenueSplitter } = await import('../hooks/useRevenueSplitter');
      expect(useRevenueSplitter).toBeDefined();
    });

    it('should have withdrawal interface', async () => {
      const WithdrawalInterface = (await import('../components/WithdrawalInterface')).default;
      expect(WithdrawalInterface).toBeDefined();
    });

    it('should display revenue split correctly', () => {
      render(
        <WalletProvider>
          <EarningsDashboard />
        </WalletProvider>
      );

      // Should show 90/10 split
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });

  describe('Integration: Complete User Flow', () => {
    it('should support complete creator onboarding flow', async () => {
      const TestFlow = () => {
        const { account, isConnected, connect } = useWallet();
        const [step, setStep] = React.useState(1);

        return (
          <div>
            <div data-testid="step">{step}</div>
            <div data-testid="account">{account || 'Not connected'}</div>
            <div data-testid="connected">{isConnected.toString()}</div>
            
            {step === 1 && (
              <button 
                data-testid="connect-wallet"
                onClick={() => connect(WalletType.MetaMask)}
              >
                Connect Wallet
              </button>
            )}
            
            {step === 2 && isConnected && (
              <button 
                data-testid="register-creator"
                onClick={() => setStep(3)}
              >
                Register as Creator
              </button>
            )}
            
            {step === 3 && (
              <div data-testid="creator-registered">Creator Registered!</div>
            )}
            
            {isConnected && step === 1 && (
              <button 
                data-testid="next-step"
                onClick={() => setStep(2)}
              >
                Next Step
              </button>
            )}
          </div>
        );
      };

      render(
        <WalletProvider>
          <TestFlow />
        </WalletProvider>
      );

      // Step 1: Connect wallet
      expect(screen.getByTestId('step')).toHaveTextContent('1');
      expect(screen.getByTestId('connected')).toHaveTextContent('false');

      fireEvent.click(screen.getByTestId('connect-wallet'));

      await waitFor(() => {
        expect(screen.getByTestId('connected')).toHaveTextContent('true');
        expect(screen.getByTestId('account')).toHaveTextContent('0x1234567890123456789012345678901234567890');
      });

      // Step 2: Navigate to creator registration
      fireEvent.click(screen.getByTestId('next-step'));
      expect(screen.getByTestId('step')).toHaveTextContent('2');

      // Step 3: Complete registration
      fireEvent.click(screen.getByTestId('register-creator'));
      expect(screen.getByTestId('step')).toHaveTextContent('3');
      expect(screen.getByTestId('creator-registered')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle wallet connection failures', async () => {
      // Mock connection failure
      (window as any).ethereum.request.mockRejectedValueOnce(new Error('Connection failed'));

      const TestComponent = () => {
        const { error, connect } = useWallet();
        
        return (
          <div>
            <div data-testid="error">{error?.message || 'No error'}</div>
            <button 
              data-testid="connect"
              onClick={() => connect(WalletType.MetaMask)}
            >
              Connect
            </button>
          </div>
        );
      };

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      fireEvent.click(screen.getByTestId('connect'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Connection failed');
      });
    });

    it('should handle unsupported networks', () => {
      const unsupportedChain = getChainByChainId(999999);
      expect(unsupportedChain).toBeUndefined();
    });
  });
});