import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { WalletProvider, useWallet } from '../lib/WalletProvider';
import { SUPPORTED_CHAINS, getChainByChainId } from '../lib/blockchainConfig';

// Simple test component
const TestComponent = () => {
  const { account, isConnected, connect, error } = useWallet();
  
  return (
    <div>
      <div data-testid="status">
        {isConnected ? `Connected: ${account}` : 'Not connected'}
      </div>
      {error && <div data-testid="error">{error.message}</div>}
      <button 
        data-testid="connect" 
        onClick={() => connect('MetaMask' as any)}
      >
        Connect
      </button>
    </div>
  );
};

describe('Basic Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Blockchain Configuration', () => {
    it('should have valid supported chains configuration', () => {
      expect(SUPPORTED_CHAINS).toBeDefined();
      expect(SUPPORTED_CHAINS.length).toBeGreaterThan(0);
      
      // Check Sepolia testnet is configured
      const sepolia = getChainByChainId(11155111);
      expect(sepolia).toBeDefined();
      expect(sepolia?.name).toBe('Sepolia Testnet');
      
      // Check contracts are deployed on Sepolia
      if (sepolia) {
        expect(sepolia.contracts.libertyToken).not.toBe('0x...');
        expect(sepolia.contracts.creatorRegistry).not.toBe('0x...');
        expect(sepolia.contracts.contentRegistry).not.toBe('0x...');
      }
    });

    it('should have all required contract addresses on Sepolia', () => {
      const sepolia = getChainByChainId(11155111);
      expect(sepolia).toBeDefined();
      
      if (sepolia) {
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
          const address = sepolia.contracts[contractName as keyof typeof sepolia.contracts];
          expect(address).toBeDefined();
          expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
          expect(address).not.toBe('0x...');
        });
      }
    });
  });

  describe('Wallet Provider Integration', () => {
    it('should render wallet provider without errors', () => {
      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );
      
      expect(screen.getByTestId('status')).toHaveTextContent('Not connected');
      expect(screen.getByTestId('connect')).toBeInTheDocument();
    });

    it('should handle wallet connection attempt', async () => {
      // Mock successful connection
      const mockEthereum = {
        request: vi.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890']),
        on: vi.fn(),
        removeListener: vi.fn(),
        isMetaMask: true,
      };
      
      (window as any).ethereum = mockEthereum;
      
      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );
      
      const connectButton = screen.getByTestId('connect');
      fireEvent.click(connectButton);
      
      // Should attempt to connect
      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalled();
      });
    });
  });

  describe('Contract Artifacts', () => {
    it('should have compiled contract artifacts available', async () => {
      // Test that we can import contract ABIs
      try {
        const LibertyTokenABI = await import('../artifacts/contracts/01_LibertyToken.sol/LibertyToken.json');
        expect(LibertyTokenABI.abi).toBeDefined();
        expect(Array.isArray(LibertyTokenABI.abi)).toBe(true);
        expect(LibertyTokenABI.abi.length).toBeGreaterThan(0);
      } catch (error) {
        throw new Error('Contract artifacts not available. Run "npx hardhat compile" first.');
      }
    });

    it('should have all required contract artifacts', async () => {
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
          expect(artifact.contractName).toBeDefined();
        } catch (error) {
          throw new Error(`Contract artifact ${contractFile} not available`);
        }
      }
    });
  });

  describe('Component Imports', () => {
    it('should import key components without errors', async () => {
      // Test that main components can be imported
      const components = [
        '../components/CreatorRegistrationForm',
        '../components/PriceDisplay',
        '../components/EarningsDashboard',
        '../components/ContentCard',
      ];

      for (const componentPath of components) {
        try {
          const component = await import(componentPath);
          expect(component.default).toBeDefined();
        } catch (error) {
          throw new Error(`Failed to import component: ${componentPath}`);
        }
      }
    });

    it('should import hooks without errors', async () => {
      const hooks = [
        '../hooks/useArweave',
        '../hooks/useCreatorRegistry',
        '../hooks/useRevenueSplitter',
        '../hooks/useNFTAccess',
      ];

      for (const hookPath of hooks) {
        try {
          const hook = await import(hookPath);
          expect(hook).toBeDefined();
        } catch (error) {
          throw new Error(`Failed to import hook: ${hookPath}`);
        }
      }
    });
  });

  describe('Library Imports', () => {
    it('should import core libraries without errors', async () => {
      const libraries = [
        '../lib/WalletProvider',
        '../lib/ContractManager',
        '../lib/blockchainConfig',
        '../lib/contractUtils',
        '../lib/arweaveService',
      ];

      for (const libPath of libraries) {
        try {
          const lib = await import(libPath);
          expect(lib).toBeDefined();
        } catch (error) {
          throw new Error(`Failed to import library: ${libPath}`);
        }
      }
    });
  });
});