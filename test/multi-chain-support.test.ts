import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SUPPORTED_CHAINS, getChainByChainId } from '../lib/blockchainConfig';
import { Chain } from '../lib/web3-types';

describe('Multi-Chain Network Support - Task 2', () => {
  describe('Blockchain Configuration', () => {
    it('should have all required supported chains', () => {
      const expectedChainIds = [
        1,        // Ethereum Mainnet
        11155111, // Sepolia Testnet
        137,      // Polygon Mainnet
        56,       // BNB Smart Chain
        42161,    // Arbitrum One
        10,       // Optimism Mainnet
        43114,    // Avalanche C-Chain
      ];

      expect(SUPPORTED_CHAINS).toHaveLength(expectedChainIds.length);
      
      expectedChainIds.forEach(chainId => {
        const chain = SUPPORTED_CHAINS.find(c => c.chainId === chainId);
        expect(chain).toBeDefined();
        expect(chain?.chainId).toBe(chainId);
      });
    });

    it('should have valid chain configurations', () => {
      SUPPORTED_CHAINS.forEach(chain => {
        // Basic structure validation
        expect(chain).toHaveProperty('chainId');
        expect(chain).toHaveProperty('name');
        expect(chain).toHaveProperty('rpcUrl');
        expect(chain).toHaveProperty('blockExplorer');
        expect(chain).toHaveProperty('nativeCurrency');
        expect(chain).toHaveProperty('contracts');

        // Chain ID validation
        expect(typeof chain.chainId).toBe('number');
        expect(chain.chainId).toBeGreaterThan(0);

        // Name validation
        expect(typeof chain.name).toBe('string');
        expect(chain.name.length).toBeGreaterThan(0);

        // RPC URL validation
        expect(typeof chain.rpcUrl).toBe('string');
        expect(chain.rpcUrl).toMatch(/^https?:\/\//);

        // Block explorer validation
        expect(typeof chain.blockExplorer).toBe('string');
        expect(chain.blockExplorer).toMatch(/^https?:\/\//);

        // Native currency validation
        expect(chain.nativeCurrency).toHaveProperty('name');
        expect(chain.nativeCurrency).toHaveProperty('symbol');
        expect(chain.nativeCurrency).toHaveProperty('decimals');
        expect(chain.nativeCurrency.decimals).toBe(18);

        // Contracts validation
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
          expect(chain.contracts).toHaveProperty(contractName);
          expect(typeof chain.contracts[contractName as keyof Chain['contracts']]).toBe('string');
        });
      });
    });

    it('should have deployed contracts on Sepolia testnet', () => {
      const sepoliaChain = getChainByChainId(11155111);
      expect(sepoliaChain).toBeDefined();

      if (sepoliaChain) {
        // Verify actual deployed addresses (not placeholder)
        expect(sepoliaChain.contracts.libertyToken).not.toBe('0x...');
        expect(sepoliaChain.contracts.creatorRegistry).not.toBe('0x...');
        expect(sepoliaChain.contracts.contentRegistry).not.toBe('0x...');
        expect(sepoliaChain.contracts.revenueSplitter).not.toBe('0x...');
        expect(sepoliaChain.contracts.subscriptionManager).not.toBe('0x...');
        expect(sepoliaChain.contracts.nftAccess).not.toBe('0x...');
        expect(sepoliaChain.contracts.libertyDAO).not.toBe('0x...');

        // Verify addresses are valid Ethereum addresses
        Object.values(sepoliaChain.contracts).forEach(address => {
          expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        });
      }
    });
  });

  describe('Chain Lookup Functions', () => {
    it('should find chain by valid chain ID', () => {
      const ethereumChain = getChainByChainId(1);
      expect(ethereumChain).toBeDefined();
      expect(ethereumChain?.name).toBe('Ethereum Mainnet');
      expect(ethereumChain?.chainId).toBe(1);

      const sepoliaChain = getChainByChainId(11155111);
      expect(sepoliaChain).toBeDefined();
      expect(sepoliaChain?.name).toBe('Sepolia Testnet');
      expect(sepoliaChain?.chainId).toBe(11155111);

      const polygonChain = getChainByChainId(137);
      expect(polygonChain).toBeDefined();
      expect(polygonChain?.name).toBe('Polygon Mainnet');
      expect(polygonChain?.chainId).toBe(137);
    });

    it('should return undefined for unsupported chain ID', () => {
      const unsupportedChain = getChainByChainId(999999);
      expect(unsupportedChain).toBeUndefined();

      const anotherUnsupportedChain = getChainByChainId(0);
      expect(anotherUnsupportedChain).toBeUndefined();
    });

    it('should handle edge cases', () => {
      expect(getChainByChainId(-1)).toBeUndefined();
      expect(getChainByChainId(NaN)).toBeUndefined();
      expect(getChainByChainId(Infinity)).toBeUndefined();
    });
  });

  describe('Network-Specific Contract Addresses', () => {
    it('should have different contract addresses per network', () => {
      const ethereum = getChainByChainId(1);
      const sepolia = getChainByChainId(11155111);
      const polygon = getChainByChainId(137);

      expect(ethereum).toBeDefined();
      expect(sepolia).toBeDefined();
      expect(polygon).toBeDefined();

      if (ethereum && sepolia && polygon) {
        // Sepolia should have actual addresses, others should be placeholders for now
        expect(sepolia.contracts.libertyToken).not.toBe(ethereum.contracts.libertyToken);
        expect(sepolia.contracts.libertyToken).not.toBe(polygon.contracts.libertyToken);
        
        // Verify Sepolia has real addresses
        expect(sepolia.contracts.libertyToken).toBe('0x76404FEB7c5dA01881CCD1dB1E201D0351Ad6994');
        expect(sepolia.contracts.creatorRegistry).toBe('0x5cB5536CAA837f1B1B8Ed994deD3F939FadCb27d');
      }
    });
  });

  describe('RPC Configuration', () => {
    it('should have valid RPC URLs for all chains', () => {
      SUPPORTED_CHAINS.forEach(chain => {
        expect(chain.rpcUrl).toMatch(/^https?:\/\//);
        
        // Check for environment variable usage
        if (chain.chainId === 1) {
          // Ethereum mainnet should use Infura or Alchemy
          expect(chain.rpcUrl).toMatch(/(infura|alchemy)/i);
        }
        
        if (chain.chainId === 11155111) {
          // Sepolia should use Alchemy or Infura
          expect(chain.rpcUrl).toMatch(/(alchemy|infura)/i);
        }
      });
    });

    it('should handle environment variable fallbacks', () => {
      const sepolia = getChainByChainId(11155111);
      expect(sepolia).toBeDefined();
      
      if (sepolia) {
        // Should contain environment variable reference or fallback
        expect(sepolia.rpcUrl).toContain('VITE_ALCHEMY_SEPOLIA_URL');
      }
    });
  });

  describe('Native Currency Configuration', () => {
    it('should have correct native currencies', () => {
      const testCases = [
        { chainId: 1, symbol: 'ETH', name: 'Ether' },
        { chainId: 11155111, symbol: 'ETH', name: 'Sepolia Ether' },
        { chainId: 137, symbol: 'MATIC', name: 'MATIC' },
        { chainId: 56, symbol: 'BNB', name: 'BNB' },
        { chainId: 42161, symbol: 'ETH', name: 'Ether' },
        { chainId: 10, symbol: 'ETH', name: 'Ether' },
        { chainId: 43114, symbol: 'AVAX', name: 'Avalanche' },
      ];

      testCases.forEach(({ chainId, symbol, name }) => {
        const chain = getChainByChainId(chainId);
        expect(chain).toBeDefined();
        
        if (chain) {
          expect(chain.nativeCurrency.symbol).toBe(symbol);
          expect(chain.nativeCurrency.name).toBe(name);
          expect(chain.nativeCurrency.decimals).toBe(18);
        }
      });
    });
  });

  describe('Block Explorer Configuration', () => {
    it('should have correct block explorer URLs', () => {
      const testCases = [
        { chainId: 1, explorer: 'https://etherscan.io' },
        { chainId: 11155111, explorer: 'https://sepolia.etherscan.io' },
        { chainId: 137, explorer: 'https://polygonscan.com' },
        { chainId: 56, explorer: 'https://bscscan.com' },
        { chainId: 42161, explorer: 'https://arbiscan.io' },
        { chainId: 10, explorer: 'https://optimistic.etherscan.io' },
        { chainId: 43114, explorer: 'https://snowtrace.io' },
      ];

      testCases.forEach(({ chainId, explorer }) => {
        const chain = getChainByChainId(chainId);
        expect(chain).toBeDefined();
        
        if (chain) {
          expect(chain.blockExplorer).toBe(explorer);
        }
      });
    });
  });

  describe('Contract Address Validation', () => {
    it('should validate Ethereum address format', () => {
      SUPPORTED_CHAINS.forEach(chain => {
        Object.values(chain.contracts).forEach(address => {
          if (address !== '0x...') {
            // Should be valid Ethereum address
            expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
            expect(address.length).toBe(42);
          }
        });
      });
    });

    it('should not have duplicate contract addresses within same chain', () => {
      SUPPORTED_CHAINS.forEach(chain => {
        const addresses = Object.values(chain.contracts).filter(addr => addr !== '0x...');
        const uniqueAddresses = [...new Set(addresses)];
        
        expect(addresses.length).toBe(uniqueAddresses.length);
      });
    });
  });

  describe('Chain Configuration Completeness', () => {
    it('should have all required properties for each chain', () => {
      const requiredProperties = [
        'chainId',
        'name', 
        'rpcUrl',
        'blockExplorer',
        'nativeCurrency',
        'contracts'
      ];

      const requiredNativeCurrencyProperties = [
        'name',
        'symbol', 
        'decimals'
      ];

      const requiredContractProperties = [
        'libertyToken',
        'creatorRegistry',
        'contentRegistry', 
        'revenueSplitter',
        'subscriptionManager',
        'nftAccess',
        'libertyDAO'
      ];

      SUPPORTED_CHAINS.forEach(chain => {
        // Check main properties
        requiredProperties.forEach(prop => {
          expect(chain).toHaveProperty(prop);
        });

        // Check native currency properties
        requiredNativeCurrencyProperties.forEach(prop => {
          expect(chain.nativeCurrency).toHaveProperty(prop);
        });

        // Check contract properties
        requiredContractProperties.forEach(prop => {
          expect(chain.contracts).toHaveProperty(prop);
        });
      });
    });
  });

  describe('Environment Variable Integration', () => {
    it('should handle missing environment variables gracefully', () => {
      // This test would need to mock import.meta.env
      // For now, we verify the structure handles env vars
      const ethereum = getChainByChainId(1);
      expect(ethereum).toBeDefined();
      
      if (ethereum) {
        // Should not crash if env vars are missing
        expect(ethereum.rpcUrl).toBeDefined();
        expect(typeof ethereum.rpcUrl).toBe('string');
      }
    });
  });

  describe('Chain Network Types', () => {
    it('should categorize chains correctly', () => {
      const mainnetChains = [1, 137, 56, 42161, 10, 43114];
      const testnetChains = [11155111];

      mainnetChains.forEach(chainId => {
        const chain = getChainByChainId(chainId);
        expect(chain).toBeDefined();
        if (chain) {
          expect(chain.name).not.toMatch(/testnet/i);
        }
      });

      testnetChains.forEach(chainId => {
        const chain = getChainByChainId(chainId);
        expect(chain).toBeDefined();
        if (chain) {
          expect(chain.name).toMatch(/testnet/i);
        }
      });
    });
  });
});