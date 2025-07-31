// Private Key Security Analyzer Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { PrivateKeySecurityAnalyzer } from '../src/audit/analyzers/PrivateKeySecurityAnalyzer.js';

describe('PrivateKeySecurityAnalyzer', () => {
  let analyzer: PrivateKeySecurityAnalyzer;

  beforeEach(() => {
    analyzer = new PrivateKeySecurityAnalyzer();
  });

  describe('generateSecurityRecommendations', () => {
    it('should generate critical recommendations for high-risk scenarios', () => {
      const mockAuditReport = {
        exposures: [],
        storageChecks: [],
        riskLevel: 'CRITICAL' as const,
        statistics: {
          totalExposures: 5,
          criticalExposures: 2,
          highExposures: 2,
          mediumExposures: 1,
          lowExposures: 0,
          secureStorageCount: 1,
          insecureStorageCount: 2,
          filesScanned: 10
        },
        recommendations: [],
        bestPractices: [],
        timestamp: new Date()
      };

      const recommendations = analyzer.generateSecurityRecommendations(mockAuditReport);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('CRITICAL'))).toBe(true);
    });

    it('should generate best practice recommendations', () => {
      const mockAuditReport = {
        exposures: [],
        storageChecks: [],
        riskLevel: 'LOW' as const,
        statistics: {
          totalExposures: 0,
          criticalExposures: 0,
          highExposures: 0,
          mediumExposures: 0,
          lowExposures: 0,
          secureStorageCount: 5,
          insecureStorageCount: 0,
          filesScanned: 10
        },
        recommendations: [],
        bestPractices: [],
        timestamp: new Date()
      };

      const recommendations = analyzer.generateSecurityRecommendations(mockAuditReport);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.some(r => r.includes('automated secret scanning'))).toBe(true);
    });
  });

  describe('key exposure patterns', () => {
    it('should have initialized key exposure patterns', () => {
      const patterns = analyzer['keyExposurePatterns'];
      
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
      
      const patternNames = patterns.map(p => p.name);
      expect(patternNames).toContain('Hardcoded Private Key');
      expect(patternNames).toContain('API Secret Key');
    });

    it('should have proper severity levels', () => {
      const patterns = analyzer['keyExposurePatterns'];
      
      for (const pattern of patterns) {
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(pattern.severity);
        expect(typeof pattern.description).toBe('string');
        expect(pattern.pattern).toBeInstanceOf(RegExp);
      }
    });
  });

  describe('analyzer initialization', () => {
    it('should initialize without errors', () => {
      expect(() => new PrivateKeySecurityAnalyzer()).not.toThrow();
    });

    it('should have required methods', () => {
      expect(typeof analyzer.auditPrivateKeyHandling).toBe('function');
      expect(typeof analyzer.validateSecureStorage).toBe('function');
      expect(typeof analyzer.generateSecurityRecommendations).toBe('function');
    });
  });
});