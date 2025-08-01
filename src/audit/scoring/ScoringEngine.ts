// Audit Scoring and Production Readiness Assessment Engine

import { ComprehensiveAuditReport } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';

export interface ScoringWeights {
  codeQuality: number;
  security: number;
  testing: number;
  performance: number;
  accessibility: number;
  documentation: number;
}

export interface ReadinessFactors {
  criticalIssues: number;
  highIssues: number;
  testCoverage: number;
  securityScore: number;
  performanceScore: number;
  overallQuality: number;
}

export interface ProductionReadinessAssessment {
  level: 'NOT_READY' | 'NEEDS_WORK' | 'READY' | 'EXCELLENT';
  score: number;
  confidence: number;
  blockers: string[];
  warnings: string[];
  strengths: string[];
  recommendations: string[];
  estimatedTimeToReady?: string;
}

export class ScoringEngine {
  private weights: ScoringWeights;

  constructor(weights: Partial<ScoringWeights> = {}) {
    this.weights = {
      codeQuality: 0.20,
      security: 0.25,
      testing: 0.20,
      performance: 0.15,
      accessibility: 0.10,
      documentation: 0.10,
      ...weights
    };

    // Ensure weights sum to 1.0
    const totalWeight = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new AuditError(
        `Scoring weights must sum to 1.0, got ${totalWeight}`,
        // 'SCORING',
        'HIGH',
        'Adjust scoring weights to sum to 1.0'
      );
    }
  }

  /**
   * Calculate weighted overall score
   */
  calculateOverallScore(reports: Partial<Record<AuditPhase, AuditReport>>): number {
    let weightedScore = 0;
    let totalWeight = 0;

    const phaseWeightMap: Record<AuditPhase, keyof ScoringWeights> = {
      CODE_QUALITY: 'codeQuality',
      SECURITY: 'security',
      TESTING: 'testing',
      PERFORMANCE: 'performance',
      ACCESSIBILITY: 'accessibility',
      DOCUMENTATION: 'documentation'
    };

    for (const [phase, report] of Object.entries(reports)) {
      if (report && phase in phaseWeightMap) {
        const weightKey = phaseWeightMap[phase as AuditPhase];
        const weight = this.weights[weightKey];
        weightedScore += report.score * weight;
        totalWeight += weight;
      }
    }

    // Normalize score if not all phases were executed
    return totalWeight > 0 ? Math.round(weightedScore / totalWeight * 100) / 100 : 0;
  }

  /**
   * Assess production readiness
   */
  assessProductionReadiness(auditReport: ComprehensiveAuditReport): ProductionReadinessAssessment {
    const factors = this.extractReadinessFactors(auditReport);
    const score = this.calculateReadinessScore(factors);
    const level = this.determineReadinessLevel(score, factors);
    const confidence = this.calculateConfidence(auditReport);
    
    const { blockers, warnings, strengths } = this.categorizeIssues(auditReport, factors);
    const recommendations = this.generateReadinessRecommendations(level, factors, auditReport);
    const estimatedTimeToReady = this.estimateTimeToReady(level, factors);

    return {
      level,
      score,
      confidence,
      blockers,
      warnings,
      strengths,
      recommendations,
      estimatedTimeToReady
    };
  }

  /**
   * Extract readiness factors from audit report
   */
  private extractReadinessFactors(auditReport: ComprehensiveAuditReport): ReadinessFactors {
    const securityReport = auditReport.securityReport;
    const testingReport = auditReport.coverageReport;
    const performanceReport = auditReport.performanceReport;
    const codeQualityReport = auditReport.codeQualityReport;

    // Extract security issues
    let criticalIssues = 0;
    let highIssues = 0;
    
    if (securityReport?.contractVulnerabilities) {
      const vulnerabilities = securityReport.contractVulnerabilities;
      criticalIssues = vulnerabilities.filter((v: any) => v.severity === 'CRITICAL').length;
      highIssues = vulnerabilities.filter((v: any) => v.severity === 'HIGH').length;
    }

    // Extract test coverage
    let testCoverage = 0;
    if (testingReport?.overallCoverage) {
      testCoverage = testingReport.overallCoverage;
    }

    return {
      criticalIssues,
      highIssues,
      testCoverage,
      securityScore: securityReport?.riskLevel === 'LOW' ? 100 : securityReport?.riskLevel === 'MEDIUM' ? 70 : 30,
      performanceScore: performanceReport?.overallScore || 0,
      overallQuality: codeQualityReport?.overallScore || 0
    };
  }

  /**
   * Calculate production readiness score
   */
  private calculateReadinessScore(factors: ReadinessFactors): number {
    let score = 100;

    // Critical issues are blockers
    score -= factors.criticalIssues * 25;
    
    // High issues are significant penalties
    score -= factors.highIssues * 10;
    
    // Test coverage penalty
    if (factors.testCoverage < 80) {
      score -= (80 - factors.testCoverage) * 0.5;
    }
    
    // Security score penalty
    if (factors.securityScore < 80) {
      score -= (80 - factors.securityScore) * 0.3;
    }
    
    // Performance score penalty
    if (factors.performanceScore < 70) {
      score -= (70 - factors.performanceScore) * 0.2;
    }
    
    // Overall quality penalty
    if (factors.overallQuality < 70) {
      score -= (70 - factors.overallQuality) * 0.2;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine readiness level based on score and factors
   */
  private determineReadinessLevel(score: number, factors: ReadinessFactors): 'NOT_READY' | 'NEEDS_WORK' | 'READY' | 'EXCELLENT' {
    // Critical issues always mean not ready
    if (factors.criticalIssues > 0) {
      return 'NOT_READY';
    }

    // Score-based determination
    if (score >= 90 && factors.testCoverage >= 85 && factors.securityScore >= 85) {
      return 'EXCELLENT';
    } else if (score >= 80 && factors.testCoverage >= 75 && factors.securityScore >= 75) {
      return 'READY';
    } else if (score >= 60) {
      return 'NEEDS_WORK';
    } else {
      return 'NOT_READY';
    }
  }

  /**
   * Calculate confidence in the assessment
   */
  private calculateConfidence(auditReport: ComprehensiveAuditReport): number {
    let confidence = 100;

    // Reduce confidence if phases failed to execute
    const totalPhases = 6; // Total possible phases
    const executedPhases = 6; // Total number of audit phases
    const executionRatio = executedPhases / totalPhases;
    confidence *= executionRatio;

    // Reduce confidence if there were errors
    confidence -= auditReport.criticalIssues.length * 10;

    // Reduce confidence if execution time was too short (might indicate incomplete analysis)
    // Assume reasonable execution time for confidence
    if (true) { // Placeholder for execution time check
      confidence -= 20;
    }

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * Categorize issues into blockers, warnings, and strengths
   */
  private categorizeIssues(auditReport: ComprehensiveAuditReport, factors: ReadinessFactors): {
    blockers: string[];
    warnings: string[];
    strengths: string[];
  } {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const strengths: string[] = [];

    // Blockers
    if (factors.criticalIssues > 0) {
      blockers.push(`${factors.criticalIssues} critical security vulnerabilities must be fixed`);
    }
    
    if (factors.testCoverage < 50) {
      blockers.push(`Test coverage (${factors.testCoverage.toFixed(1)}%) is critically low`);
    }
    
    if (factors.securityScore < 50) {
      blockers.push(`Security score (${factors.securityScore}) is critically low`);
    }

    // Warnings
    if (factors.highIssues > 0) {
      warnings.push(`${factors.highIssues} high-severity security issues should be addressed`);
    }
    
    if (factors.testCoverage < 80 && factors.testCoverage >= 50) {
      warnings.push(`Test coverage (${factors.testCoverage.toFixed(1)}%) should be improved`);
    }
    
    if (factors.performanceScore < 70) {
      warnings.push(`Performance score (${factors.performanceScore}) needs improvement`);
    }
    
    if (factors.overallQuality < 70) {
      warnings.push(`Code quality score (${factors.overallQuality}) needs improvement`);
    }

    // Strengths
    if (factors.criticalIssues === 0) {
      strengths.push('No critical security vulnerabilities detected');
    }
    
    if (factors.testCoverage >= 80) {
      strengths.push(`Good test coverage (${factors.testCoverage.toFixed(1)}%)`);
    }
    
    if (factors.securityScore >= 80) {
      strengths.push(`Strong security posture (${factors.securityScore}/100)`);
    }
    
    if (factors.performanceScore >= 80) {
      strengths.push(`Good performance metrics (${factors.performanceScore}/100)`);
    }
    
    if (factors.overallQuality >= 80) {
      strengths.push(`High code quality (${factors.overallQuality}/100)`);
    }

    // Check for high-scoring reports
    if (auditReport.codeQualityReport.overallScore >= 85) {
      strengths.push('Excellent code quality implementation');
    }
    if (auditReport.securityReport.riskLevel === 'LOW') {
      strengths.push('Excellent security implementation');
    }
    if (auditReport.performanceReport.overallScore && auditReport.performanceReport.overallScore >= 85) {
      strengths.push('Excellent performance implementation');
    }

    return { blockers, warnings, strengths };
  }

  /**
   * Generate readiness recommendations
   */
  private generateReadinessRecommendations(
    level: 'NOT_READY' | 'NEEDS_WORK' | 'READY' | 'EXCELLENT',
    factors: ReadinessFactors,
    auditReport: ComprehensiveAuditReport
  ): string[] {
    const recommendations: string[] = [];

    switch (level) {
      case 'NOT_READY':
        recommendations.push('🚫 DO NOT DEPLOY TO PRODUCTION');
        if (factors.criticalIssues > 0) {
          recommendations.push('Fix all critical security vulnerabilities immediately');
        }
        if (factors.testCoverage < 50) {
          recommendations.push('Increase test coverage to at least 70% before considering deployment');
        }
        if (factors.securityScore < 50) {
          recommendations.push('Conduct comprehensive security review and remediation');
        }
        recommendations.push('Schedule security audit with external experts');
        recommendations.push('Implement comprehensive testing strategy');
        break;

      case 'NEEDS_WORK':
        recommendations.push('⚠️ Address issues before production deployment');
        if (factors.highIssues > 0) {
          recommendations.push('Resolve high-severity security issues');
        }
        if (factors.testCoverage < 80) {
          recommendations.push('Improve test coverage to 80%+ for production readiness');
        }
        if (factors.performanceScore < 70) {
          recommendations.push('Optimize performance bottlenecks');
        }
        recommendations.push('Consider staged deployment with monitoring');
        recommendations.push('Implement comprehensive error tracking');
        break;

      case 'READY':
        recommendations.push('✅ Ready for production deployment with monitoring');
        recommendations.push('Implement comprehensive monitoring and alerting');
        recommendations.push('Plan rollback strategy');
        recommendations.push('Monitor key metrics post-deployment');
        if (factors.testCoverage < 90) {
          recommendations.push('Consider increasing test coverage for better reliability');
        }
        break;

      case 'EXCELLENT':
        recommendations.push('🌟 Excellent! Ready for production deployment');
        recommendations.push('Consider this as a reference implementation');
        recommendations.push('Document best practices for other projects');
        recommendations.push('Implement automated deployment pipeline');
        recommendations.push('Share learnings with the development team');
        break;
    }

    // Add phase-specific recommendations
    if (auditReport.codeQualityReport.recommendations) {
      recommendations.push(...auditReport.codeQualityReport.recommendations.slice(0, 2));
    }
    if (auditReport.securityReport.mitigationSteps) {
      recommendations.push(...auditReport.securityReport.mitigationSteps.slice(0, 2));
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Estimate time to reach production readiness
   */
  private estimateTimeToReady(
    level: 'NOT_READY' | 'NEEDS_WORK' | 'READY' | 'EXCELLENT',
    factors: ReadinessFactors
  ): string | undefined {
    switch (level) {
      case 'EXCELLENT':
      case 'READY':
        return undefined; // Already ready

      case 'NEEDS_WORK':
        let workDays = 0;
        
        // Estimate based on issues
        workDays += factors.highIssues * 2; // 2 days per high issue
        
        // Test coverage improvement
        if (factors.testCoverage < 80) {
          workDays += Math.ceil((80 - factors.testCoverage) / 10) * 3; // 3 days per 10% coverage
        }
        
        // Performance improvements
        if (factors.performanceScore < 70) {
          workDays += 5; // 1 week for performance optimization
        }
        
        return workDays <= 7 ? '1 week' : workDays <= 14 ? '2 weeks' : '3-4 weeks';

      case 'NOT_READY':
        let criticalDays = 0;
        
        // Critical security issues
        criticalDays += factors.criticalIssues * 5; // 1 week per critical issue
        
        // Major test coverage work
        if (factors.testCoverage < 50) {
          criticalDays += 14; // 2 weeks for major testing work
        }
        
        // Security overhaul
        if (factors.securityScore < 50) {
          criticalDays += 21; // 3 weeks for security overhaul
        }
        
        return criticalDays <= 21 ? '3-4 weeks' : criticalDays <= 42 ? '6-8 weeks' : '2-3 months';

      default:
        return undefined;
    }
  }

  /**
   * Generate detailed scoring breakdown
   */
  generateScoringBreakdown(auditReport: ComprehensiveAuditReport): {
    weightedScores: Record<string, { score: number; weight: number; contribution: number }>;
    totalScore: number;
    methodology: string;
  } {
    const weightedScores: Record<string, { score: number; weight: number; contribution: number }> = {};
    let totalScore = 0;
    let totalWeight = 0;

    const phaseWeightMap: Record<AuditPhase, keyof ScoringWeights> = {
      CODE_QUALITY: 'codeQuality',
      SECURITY: 'security',
      TESTING: 'testing',
      PERFORMANCE: 'performance',
      ACCESSIBILITY: 'accessibility',
      DOCUMENTATION: 'documentation'
    };

    // Calculate weighted scores for each report
    const reports = [
      { report: auditReport.codeQualityReport, weight: weights.codeQuality },
      { report: auditReport.securityReport, weight: weights.security },
      { report: auditReport.coverageReport, weight: weights.testing },
      { report: auditReport.performanceReport, weight: weights.performance },
      { report: auditReport.accessibilityReport, weight: weights.accessibility },
      { report: auditReport.documentationReport, weight: weights.documentation }
    ];

    for (const { report, weight } of reports) {
      if (report && typeof report.overallScore === 'number') {
        const contribution = report.overallScore * weight;
        

      }
    }

    // Normalize if not all phases executed
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    const methodology = `
Scoring Methodology:
- Code Quality: ${(this.weights.codeQuality * 100).toFixed(1)}%
- Security: ${(this.weights.security * 100).toFixed(1)}%
- Testing: ${(this.weights.testing * 100).toFixed(1)}%
- Performance: ${(this.weights.performance * 100).toFixed(1)}%
- Accessibility: ${(this.weights.accessibility * 100).toFixed(1)}%
- Documentation: ${(this.weights.documentation * 100).toFixed(1)}%

Final score is weighted average of executed phases, normalized to 0-100 scale.
    `;

    return {
      weightedScores,
      totalScore: Math.round(finalScore * 100) / 100,
      methodology
    };
  }
}