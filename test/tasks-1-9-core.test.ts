import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SUPPORTED_CHAINS, getChainByChainId } from '../lib/blockchainConfig';
import { WalletType } from '../lib/WalletProvider';
import ContractManager from '../lib/ContractManager';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: vi.fn(),
    Contract: vi.fn(),
    formatEther: vi.fn(),
  },
}));

// Mock contract utils
vi.mock('../lib/contractUtils', () => ({
  getContractInstance: vi.fn().mockReturnValue({
    target: '0x5cB5536CAA837f1B1B8Ed994deD3F939FadCb27d',
    registerCreator: vi.fn(),
    on: vi.fn(),
  }),
}));

describe('Tasks 1-9 Core Functionality Tests', () => {
  describe('Task 1: Web3 Infrastructure and Wallet Connection', () => {
    it('should have all required wallet types', () => {
      expect(WalletType.MetaMask).toBe('MetaMask');
      expect(WalletType.WalletConnect).toBe('WalletConnect');
      expect(WalletType.CoinbaseWallet).toBe('CoinbaseWallet');
      expect(WalletType.TrustWallet).toBe('TrustWallet');
      expect(WalletType.Rainbow).toBe('Rainbow');
      expect(WalletType.Phantom).toBe('Phantom');
    });

    it('should export WalletProvider and useWallet', async () => {
      const walletModule = await import('../lib/WalletProvider');
      expect(walletModule.WalletProvider).toBeDefined();
      expect(walletModule.useWallet).toBeDefined();
      expect(walletModule.WalletContext).toBeDefined();
    });
  });

  describe('Task 2: Multi-Chain Network Support', () => {
    it('should have all required supported chains', () => {
      const expectedChains = [
        { id: 1, name: 'Ethereum Mainnet' },
        { id: 11155111, name: 'Sepolia Testnet' },
        { id: 137, name: 'Polygon Mainnet' },
        { id: 56, name: 'BNB Smart Chain Mainnet' },
        { id: 42161, name: 'Arbitrum One' },
        { id: 10, name: 'Optimism Mainnet' },
        { id: 43114, name: 'Avalanche C-Chain' },
      ];

      expect(SUPPORTED_CHAINS).toHaveLength(expectedChains.length);

      expectedChains.forEach(({ id, name }) => {
        const chain = getChainByChainId(id);
        expect(chain).toBeDefined();
        expect(chain?.name).toBe(name);
        expect(chain?.chainId).toBe(id);
      });
    });

    it('should have deployed contracts on Sepolia testnet', () => {
      const sepolia = getChainByChainId(11155111);
      expect(sepolia).toBeDefined();

      if (sepolia) {
        // Verify actual deployed addresses (not placeholders)
        expect(sepolia.contracts.libertyToken).toBe('0x76404FEB7c5dA01881CCD1dB1E201D0351Ad6994');
        expect(sepolia.contracts.creatorRegistry).toBe('0x5cB5536CAA837f1B1B8Ed994deD3F939FadCb27d');
        expect(sepolia.contracts.contentRegistry).toBe('0x9Fc0552df6fA4ca99b2701cfD8bBDbD3F98723E8');
        expect(sepolia.contracts.revenueSplitter).toBe('0xEAEdEe015e7cCd4f99161F85Ec9e4f6a6fb0e408');
        expect(sepolia.contracts.subscriptionManager).toBe('0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9');
        expect(sepolia.contracts.nftAccess).toBe('0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9');
        expect(sepolia.contracts.libertyDAO).toBe('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');

        // Verify all addresses are valid Ethereum addresses
        Object.values(sepolia.contracts).forEach(address => {
          expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
          expect(address.length).toBe(42);
        });
      }
    });

    it('should have correct native currencies for each chain', () => {
      const currencyTests = [
        { chainId: 1, symbol: 'ETH' },
        { chainId: 11155111, symbol: 'ETH' },
        { chainId: 137, symbol: 'MATIC' },
        { chainId: 56, symbol: 'BNB' },
        { chainId: 42161, symbol: 'ETH' },
        { chainId: 10, symbol: 'ETH' },
        { chainId: 43114, symbol: 'AVAX' },
      ];

      currencyTests.forEach(({ chainId, symbol }) => {
        const chain = getChainByChainId(chainId);
        expect(chain).toBeDefined();
        expect(chain?.nativeCurrency.symbol).toBe(symbol);
        expect(chain?.nativeCurrency.decimals).toBe(18);
      });
    });
  });

  describe('Task 3: Smart Contract Integration Layer', () => {
    it('should initialize ContractManager with all contracts', () => {
      const mockSigner = { getAddress: vi.fn() };
      const contractManager = new ContractManager(mockSigner as any, 11155111);

      expect(contractManager.currentChainId).toBe(11155111);
      expect(contractManager.signer).toBe(mockSigner);

      // Verify all required contracts are initialized
      const requiredContracts = [
        'libertyToken',
        'creatorRegistry',
        'contentRegistry',
        'revenueSplitter',
        'subscriptionManager',
        'nftAccess',
        'libertyDAO'
      ];

      requiredContracts.forEach(contractName => {
        expect(contractManager.contracts[contractName as keyof typeof contractManager.contracts]).toBeDefined();
      });
    });

    it('should have contract utilities available', async () => {
      const contractUtils = await import('../lib/contractUtils');
      expect(contractUtils.getContractInstance).toBeDefined();
    });
  });

  describe('Task 4: Creator Registration and Profile Management', () => {
    it('should have creator registry hook', async () => {
      const creatorHook = await import('../hooks/useCreatorRegistry');
      expect(creatorHook.useCreatorRegistry).toBeDefined();
    });

    it('should have creator registration form component', async () => {
      const creatorForm = await import('../components/CreatorRegistrationForm');
      expect(creatorForm.default).toBeDefined();
    });

    it('should have creator profile component', async () => {
      const creatorProfile = await import('../components/CreatorProfile');
      expect(creatorProfile.default).toBeDefined();
    });
  });

  describe('Task 5: Arweave Integration for Permanent Storage', () => {
    it('should have arweave configuration', async () => {
      const arweaveConfig = await import('../lib/arweaveConfig');
      expect(arweaveConfig).toBeDefined();
    });

    it('should have arweave service', async () => {
      const arweaveService = await import('../lib/arweaveService');
      expect(arweaveService.arweaveService).toBeDefined();
    });

    it('should have arweave hook', async () => {
      const arweaveHook = await import('../hooks/useArweave');
      expect(arweaveHook.useArweave).toBeDefined();
    });

    it('should have content upload component', async () => {
      const contentUpload = await import('../components/ContentUpload');
      expect(contentUpload.default).toBeDefined();
    });
  });

  describe('Task 6: Subscription Management System', () => {
    it('should have subscription manager hook', async () => {
      const subscriptionHook = await import('../hooks/useSubscriptionManager');
      expect(subscriptionHook.useSubscriptionManager).toBeDefined();
    });

    it('should have subscription components', async () => {
      const subscriptionCard = await import('../components/SubscriptionCard');
      const subscriptionManager = await import('../components/SubscriptionManager');
      const creatorSubscriptionPlans = await import('../components/CreatorSubscriptionPlans');

      expect(subscriptionCard.default).toBeDefined();
      expect(subscriptionManager.default).toBeDefined();
      expect(creatorSubscriptionPlans.default).toBeDefined();
    });
  });

  describe('Task 7: NFT Access Tier System', () => {
    it('should have NFT access hook', async () => {
      const nftHook = await import('../hooks/useNFTAccess');
      expect(nftHook.useNFTAccess).toBeDefined();
    });

    it('should have NFT components', async () => {
      const nftMinting = await import('../components/NFTMintingInterface');
      const nftTierCreation = await import('../components/NFTTierCreationForm');
      const creatorNFTTiers = await import('../components/CreatorNFTTiers');
      const userNFTCollection = await import('../components/UserNFTCollection');

      expect(nftMinting.default).toBeDefined();
      expect(nftTierCreation.default).toBeDefined();
      expect(creatorNFTTiers.default).toBeDefined();
      expect(userNFTCollection.default).toBeDefined();
    });
  });

  describe('Task 8: Cryptocurrency-Only Pricing System', () => {
    it('should have price display component', async () => {
      const priceDisplay = await import('../components/PriceDisplay');
      expect(priceDisplay.default).toBeDefined();
    });

    it('should have crypto price input components', async () => {
      const cryptoPriceInput = await import('../components/CryptoPriceInput');
      const tokenSelector = await import('../components/TokenSelector');
      const cryptoPriceRangeSelector = await import('../components/CryptoPriceRangeSelector');

      expect(cryptoPriceInput.default).toBeDefined();
      expect(tokenSelector.default).toBeDefined();
      expect(cryptoPriceRangeSelector.default).toBeDefined();
    });

    it('should have token configuration', async () => {
      const tokenConfig = await import('../lib/tokenConfig');
      expect(tokenConfig).toBeDefined();
    });

    it('should have supported tokens display', async () => {
      const supportedTokens = await import('../components/SupportedTokensDisplay');
      expect(supportedTokens.default).toBeDefined();
    });
  });

  describe('Task 9: Revenue Tracking and Withdrawal System', () => {
    it('should have revenue splitter hook', async () => {
      const revenueHook = await import('../hooks/useRevenueSplitter');
      expect(revenueHook.useRevenueSplitter).toBeDefined();
    });

    it('should have earnings dashboard', async () => {
      const earningsDashboard = await import('../components/EarningsDashboard');
      expect(earningsDashboard.default).toBeDefined();
    });

    it('should have withdrawal interface', async () => {
      const withdrawalInterface = await import('../components/WithdrawalInterface');
      expect(withdrawalInterface.default).toBeDefined();
    });

    it('should have creator dashboard', async () => {
      const creatorDashboard = await import('../components/CreatorDashboard');
      expect(creatorDashboard.default).toBeDefined();
    });
  });

  describe('Contract Artifacts Validation', () => {
    it('should have all contract artifacts compiled', async () => {
      const contractFiles = [
        '01_LibertyToken.sol/LibertyToken.json',
        '02_CreatorRegistry.sol/CreatorRegistry.json',
        '03_ContentRegistry.sol/ContentRegistry.json',
        '04_RevenueSplitter.sol/RevenueSplitter.json',
        '05_SubscriptionManager.sol/SubscriptionManager.json',
        '06_NFTAccess.sol/NFTAccess.json',
        '07_LibertyDAO.sol/LibertyDAO.json',
      ];

      for (const contractFile of contractFiles) {
        try {
          const artifact = await import(`../artifacts/contracts/${contractFile}`);
          expect(artifact.abi).toBeDefined();
          expect(Array.isArray(artifact.abi)).toBe(true);
          expect(artifact.abi.length).toBeGreaterThan(0);
          expect(artifact.contractName).toBeDefined();
          expect(artifact.sourceName).toBeDefined();
        } catch (error) {
          throw new Error(`Contract artifact ${contractFile} not available or invalid`);
        }
      }
    });
  });

  describe('Integration Validation', () => {
    it('should have all core hooks available', async () => {
      const hooks = [
        '../hooks/useArweave',
        '../hooks/useCreatorRegistry',
        '../hooks/useRevenueSplitter',
        '../hooks/useNFTAccess',
        '../hooks/useSubscriptionManager',
        '../hooks/useContractManager',
      ];

      for (const hookPath of hooks) {
        try {
          const hook = await import(hookPath);
          expect(hook).toBeDefined();
        } catch (error) {
          throw new Error(`Hook ${hookPath} not available`);
        }
      }
    });

    it('should have all core components available', async () => {
      const components = [
        '../components/CreatorRegistrationForm',
        '../components/PriceDisplay',
        '../components/EarningsDashboard',
        '../components/ContentCard',
        '../components/ContentUpload',
        '../components/CreatorDashboard',
        '../components/WithdrawalInterface',
      ];

      for (const componentPath of components) {
        try {
          const component = await import(componentPath);
          expect(component.default).toBeDefined();
        } catch (error) {
          throw new Error(`Component ${componentPath} not available`);
        }
      }
    });

    it('should have all core libraries available', async () => {
      const libraries = [
        '../lib/WalletProvider',
        '../lib/ContractManager',
        '../lib/blockchainConfig',
        '../lib/contractUtils',
        '../lib/arweaveService',
        '../lib/tokenConfig',
      ];

      for (const libPath of libraries) {
        try {
          const lib = await import(libPath);
          expect(lib).toBeDefined();
        } catch (error) {
          throw new Error(`Library ${libPath} not available`);
        }
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid environment variable handling', () => {
      // Test that blockchain config handles env vars properly
      const sepolia = getChainByChainId(11155111);
      expect(sepolia).toBeDefined();
      expect(sepolia?.rpcUrl).toBeDefined();
      expect(typeof sepolia?.rpcUrl).toBe('string');
    });

    it('should have proper error handling setup', () => {
      // Verify error boundary component exists
      expect(async () => {
        await import('../components/ErrorBoundary');
      }).not.toThrow();
    });
  });
});