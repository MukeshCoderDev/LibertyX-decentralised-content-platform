// Test Coverage Analyzer Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { TestCoverageAnalyzer } from '../src/audit/analyzers/TestCoverageAnalyzer.js';

describe('TestCoverageAnalyzer', () => {
  let analyzer: TestCoverageAnalyzer;

  beforeEach(() => {
    analyzer = new TestCoverageAnalyzer(80, 'echo "test output"', './coverage');
  });

  describe('generateCoverageRecommendations', () => {
    it('should generate recommendations for low coverage', () => {
      const mockCoverageReport = {
        unitTestCoverage: 60,
        integrationTestCoverage: 0,
        componentTestCoverage: 0,
        e2eTestCoverage: 0,
        overallCoverage: 60,
        uncoveredFiles: ['src/utils.ts', 'src/helpers.ts'],
        criticalPathsCovered: false,
        details: {
          totalTests: 10,
          passedTests: 8,
          failedTests: 2,
          testDuration: 5000,
          coverageByType: {
            lines: 60,
            functions: 55,
            statements: 58,
            branches: 45
          },
          fileCoverage: [],
          thresholdsMet: {
            overall: false,
            functions: false,
            statements: false,
            branches: false
          }
        }
      };

      const recommendations = analyzer.generateCoverageRecommendations(mockCoverageReport);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('90%'))).toBe(true);
      expect(recommendations.some(r => r.includes('uncovered files'))).toBe(true);
      expect(recommendations.some(r => r.includes('critical business logic'))).toBe(true);
      expect(recommendations.some(r => r.includes('branch coverage'))).toBe(true);
      expect(recommendations.some(r => r.includes('failing tests'))).toBe(true);
    });

    it('should generate minimal recommendations for good coverage', () => {
      const mockCoverageReport = {
        unitTestCoverage: 95,
        integrationTestCoverage: 0,
        componentTestCoverage: 0,
        e2eTestCoverage: 0,
        overallCoverage: 95,
        uncoveredFiles: [],
        criticalPathsCovered: true,
        details: {
          totalTests: 50,
          passedTests: 50,
          failedTests: 0,
          testDuration: 2000,
          coverageByType: {
            lines: 95,
            functions: 92,
            statements: 94,
            branches: 88
          },
          fileCoverage: [],
          thresholdsMet: {
            overall: true,
            functions: true,
            statements: true,
            branches: true
          }
        }
      };

      const recommendations = analyzer.generateCoverageRecommendations(mockCoverageReport);

      expect(Array.isArray(recommendations)).toBe(true);
      // Should have fewer recommendations for good coverage
      expect(recommendations.length).toBeLessThan(3);
    });

    it('should recommend performance optimization for slow tests', () => {
      const mockCoverageReport = {
        unitTestCoverage: 85,
        integrationTestCoverage: 0,
        componentTestCoverage: 0,
        e2eTestCoverage: 0,
        overallCoverage: 85,
        uncoveredFiles: [],
        criticalPathsCovered: true,
        details: {
          totalTests: 100,
          passedTests: 100,
          failedTests: 0,
          testDuration: 45000, // 45 seconds - slow
          coverageByType: {
            lines: 85,
            functions: 82,
            statements: 84,
            branches: 78
          },
          fileCoverage: [],
          thresholdsMet: {
            overall: true,
            functions: true,
            statements: true,
            branches: false
          }
        }
      };

      const recommendations = analyzer.generateCoverageRecommendations(mockCoverageReport);

      expect(recommendations.some(r => r.includes('test performance'))).toBe(true);
    });
  });

  describe('analyzer initialization', () => {
    it('should initialize with default values', () => {
      const defaultAnalyzer = new TestCoverageAnalyzer();
      expect(defaultAnalyzer).toBeDefined();
    });

    it('should initialize with custom values', () => {
      const customAnalyzer = new TestCoverageAnalyzer(90, 'custom command', './custom-coverage');
      expect(customAnalyzer).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof analyzer.runUnitTests).toBe('function');
      expect(typeof analyzer.analyzeCoverage).toBe('function');
      expect(typeof analyzer.validateCoverageThresholds).toBe('function');
      expect(typeof analyzer.generateCoverageRecommendations).toBe('function');
    });
  });

  describe('test parsing', () => {
    it('should parse test line correctly', () => {
      const parseTestLine = analyzer['parseTestLine'];
      
      const passedTest = '✓ should work correctly 5ms';
      const result = parseTestLine.call(analyzer, passedTest);
      
      expect(result).toBeDefined();
      expect(result?.status).toBe('passed');
      expect(result?.duration).toBe(5);
    });

    it('should parse failed test line correctly', () => {
      const parseTestLine = analyzer['parseTestLine'];
      
      const failedTest = '× should handle errors 10ms';
      const result = parseTestLine.call(analyzer, failedTest);
      
      expect(result).toBeDefined();
      expect(result?.status).toBe('failed');
      expect(result?.duration).toBe(10);
    });

    it('should parse skipped test line correctly', () => {
      const parseTestLine = analyzer['parseTestLine'];
      
      const skippedTest = '○ should be implemented later';
      const result = parseTestLine.call(analyzer, skippedTest);
      
      expect(result).toBeDefined();
      expect(result?.status).toBe('skipped');
    });

    it('should return null for invalid test line', () => {
      const parseTestLine = analyzer['parseTestLine'];
      
      const invalidLine = 'This is not a test line';
      const result = parseTestLine.call(analyzer, invalidLine);
      
      expect(result).toBeNull();
    });
  });

  describe('coverage data parsing', () => {
    it('should parse coverage summary correctly', () => {
      const parseCoverageSummary = analyzer['parseCoverageSummary'];
      
      const mockSummary = {
        'src/utils.ts': {
          lines: { total: 100, covered: 80, skipped: 0, pct: 80 },
          functions: { total: 10, covered: 8, skipped: 0, pct: 80 },
          statements: { total: 95, covered: 76, skipped: 0, pct: 80 },
          branches: { total: 20, covered: 15, skipped: 0, pct: 75 }
        },
        total: {
          lines: { total: 100, covered: 80, skipped: 0, pct: 80 }
        }
      };

      const result = parseCoverageSummary.call(analyzer, mockSummary);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].path).toBe('src/utils.ts');
      expect(result[0].coverage.lines.pct).toBe(80);
    });
  });

  describe('file operations', () => {
    it('should handle file existence check', async () => {
      const fileExists = analyzer['fileExists'];
      
      // Test with a file that likely doesn't exist
      const exists = await fileExists.call(analyzer, './non-existent-file.json');
      expect(exists).toBe(false);
    });
  });
});