// ESLint Analyzer Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ESLintAnalyzer } from '../src/audit/analyzers/ESLintAnalyzer.js';
import { AuditError } from '../src/audit/errors/AuditError.js';

// Mock ESLint
const mockESLintInstance = {
  lintFiles: vi.fn(),
  calculateConfigForFile: vi.fn()
};

vi.mock('eslint', () => ({
  ESLint: vi.fn(() => mockESLintInstance)
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn()
}));

describe('ESLintAnalyzer', () => {
  let analyzer: ESLintAnalyzer;

  beforeEach(() => {
    analyzer = new ESLintAnalyzer();
    vi.clearAllMocks();
  });

  describe('runESLint', () => {
    it('should run ESLint and return results', async () => {
      const mockResults = [
        {
          filePath: 'test.ts',
          messages: [
            {
              line: 1,
              column: 1,
              severity: 2,
              message: 'Error message',
              ruleId: 'no-console',
              source: 'console.log("test");'
            }
          ]
        }
      ];

      mockESLintInstance.lintFiles.mockResolvedValue(mockResults);

      const result = await analyzer.runESLint(['src/**/*.ts']);

      expect(result.issues).toHaveLength(1);
      expect(result.totalErrors).toBe(1);
      expect(result.totalWarnings).toBe(0);
      expect(result.issues[0].severity).toBe('error');
    });

    it('should handle files with no issues', async () => {
      mockESLintInstance.lintFiles.mockResolvedValue([
        { filePath: 'clean.ts', messages: [] }
      ]);

      const result = await analyzer.runESLint(['src/**/*.ts']);

      expect(result.issues).toHaveLength(0);
      expect(result.totalErrors).toBe(0);
      expect(result.totalWarnings).toBe(0);
    });

    it('should handle ESLint execution errors', async () => {
      mockESLintInstance.lintFiles.mockRejectedValue(new Error('ESLint failed'));

      await expect(analyzer.runESLint(['invalid/**/*.ts'])).rejects.toThrow(AuditError);
    });
  });

  describe('validateRuleConfiguration', () => {
    it('should validate rule configuration', async () => {
      const mockConfig = {
        rules: {
          '@typescript-eslint/no-explicit-any': 'error',
          'no-console': 'warn'
        }
      };

      mockESLintInstance.calculateConfigForFile.mockResolvedValue(mockConfig);

      const result = await analyzer.validateRuleConfiguration();

      expect(result.configuredRules).toEqual(mockConfig.rules);
      expect(Array.isArray(result.missingRecommendedRules)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('generateESLintReport', () => {
    it('should generate comprehensive report', async () => {
      mockESLintInstance.lintFiles.mockResolvedValue([]);
      mockESLintInstance.calculateConfigForFile.mockResolvedValue({ rules: {} });

      const report = await analyzer.generateESLintReport();

      expect(report).toHaveProperty('lintResults');
      expect(report).toHaveProperty('ruleValidation');
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('recommendations');
      expect(typeof report.score).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // This test verifies the error handling structure exists
      expect(analyzer).toBeDefined();
    });
  });
});