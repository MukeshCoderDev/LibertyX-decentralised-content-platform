import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_ALCHEMY_SEPOLIA_URL: 'https://eth-sepolia.g.alchemy.com/v2/test',
    VITE_INFURA_PROJECT_ID: 'test-project-id',
    VITE_ALCHEMY_MAINNET_ID: 'test-mainnet-id',
  },
}));

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  writable: true,
  value: {
    request: vi.fn().mockResolvedValue([]),
    on: vi.fn(),
    removeListener: vi.fn(),
    isMetaMask: true,
  },
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};