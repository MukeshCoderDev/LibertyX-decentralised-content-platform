// Test for Audit Infrastructure

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditError, DefaultErrorHandler } from '../src/audit/errors/AuditError.js';
import { AuditConfigurationManager } from '../src/audit/config/AuditConfiguration.js';
import { 
  calculateOverallScore, 
  determineReadinessLevel, 
  generateNextSteps,
  formatFileSize,
  formatDuration,
  calculatePercentage,
  getSeverityColor,
  sortBySeverity
} from '../src/audit/utils/index.js';
import type { CriticalIssue, Recommendation } from '../src/audit/types/index.js';

describe('Audit Infrastructure', () => {
  describe('AuditError', () => {
    it('should create audit error with all properties', () => {
      const error = new AuditError(
        'Test error message',
        'CODE_QUALITY',
        'HIGH',
        'Fix the code',
        'test.ts',
        42
      );

      expect(error.message).toBe('Test error message');
      expect(error.category).toBe('CODE_QUALITY');
      expect(error.severity).toBe('HIGH');
      expect(error.remediation).toBe('Fix the code');
      expect(error.file).toBe('test.ts');
      expect(error.line).toBe(42);
      expect(error.name).toBe('AuditError');
    });

    it('should identify critical errors', () => {
      const criticalError = new AuditError('Critical', 'SECURITY', 'CRITICAL');
      const highError = new AuditError('High', 'SECURITY', 'HIGH');

      expect(criticalError.isCritical()).toBe(true);
      expect(highError.isCritical()).toBe(false);
      expect(highError.isHigh()).toBe(true);
    });

    it('should generate user-friendly messages', () => {
      const error = new AuditError(
        'Type error',
        'CODE_QUALITY',
        'HIGH',
        'Add type annotations',
        'src/main.ts',
        15
      );

      const userMessage = error.getUserMessage();
      expect(userMessage).toContain('[CODE_QUALITY] Type error');
      expect(userMessage).toContain('(src/main.ts:15)');
      expect(userMessage).toContain('Remediation: Add type annotations');
    });

    it('should serialize to JSON', () => {
      const error = new AuditError('Test', 'SECURITY', 'CRITICAL', 'Fix it');
      const json = error.toJSON();

      expect(json.name).toBe('AuditError');
      expect(json.message).toBe('Test');
      expect(json.category).toBe('SECURITY');
      expect(json.severity).toBe('CRITICAL');
      expect(json.remediation).toBe('Fix it');
    });
  });

  describe('DefaultErrorHandler', () => {
    let errorHandler: DefaultErrorHandler;

    beforeEach(() => {
      errorHandler = new DefaultErrorHandler();
    });

    it('should handle and store audit errors', async () => {
      const error = new AuditError('Test error', 'CODE_QUALITY', 'MEDIUM');
      await errorHandler.handleAuditError(error);

      const report = await errorHandler.generateErrorReport();
      expect(report.totalErrors).toBe(1);
      expect(report.mediumSeverityErrors).toBe(1);
      expect(report.errorsByCategory['CODE_QUALITY']).toBe(1);
    });

    it('should categorize errors by severity', async () => {
      const errors = [
        new AuditError('Critical', 'SECURITY', 'CRITICAL'),
        new AuditError('High', 'CODE_QUALITY', 'HIGH'),
        new AuditError('Medium', 'TESTING', 'MEDIUM'),
        new AuditError('Low', 'DOCUMENTATION', 'LOW')
      ];

      for (const error of errors) {
        await errorHandler.handleAuditError(error);
      }

      const report = await errorHandler.generateErrorReport();
      expect(report.criticalErrors).toBe(1);
      expect(report.highSeverityErrors).toBe(1);
      expect(report.mediumSeverityErrors).toBe(1);
      expect(report.lowSeverityErrors).toBe(1);
    });

    it('should detect critical errors', async () => {
      const criticalError = new AuditError('Critical', 'SECURITY', 'CRITICAL');
      await errorHandler.handleAuditError(criticalError);

      expect(errorHandler.hasCriticalErrors()).toBe(true);
      expect(errorHandler.shouldFailAudit()).toBe(true);
    });

    it('should filter errors by severity and category', async () => {
      const errors = [
        new AuditError('Security Critical', 'SECURITY', 'CRITICAL'),
        new AuditError('Security High', 'SECURITY', 'HIGH'),
        new AuditError('Quality High', 'CODE_QUALITY', 'HIGH')
      ];

      for (const error of errors) {
        await errorHandler.handleAuditError(error);
      }

      const criticalErrors = errorHandler.getErrorsBySeverity('CRITICAL');
      const securityErrors = errorHandler.getErrorsByCategory('SECURITY');

      expect(criticalErrors).toHaveLength(1);
      expect(securityErrors).toHaveLength(2);
    });
  });

  describe('AuditConfigurationManager', () => {
    it('should provide default configuration', () => {
      const config = AuditConfigurationManager.getDefaultConfiguration();

      expect(config.codeQuality.enableTypeScriptCheck).toBe(true);
      expect(config.security.riskThreshold).toBe('MEDIUM');
      expect(config.testing.minCoverageThreshold).toBe(80);
      expect(config.performance.maxLoadTime).toBe(3000);
      expect(config.accessibility.wcagLevel).toBe('AA');
      expect(config.documentation.minAPIDocCoverage).toBe(80);
    });

    it('should validate configuration', () => {
      const invalidConfig = AuditConfigurationManager.getDefaultConfiguration();
      invalidConfig.codeQuality.maxComplexity = -1;
      invalidConfig.testing.minCoverageThreshold = 150;

      expect(() => {
        AuditConfigurationManager.validateConfiguration(invalidConfig);
      }).toThrow(AuditError);
    });

    it('should merge user config with defaults', () => {
      const userConfig = {
        codeQuality: {
          enableTypeScriptCheck: true,
          enableESLint: true,
          maxComplexity: 15,
          maxFunctionLength: 20
        },
        testing: {
          minCoverageThreshold: 90
        }
      };

      const merged = AuditConfigurationManager.mergeWithDefaults(userConfig);

      expect(merged.codeQuality.maxComplexity).toBe(15);
      expect(merged.codeQuality.enableTypeScriptCheck).toBe(true); // Default preserved
      expect(merged.testing.minCoverageThreshold).toBe(90);
      expect(merged.security.riskThreshold).toBe('MEDIUM'); // Default preserved
    });

    it('should provide production configuration', () => {
      const prodConfig = AuditConfigurationManager.getProductionConfiguration();

      expect(prodConfig.codeQuality.maxComplexity).toBe(8);
      expect(prodConfig.security.riskThreshold).toBe('LOW');
      expect(prodConfig.testing.minCoverageThreshold).toBe(90);
      expect(prodConfig.documentation.minAPIDocCoverage).toBe(95);
    });

    it('should export and import configuration', () => {
      const originalConfig = AuditConfigurationManager.getDefaultConfiguration();
      const exported = AuditConfigurationManager.exportConfiguration(originalConfig);
      const imported = AuditConfigurationManager.importConfiguration(exported);

      expect(imported).toEqual(originalConfig);
    });
  });

  describe('Audit Utils', () => {
    it('should calculate overall score correctly', () => {
      const scores = {
        codeQuality: 85,
        security: 90,
        testing: 80,
        performance: 75,
        accessibility: 85,
        documentation: 70
      };

      const overallScore = calculateOverallScore(scores);
      expect(overallScore).toBeGreaterThan(0);
      expect(overallScore).toBeLessThanOrEqual(100);
    });

    it('should determine readiness level', () => {
      const criticalIssues: CriticalIssue[] = [
        {
          category: 'SECURITY',
          severity: 'CRITICAL',
          title: 'Critical Security Issue',
          description: 'Test',
          remediation: 'Fix it',
          impact: 'High'
        }
      ];

      expect(determineReadinessLevel(95, criticalIssues)).toBe('NOT_READY');
      expect(determineReadinessLevel(95, [])).toBe('PRODUCTION_READY');
      expect(determineReadinessLevel(70, [])).toBe('READY');
      expect(determineReadinessLevel(50, [])).toBe('NEEDS_WORK');
    });

    it('should generate next steps', () => {
      const criticalIssues: CriticalIssue[] = [
        {
          category: 'SECURITY',
          severity: 'CRITICAL',
          title: 'Critical Issue',
          description: 'Test',
          remediation: 'Fix',
          impact: 'High'
        }
      ];

      const recommendations: Recommendation[] = [
        {
          category: 'CODE_QUALITY',
          priority: 'HIGH',
          title: 'Improve Code Quality',
          description: 'Test',
          implementation: 'Do it',
          estimatedEffort: 'MEDIUM'
        }
      ];

      const steps = generateNextSteps(criticalIssues, recommendations);
      expect(steps).toContain('Address 1 critical security and quality issues immediately');
      expect(steps).toContain('Implement: Improve Code Quality');
    });

    it('should format file sizes', () => {
      expect(formatFileSize(500)).toBe('500.0 B');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
    });

    it('should format durations', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(1500)).toBe('1.5s');
      expect(formatDuration(90000)).toBe('1.5m');
    });

    it('should calculate percentages', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33.33);
      expect(calculatePercentage(0, 0)).toBe(0);
    });

    it('should provide severity colors', () => {
      expect(getSeverityColor('LOW')).toBe('#28a745');
      expect(getSeverityColor('MEDIUM')).toBe('#ffc107');
      expect(getSeverityColor('HIGH')).toBe('#fd7e14');
      expect(getSeverityColor('CRITICAL')).toBe('#dc3545');
    });

    it('should sort by severity', () => {
      const issues = [
        { severity: 'LOW' as const, name: 'Low' },
        { severity: 'CRITICAL' as const, name: 'Critical' },
        { severity: 'MEDIUM' as const, name: 'Medium' },
        { severity: 'HIGH' as const, name: 'High' }
      ];

      const sorted = sortBySeverity(issues);
      expect(sorted[0].severity).toBe('CRITICAL');
      expect(sorted[1].severity).toBe('HIGH');
      expect(sorted[2].severity).toBe('MEDIUM');
      expect(sorted[3].severity).toBe('LOW');
    });
  });
});