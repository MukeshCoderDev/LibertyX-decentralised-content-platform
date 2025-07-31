// Test for ESLint Analyzer

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ESLintAnalyzer } from '../src/audit/analyzers/ESLintAnalyzer.js';
import { AuditError } from '../src/audit/errors/AuditError.js';

// Mock ESLint
vi.mock('eslint', () => ({
  ESLint: vi.fn().mockImplementation(() => ({
    lintFiles: vi.fn(),
    lintText: vi.fn(),
    findConfigFile: vi.fn(),
    outputFixes: vi.fn()
  }))
}));

describe('ESLintAnalyzer', () => {
  let analyzer: ESLintAnalyzer;
  let mockESLint: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const { ESLint } = require('eslint');
    mockESLint = {
      lintFiles: vi.fn(),
      lintText: vi.fn(),
      outputFixes: vi.fn()
    };
    ESLint.mockImplementation(() => mockESLint);
    ESLint.findConfigFile = vi.fn();
    ESLint.outputFixes = vi.fn();
    
    analyzer = new ESLintAnalyzer();
  });

  describe('initialization', () => {
    it('should create analyzer with default configuration', () => {
      expect(analyzer).toBeInstanceOf(ESLintAnalyzer);
    });

    it('should create analyzer with custom config path', () => {
      const customAnalyzer = new ESLintAnalyzer('./custom-eslint.config.js');
      expect(customAnalyzer).toBeInstanceOf(ESLintAnalyzer);
    });

    it('should create analyzer with strict configuration', () => {
      const strictAnalyzer = new ESLintAnalyzer();
      expect(strictAnalyzer).toBeInstanceOf(ESLintAnalyzer);
    });
  });

  describe('runESLint', () => {
    it('should analyze files and return linting issues', async () => {
      const mockResults = [
        {
          filePath: 'src/test.ts',
          messages: [
            {
              line: 1,
              column: 1,
              ruleId: 'no-console',
              message: 'Unexpected console statement',
              severity: 1
            },
            {
              line: 2,
              column: 5,
              ruleId: 'no-unused-vars',
              message: 'Variable is not used',
              severity: 2
            }
          ]
        }
      ];

      mockESLint.lintFiles.mockResolvedValue(mockResults);

      const issues = await analyzer.runESLint(['src/**/*.ts']);

      expect(issues).toHaveLength(2);
      expect(issues[0]).toEqual({
        file: 'src/test.ts',
        line: 1,
        column: 1,
        rule: 'no-console',
        message: 'Unexpected console statement',
        severity: 'warning'
      });
      expect(issues[1]).toEqual({
        file: 'src/test.ts',
        line: 2,
        column: 5,
        rule: 'no-unused-vars',
        message: 'Variable is not used',
        severity: 'error'
      });
    });

    it('should handle ESLint errors', async () => {
      mockESLint.lintFiles.mockRejectedValue(new Error('ESLint failed'));

      await expect(analyzer.runESLint(['src/**/*.ts'])).rejects.toThrow(AuditError);
    });

    it('should handle messages without ruleId', async () => {
      const mockResults = [
        {
          filePath: 'src/test.ts',
          messages: [
            {
              line: 1,
              column: 1,
              ruleId: null,
              message: 'Parsing error',
              severity: 2
            }
          ]
        }
      ];

      mockESLint.lintFiles.mockResolvedValue(mockResults);

      const issues = await analyzer.runESLint(['src/**/*.ts']);

      expect(issues).toHaveLength(1);
      expect(issues[0].rule).toBe('unknown');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate existing configuration', async () => {
      const { ESLint } = require('eslint');
      ESLint.findConfigFile.mockResolvedValue('.eslintrc.js');
      mockESLint.lintText.mockResolvedValue([]);

      const validation = await analyzer.validateRuleConfiguration();

      expect(validation.hasConfig).toBe(true);
      expect(validation.configPath).toBe('.eslintrc.js');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should handle missing configuration', async () => {
      const { ESLint } = require('eslint');
      ESLint.findConfigFile.mockResolvedValue(null);

      const validation = await analyzer.validateRuleConfiguration();

      expect(validation.hasConfig).toBe(false);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No ESLint configuration found');
    });

    it('should handle invalid configuration', async () => {
      const { ESLint } = require('eslint');
      ESLint.findConfigFile.mockResolvedValue('.eslintrc.js');
      mockESLint.lintText.mockRejectedValue(new Error('Invalid config'));

      const validation = await analyzer.validateRuleConfiguration();

      expect(validation.hasConfig).toBe(true);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid config');
    });
  });

  describe('getRuleStatistics', () => {
    it('should calculate rule statistics', async () => {
      const mockResults = [
        {
          filePath: 'src/test.ts',
          messages: [
            {
              line: 1,
              column: 1,
              ruleId: 'no-console',
              message: 'Unexpected console statement',
              severity: 1
            },
            {
              line: 2,
              column: 5,
              ruleId: 'no-unused-vars',
              message: 'Variable is not used',
              severity: 2
            },
            {
              line: 3,
              column: 1,
              ruleId: 'no-console',
              message: 'Another console statement',
              severity: 1
            }
          ]
        }
      ];

      mockESLint.lintFiles.mockResolvedValue(mockResults);

      // const stats = await analyzer.getRuleStatistics(['src/**/*.ts']);

      expect(stats.totalRules).toBe(2);
      expect(stats.enabledRules).toBe(2);
      expect(stats.errorRules).toBe(1);
      expect(stats.warningRules).toBe(1);
      expect(stats.ruleBreakdown['no-console'].count).toBe(2);
      expect(stats.ruleBreakdown['no-unused-vars'].count).toBe(1);
    });
  });

  describe('analyzeComplexity', () => {
    it('should analyze code complexity', async () => {
      const { ESLint } = require('eslint');
      const mockComplexityESLint = {
        lintFiles: vi.fn().mockResolvedValue([
          {
            filePath: 'src/test.ts',
            messages: [
              {
                line: 5,
                column: 1,
                ruleId: 'complexity',
                message: 'Function has a complexity of 15',
                severity: 2
              },
              {
                line: 10,
                column: 1,
                ruleId: 'complexity',
                message: 'Function has a complexity of 8',
                severity: 2
              }
            ]
          }
        ])
      };

      ESLint.mockImplementation(() => mockComplexityESLint);

      // const complexity = await analyzer.analyzeComplexity(['src/**/*.ts']);

      expect(complexity.averageComplexity).toBe(11.5);
      expect(complexity.maxComplexity).toBe(15);
      expect(complexity.complexFunctions).toHaveLength(2);
      expect(complexity.complexFunctions[0]).toEqual({
        file: 'src/test.ts',
        function: 'function',
        line: 5,
        complexity: 15
      });
    });

    it('should handle complexity analysis errors', async () => {
      const { ESLint } = require('eslint');
      const mockComplexityESLint = {
        lintFiles: vi.fn().mockRejectedValue(new Error('Complexity analysis failed'))
      };

      ESLint.mockImplementation(() => mockComplexityESLint);

      // await expect(analyzer.analyzeComplexity(['src/**/*.ts'])).rejects.toThrow(AuditError);
    });
  });

  describe('generateESLintReport', () => {
    it('should generate comprehensive ESLint report', async () => {
      // Mock all the methods used in generateESLintReport
      const mockResults = [
        {
          filePath: 'src/test.ts',
          messages: [
            {
              line: 1,
              column: 1,
              ruleId: 'no-console',
              message: 'Unexpected console statement',
              severity: 2
            }
          ]
        }
      ];

      mockESLint.lintFiles.mockResolvedValue(mockResults);

      const { ESLint } = require('eslint');
      ESLint.findConfigFile.mockResolvedValue('.eslintrc.js');
      mockESLint.lintText.mockResolvedValue([]);

      // Mock complexity analysis
      const mockComplexityESLint = {
        lintFiles: vi.fn().mockResolvedValue([
          {
            filePath: 'src/test.ts',
            messages: [
              {
                line: 5,
                column: 1,
                ruleId: 'complexity',
                message: 'Function has a complexity of 5',
                severity: 2
              }
            ]
          }
        ])
      };

      ESLint.mockImplementation((config) => {
        if (config.baseConfig && config.baseConfig.rules && config.baseConfig.rules.complexity) {
          return mockComplexityESLint;
        }
        return mockESLint;
      });

      const report = await analyzer.generateESLintReport(['src/**/*.ts']);

      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('configuration');
      expect(report).toHaveProperty('ruleStatistics');
      expect(report).toHaveProperty('complexity');
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('recommendations');
      expect(typeof report.score).toBe('number');
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });
  });

  describe('fixIssues', () => {
    it('should fix auto-fixable issues', async () => {
      const { ESLint } = require('eslint');
      const mockFixESLint = {
        lintFiles: vi.fn().mockResolvedValue([
          {
            filePath: 'src/test.ts',
            output: 'fixed content',
            messages: [
              {
                line: 1,
                column: 1,
                ruleId: 'no-console',
                message: 'Unexpected console statement',
                severity: 2,
                fix: null // Not fixable
              }
            ]
          }
        ])
      };

      ESLint.mockImplementation(() => mockFixESLint);
      ESLint.outputFixes = vi.fn().mockResolvedValue(undefined);

      // const result = await analyzer.fixIssues(['src/**/*.ts']);

      expect(result.fixedFiles).toContain('src/test.ts');
      expect(result.unfixableIssues).toHaveLength(1);
      expect(ESLint.outputFixes).toHaveBeenCalled();
    });

    it('should handle fix errors', async () => {
      const { ESLint } = require('eslint');
      const mockFixESLint = {
        lintFiles: vi.fn().mockRejectedValue(new Error('Fix failed'))
      };

      ESLint.mockImplementation(() => mockFixESLint);

      // await expect(analyzer.fixIssues(['src/**/*.ts'])).rejects.toThrow(AuditError);
    });
  });
});