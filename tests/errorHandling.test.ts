import { describe, it, expect, vi } from 'vitest';
import ErrorHandler from '../lib/errorHandling';

describe('ErrorHandler', () => {
  describe('parseError', () => {
    it('should parse user rejection errors', () => {
      const error = { code: 'ACTION_REJECTED', message: 'User rejected transaction' };
      const result = ErrorHandler.parseError(error);

      expect(result.type).toBe('user');
      expect(result.userFriendly).toBe('You cancelled the transaction');
      expect(result.retryable).toBe(true);
    });

    it('should parse insufficient funds errors', () => {
      const error = { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds' };
      const result = ErrorHandler.parseError(error);

      expect(result.type).toBe('user');
      expect(result.userFriendly).toBe('You don\'t have enough ETH for this transaction');
      expect(result.retryable).toBe(false);
    });

    it('should parse contract errors', () => {
      const error = { reason: 'no plan', message: 'execution reverted: no plan' };
      const result = ErrorHandler.parseError(error);

      expect(result.type).toBe('contract');
      expect(result.userFriendly).toBe('This creator hasn\'t set up a subscription plan yet');
      expect(result.retryable).toBe(false);
    });

    it('should parse network errors', () => {
      const error = { message: 'network connection failed' };
      const result = ErrorHandler.parseError(error);

      expect(result.type).toBe('network');
      expect(result.retryable).toBe(true);
      expect(result.suggestions).toContain('Check your internet connection');
    });

    it('should handle unknown errors', () => {
      const error = { message: 'Something weird happened' };
      const result = ErrorHandler.parseError(error);

      expect(result.type).toBe('unknown');
      expect(result.retryable).toBe(true);
      expect(result.userFriendly).toBe('Something went wrong. Please try again.');
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await ErrorHandler.withRetry(operation, 3);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');
      
      const result = await ErrorHandler.withRetry(operation, 3);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue({ code: 'INSUFFICIENT_FUNDS' });
      
      await expect(ErrorHandler.withRetry(operation, 3)).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('persistent error'));
      
      await expect(ErrorHandler.withRetry(operation, 2)).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});