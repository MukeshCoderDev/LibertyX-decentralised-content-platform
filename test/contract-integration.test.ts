import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// import { ethers } from 'ethers';
import ContractManager from '../lib/ContractManager';
import { getContractInstance } from '../lib/contractUtils';
import { getChainByChainId } from '../lib/blockchainConfig';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    Contract: vi.fn(),
    BrowserProvider: vi.fn(),
    formatEther: vi.fn(),
  },
}));

// Mock contract utils
vi.mock('../lib/contractUtils', () => ({
  getContractInstance: vi.fn(),
}));

describe('Smart Contract Integration - Task 3', () => {
  let mockSigner: any;
  let mockProvider: any;
  let mockContract: any;
  let contractManager: ContractManager;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock signer
    mockSigner = {
      getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      provider: null,
    };

    // Mock provider
    mockProvider = {
      getNetwork: vi.fn().mockResolvedValue({ chainId: 11155111n }),
      getBalance: vi.fn().mockResolvedValue('1000000000000000000'),
    };

    // Mock contract
    mockContract = {
      target: '0x5cB5536CAA837f1B1B8Ed994deD3F939FadCb27d',
      registerCreator: vi.fn(),
      getCreator: vi.fn(),
      estimateGas: vi.fn(),
      on: vi.fn(),
      removeAllListeners: vi.fn(),
    };

    // Mock getContractInstance
    (getContractInstance as any).mockReturnValue(mockContract);

    // Create contract manager instance
    contractManager = new ContractManager(mockSigner, 11155111);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Contract Manager Initialization', () => {
    it('should initialize with signer and chain ID', () => {
      expect(contractManager.signer).toBe(mockSigner);
      expect(contractManager.currentChainId).toBe(11155111);
    });

    it('should initialize all contract instances', () => {
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
        expect(contractManager.contracts[contractName as keyof typeof contractManager.contracts]).toBe(mockContract);
      });

      // Verify getContractInstance was called for each contract
      expect(getContractInstance).toHaveBeenCalledTimes(expectedContracts.length);
    });

    it('should handle provider-only initialization', () => {
      const providerOnlyManager = new ContractManager(mockProvider, 11155111);
      
      expect(providerOnlyManager.provider).toBe(mockProvider);
      expect(providerOnlyManager.signer).toBeNull();
      expect(providerOnlyManager.currentChainId).toBe(11155111);
    });
  });

  describe('Contract Instance Management', () => {
    it('should get contract instance for current chain', () => {
      const contract = contractManager.getContract('creatorRegistry', 11155111);
      expect(contract).toBe(mockContract);
    });

    it('should reinitialize contract for different chain', () => {
      const differentChainContract = contractManager.getContract('creatorRegistry', 1);
      
      expect(getContractInstance).toHaveBeenCalledWith(
        'creatorRegistry',
        1,
        mockSigner
      );
    });

    it('should return null for unsupported chain', () => {
      (getContractInstance as any).mockReturnValue(null);
      
      const contract = contractManager.getContract('creatorRegistry', 999999);
      expect(contract).toBeNull();
    });
  });

  describe('Transaction Execution', () => {
    it('should execute read-only contract calls', async () => {
      const mockCreatorData = {
        handle: 'testcreator',
        avatarURI: 'https://example.com/avatar.jpg',
        bio: 'Test creator bio',
        isVerified: false,
        totalEarnings: '0'
      };

      mockContract.getCreator.mockResolvedValue(mockCreatorData);

      // Note: This would be a read operation, not using executeTransaction
      const result = await mockContract.getCreator('0x1234567890123456789012345678901234567890');
      
      expect(result).toEqual(mockCreatorData);
      expect(mockContract.getCreator).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890');
    });

    it('should execute write transactions successfully', async () => {
      const mockTxResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        wait: vi.fn().mockResolvedValue({
          status: 1,
          blockNumber: 12345,
          gasUsed: '21000'
        })
      };

      mockContract.registerCreator.mockResolvedValue(mockTxResponse);

      const result = await contractManager.executeTransaction(
        'creatorRegistry',
        'registerCreator',
        ['testhandle', 'https://example.com/avatar.jpg', 'Test bio']
      );

      expect(result).toEqual({
        hash: mockTxResponse.hash,
        status: 'pending'
      });

      expect(mockContract.registerCreator).toHaveBeenCalledWith(
        'testhandle',
        'https://example.com/avatar.jpg', 
        'Test bio'
      );
    });

    it('should execute transactions with value', async () => {
      const mockTxResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      };

      mockContract.subscribe = vi.fn().mockResolvedValue(mockTxResponse);

      const result = await contractManager.executeTransaction(
        'subscriptionManager',
        'subscribe',
        ['0x1234567890123456789012345678901234567890'],
        { value: '1000000000000000000' } // 1 ETH
      );

      expect(result.hash).toBe(mockTxResponse.hash);
      expect(mockContract.subscribe).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        { value: '1000000000000000000' }
      );
    });

    it('should handle transaction failures', async () => {
      const mockError = new Error('Transaction failed: insufficient funds') as any;
      mockError.code = -32000;
      
      mockContract.registerCreator.mockRejectedValue(mockError);

      await expect(
        contractManager.executeTransaction(
          'creatorRegistry',
          'registerCreator', 
          ['testhandle', 'https://example.com/avatar.jpg', 'Test bio']
        )
      ).rejects.toThrow('Transaction failed: insufficient funds');
    });

    it('should handle user rejection', async () => {
      const mockError = new Error('User rejected transaction') as any;
      mockError.code = 4001;
      
      mockContract.registerCreator.mockRejectedValue(mockError);

      await expect(
        contractManager.executeTransaction(
          'creatorRegistry',
          'registerCreator',
          ['testhandle', 'https://example.com/avatar.jpg', 'Test bio']
        )
      ).rejects.toThrow('Transaction failed: User rejected the transaction');
    });

    it('should handle gas estimation', async () => {
      const mockGasEstimate = '50000';
      mockContract.registerCreator.estimateGas = vi.fn().mockResolvedValue(mockGasEstimate);
      
      const mockTxResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      };
      mockContract.registerCreator.mockResolvedValue(mockTxResponse);

      await contractManager.executeTransaction(
        'creatorRegistry',
        'registerCreator',
        ['testhandle', 'https://example.com/avatar.jpg', 'Test bio']
      );

      expect(mockContract.registerCreator.estimateGas).toHaveBeenCalledWith(
        'testhandle',
        'https://example.com/avatar.jpg',
        'Test bio',
        {}
      );
    });

    it('should handle missing signer error', async () => {
      const providerOnlyManager = new ContractManager(mockProvider, 11155111);

      await expect(
        providerOnlyManager.executeTransaction(
          'creatorRegistry',
          'registerCreator',
          ['testhandle', 'https://example.com/avatar.jpg', 'Test bio']
        )
      ).rejects.toThrow('No signer available for transaction');
    });

    it('should handle non-existent method', async () => {
      await expect(
        contractManager.executeTransaction(
          'creatorRegistry',
          'nonExistentMethod',
          []
        )
      ).rejects.toThrow('Method nonExistentMethod does not exist on contract creatorRegistry');
    });
  });

  describe('Event Listening', () => {
    it('should set up event listeners', () => {
      const mockCallback = vi.fn();
      
      contractManager.listenToEvents('creatorRegistry', 'CreatorRegistered', mockCallback);
      
      expect(mockContract.on).toHaveBeenCalledWith('CreatorRegistered', mockCallback);
    });

    it('should handle event callbacks', () => {
      const mockCallback = vi.fn();
      
      contractManager.listenToEvents('creatorRegistry', 'CreatorRegistered', mockCallback);
      
      // Simulate event emission
      const eventArgs = ['0x1234567890123456789012345678901234567890', 'testhandle'];
      const onCallback = mockContract.on.mock.calls[0][1];
      onCallback(...eventArgs);
      
      expect(mockCallback).toHaveBeenCalledWith(...eventArgs);
    });

    it('should warn when contract not available for events', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      contractManager.contracts.creatorRegistry = null;
      contractManager.listenToEvents('creatorRegistry', 'CreatorRegistered', vi.fn());
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot listen to events: Contract creatorRegistry not initialized.'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Contract Address Validation', () => {
    it('should validate contract addresses from blockchain config', () => {
      const sepoliaChain = getChainByChainId(11155111);
      expect(sepoliaChain).toBeDefined();
      
      if (sepoliaChain) {
        Object.values(sepoliaChain.contracts).forEach(address => {
          expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
          expect(address.length).toBe(42);
        });
      }
    });

    it('should handle invalid contract addresses', () => {
      (getContractInstance as any).mockReturnValue(null);
      
      const contract = contractManager.getContract('creatorRegistry', 11155111);
      expect(contract).toBeNull();
    });
  });

  describe('Chain Switching', () => {
    it('should update contracts when chain changes', () => {
      contractManager.setSignerOrProvider(mockSigner, 1); // Switch to Ethereum mainnet
      
      expect(contractManager.currentChainId).toBe(1);
      
      // Should reinitialize contracts for new chain
      expect(getContractInstance).toHaveBeenCalledWith(
        expect.any(String),
        1,
        mockSigner
      );
    });

    it('should handle unsupported chain gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      contractManager.setSignerOrProvider(mockSigner, 999999);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Chain with ID 999999 not found.'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Contract ABI Integration', () => {
    it('should load contract ABIs from artifacts', () => {
      // This test verifies that getContractInstance is called with correct parameters
      expect(getContractInstance).toHaveBeenCalledWith(
        'creatorRegistry',
        11155111,
        mockSigner
      );
    });

    it('should handle missing ABI gracefully', () => {
      (getContractInstance as any).mockReturnValue(null);
      
      const contract = contractManager.getContract('creatorRegistry', 11155111);
      expect(contract).toBeNull();
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log transaction details', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockTxResponse = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      };
      mockContract.registerCreator.mockResolvedValue(mockTxResponse);

      await contractManager.executeTransaction(
        'creatorRegistry',
        'registerCreator',
        ['testhandle', 'https://example.com/avatar.jpg', 'Test bio']
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'executeTransaction called: creatorRegistry.registerCreator'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Transaction sent successfully!'
      );
      
      consoleSpy.mockRestore();
    });

    it('should log detailed error information', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockError = new Error('Detailed error message') as any;
      mockError.code = 'CUSTOM_ERROR';
      mockError.reason = 'Custom reason';
      
      mockContract.registerCreator.mockRejectedValue(mockError);

      await expect(
        contractManager.executeTransaction(
          'creatorRegistry',
          'registerCreator',
          ['testhandle', 'https://example.com/avatar.jpg', 'Test bio']
        )
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error executing transaction creatorRegistry.registerCreator:',
        mockError
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Contract State Management', () => {
    it('should maintain contract instances across calls', () => {
      const contract1 = contractManager.getContract('creatorRegistry', 11155111);
      const contract2 = contractManager.getContract('creatorRegistry', 11155111);
      
      expect(contract1).toBe(contract2);
      expect(contract1).toBe(mockContract);
    });

    it('should handle provider updates', () => {
      const newProvider = { ...mockProvider };
      contractManager.setSignerOrProvider(newProvider, 11155111);
      
      expect(contractManager.provider).toBe(newProvider);
      expect(contractManager.signer).toBeNull();
    });
  });
});