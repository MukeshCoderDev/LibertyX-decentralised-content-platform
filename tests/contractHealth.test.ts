import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractHealthChecker } from '../lib/ContractHealthChecker';
import { ethers } from 'ethers';

// Mock ethers provider
const mockProvider = {
  getCode: vi.fn(),
  getNetwork: vi.fn().mockResolvedValue({ chainId: 11155111 })
} as any;

describe('ContractHealthChecker', () => {
  let healthChecker: ContractHealthChecker;

  beforeEach(() => {
    healthChecker = new ContractHealthChecker(mockProvider, 11155111);
    vi.clearAllMocks();
  });

  describe('checkContractAvailability', () => {
    it('should return true for deployed contracts', async () => {
      mockProvider.getCode.mockResolvedValue('0x608060405234801561001057600080fd5b50...');
      
      const result = await healthChecker.checkContractAvailability('subscriptionManager');
      
      expect(result).toBe(true);
      expect(mockProvider.getCode).toHaveBeenCalled();
    });

    it('should return false for non-deployed contracts', async () => {
      mockProvider.getCode.mockResolvedValue('0x');
      
      const result = await healthChecker.checkContractAvailability('subscriptionManager');
      
      expect(result).toBe(false);
    });

    it('should handle provider errors gracefully', async () => {
      mockProvider.getCode.mockRejectedValue(new Error('Network error'));
      
      const result = await healthChecker.checkContractAvailability('subscriptionManager');
      
      expect(result).toBe(false);
    });
  });

  describe('getContractStatus', () => {
    it('should return comprehensive status for healthy contract', async () => {
      mockProvider.getCode.mockResolvedValue('0x608060405234801561001057600080fd5b50...');
      
      const status = await healthChecker.getContractStatus('subscriptionManager');
      
      expect(status.isDeployed).toBe(true);
      expect(status.isResponding).toBe(true);
      expect(status.error).toBeNull();
      expect(status.address).toBeDefined();
    });

    it('should return error status for missing contract', async () => {
      mockProvider.getCode.mockResolvedValue('0x');
      
      const status = await healthChecker.getContractStatus('subscriptionManager');
      
      expect(status.isDeployed).toBe(false);
      expect(status.error).toBe('Contract not deployed at address');
    });
  });

  describe('checkCriticalContracts', () => {
    it('should identify missing critical contracts', async () => {
      mockProvider.getCode
        .mockResolvedValueOnce('0x608060405234801561001057600080fd5b50...') // subscriptionManager deployed
        .mockResolvedValueOnce('0x') // nftAccess not deployed
        .mockResolvedValueOnce('0x608060405234801561001057600080fd5b50...'); // creatorRegistry deployed
      
      const result = await healthChecker.checkCriticalContracts();
      
      expect(result.available).toBe(false);
      expect(result.missing).toContain('nftAccess');
    });

    it('should return available when all critical contracts are deployed', async () => {
      mockProvider.getCode.mockResolvedValue('0x608060405234801561001057600080fd5b50...');
      
      const result = await healthChecker.checkCriticalContracts();
      
      expect(result.available).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });
});