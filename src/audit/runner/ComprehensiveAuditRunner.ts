// Comprehensive Audit Runner for LibertyX Platform

import { AuditOrchestrator } from '../orchestrator/AuditOrchestrator.js';
import { ReportGenerator } from '../reporting/ReportGenerator.js';
import { AuditDashboard } from '../dashboard/AuditDashboard.js';
import { ScoringEngine } from '../scoring/ScoringEngine.js';
import { AuditConfigManager } from '../config/AuditConfigManager.js';
import { ComprehensiveAuditReport } from '../types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface AuditRunnerOptions {
  configPath?: string;
  outputPath?: string;
  generateDashboard?: boolean;
  verbose?: boolean;
  saveResults?: boolean;
}

export class ComprehensiveAuditRunner extends EventEmitter {
  private options: AuditRunnerOptions;

  constructor(options: AuditRunnerOptions = {}) {
    super();
    this.options = {
      configPath: './audit.config.json',
      outputPath: './audit-reports',
      generateDashboard: true,
      verbose: false,
      saveResults: true,
      ...options
    };
  }

  /**
   * Run comprehensive audit on the LibertyX platform
   */
  async runComprehensiveAudit(): Promise<{
    report: ComprehensiveAuditReport;
    reportPaths: { jsonPath?: string; htmlPath?: string };
    dashboardPath?: string;
    summary: string;
  }> {
    console.log('🔍 Starting Comprehensive LibertyX Platform Audit...');
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      // Initialize configuration
      await this.initializeConfiguration();

      // Initialize audit orchestrator
      const orchestrator = new AuditOrchestrator();

      // Run the comprehensive audit
      console.log('🚀 Executing audit phases...\n');
      const auditReport = await orchestrator.executeAudit({
        onProgress: (progress) => {
          this.emit('progress', progress);
        },
        onPhaseComplete: (phase, report) => {
          this.emit('phaseComplete', phase, report);
          const scoreColor = report.score >= 80 ? '✅' : report.score >= 60 ? '⚠️' : '❌';
          console.log(`   ${scoreColor} ${phase}: ${report.score}/100`);
        }
      });

      // Display phase results
      console.log('\n📊 Phase Results:');
      auditReport.phasesExecuted.forEach(phase => {
        const report = auditReport.reports[phase];
        if (report) {
          const scoreColor = report.score >= 80 ? '✅' : report.score >= 60 ? '⚠️' : '❌';
          console.log(`   ${scoreColor} ${phase}: ${report.score}/100`);
        }
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.log('\n📊 Generating reports...');
      
      // Generate reports
      const reportGenerator = new ReportGenerator({
        outputPath: this.options.outputPath!,
        format: 'both',
        includeDetails: true,
        includeCharts: true,
        theme: 'light'
      });

      const reportPaths = await reportGenerator.generateReport(auditReport);

      // Generate dashboard if requested
      let dashboardPath: string | undefined;
      if (this.options.generateDashboard) {
        console.log('🎨 Generating interactive dashboard...');
        const dashboard = new AuditDashboard({
          outputPath: path.join(this.options.outputPath!, 'dashboard'),
          title: 'LibertyX Platform Audit Dashboard',
          theme: 'light',
          includeHistoricalData: true,
          enableInteractivity: true,
          showTrends: true
        });
        
        dashboardPath = await dashboard.generateDashboard(auditReport);
      }

      // Generate summary
      const summary = this.generateAuditSummary(auditReport, executionTime);

      // Save results if requested
      if (this.options.saveResults) {
        await this.saveAuditResults(auditReport, summary);
      }

      // Display results
      console.log('\n' + '='.repeat(60));
      console.log('🎯 AUDIT COMPLETED');
      console.log('='.repeat(60));
      console.log(summary);
      console.log('='.repeat(60));

      return {
        report: auditReport,
        reportPaths,
        dashboardPath,
        summary
      };

    } catch (error) {
      console.error('❌ Audit execution failed:');
      console.error(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Initialize audit configuration
   */
  private async initializeConfiguration(): Promise<void> {
    const configManager = new AuditConfigManager(this.options.configPath);
    
    try {
      await configManager.loadConfig();
      console.log(`✅ Configuration loaded from ${this.options.configPath}`);
    } catch (error) {
      console.log(`⚠️  No configuration found, creating default configuration...`);
      await configManager.saveConfig();
      console.log(`✅ Default configuration created at ${this.options.configPath}`);
    }

    // Ensure output directory exists
    await fs.mkdir(this.options.outputPath!, { recursive: true });
  }

  /**
   * Generate audit summary
   */
  private generateAuditSummary(report: ComprehensiveAuditReport, executionTime: number): string {
    const lines: string[] = [];
    
    lines.push(`📊 LIBERTYX PLATFORM AUDIT SUMMARY`);
    lines.push(``);
    lines.push(`🎯 Overall Results:`);
    lines.push(`   Score: ${report.overallScore}/100`);
    lines.push(`   Status: ${report.overallStatus.toUpperCase()}`);
    lines.push(`   Production Readiness: ${report.productionReadiness.replace('_', ' ')}`);
    lines.push(`   Execution Time: ${(executionTime / 1000).toFixed(2)}s`);
    lines.push(``);
    
    lines.push(`📋 Phase Results:`);
    report.phasesExecuted.forEach(phase => {
      const phaseReport = report.reports[phase];
      if (phaseReport) {
        const icon = phaseReport.status === 'passed' ? '✅' : 
                    phaseReport.status === 'warning' ? '⚠️' : '❌';
        lines.push(`   ${icon} ${phase.replace('_', ' ')}: ${phaseReport.score}/100 (${phaseReport.status})`);
      }
    });
    lines.push(``);
    
    if (report.errors.length > 0) {
      lines.push(`❌ Errors (${report.errors.length}):`);
      report.errors.slice(0, 5).forEach(error => {
        lines.push(`   • ${error.phase}: ${error.message}`);
      });
      if (report.errors.length > 5) {
        lines.push(`   ... and ${report.errors.length - 5} more errors`);
      }
      lines.push(``);
    }
    
    if (report.recommendations.length > 0) {
      lines.push(`💡 Top Recommendations:`);
      report.recommendations.slice(0, 8).forEach((rec, index) => {
        lines.push(`   ${index + 1}. ${rec}`);
      });
      if (report.recommendations.length > 8) {
        lines.push(`   ... and ${report.recommendations.length - 8} more recommendations`);
      }
      lines.push(``);
    }
    
    // Production readiness assessment
    const scoringEngine = new ScoringEngine();
    const readinessAssessment = scoringEngine.assessProductionReadiness(report);
    
    lines.push(`🚀 Production Readiness Assessment:`);
    lines.push(`   Level: ${readinessAssessment.level.replace('_', ' ')}`);
    lines.push(`   Confidence: ${readinessAssessment.confidence}%`);
    
    if (readinessAssessment.blockers.length > 0) {
      lines.push(`   🚫 Blockers:`);
      readinessAssessment.blockers.forEach(blocker => {
        lines.push(`      • ${blocker}`);
      });
    }
    
    if (readinessAssessment.warnings.length > 0) {
      lines.push(`   ⚠️  Warnings:`);
      readinessAssessment.warnings.slice(0, 3).forEach(warning => {
        lines.push(`      • ${warning}`);
      });
    }
    
    if (readinessAssessment.strengths.length > 0) {
      lines.push(`   ✅ Strengths:`);
      readinessAssessment.strengths.slice(0, 3).forEach(strength => {
        lines.push(`      • ${strength}`);
      });
    }
    
    if (readinessAssessment.estimatedTimeToReady) {
      lines.push(`   ⏱️  Estimated time to ready: ${readinessAssessment.estimatedTimeToReady}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Save audit results
   */
  private async saveAuditResults(report: ComprehensiveAuditReport, summary: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save summary
    const summaryPath = path.join(this.options.outputPath!, `audit-summary-${timestamp}.txt`);
    await fs.writeFile(summaryPath, summary, 'utf-8');
    
    // Save detailed results
    const resultsPath = path.join(this.options.outputPath!, `audit-results-${timestamp}.json`);
    await fs.writeFile(resultsPath, JSON.stringify({
      timestamp: new Date(),
      platform: 'LibertyX Decentralized Content Platform',
      version: '1.0.0',
      auditReport: report,
      summary
    }, null, 2), 'utf-8');
    
    console.log(`💾 Results saved:`);
    console.log(`   Summary: ${summaryPath}`);
    console.log(`   Details: ${resultsPath}`);
  }

  /**
   * Analyze specific areas of concern
   */
  async analyzeSpecificConcerns(): Promise<{
    securityConcerns: string[];
    performanceConcerns: string[];
    qualityConcerns: string[];
    testingConcerns: string[];
  }> {
    // This would analyze the codebase for specific concerns
    // For now, return mock data based on common issues in decentralized platforms
    
    return {
      securityConcerns: [
        'Smart contract interactions need security review',
        'Private key handling requires additional validation',
        'Input sanitization for user-generated content',
        'Cross-site scripting (XSS) prevention in React components'
      ],
      performanceConcerns: [
        'Large bundle size (2.5MB) may impact load times',
        'Blockchain interactions could benefit from caching',
        'Image optimization needed for better performance',
        'Code splitting recommended for better loading'
      ],
      qualityConcerns: [
        'TypeScript strict mode should be enabled',
        'ESLint configuration needs stricter rules',
        'Code complexity in some components is high',
        'Consistent error handling patterns needed'
      ],
      testingConcerns: [
        'Unit test coverage is below recommended threshold',
        'Integration tests for blockchain interactions missing',
        'End-to-end tests for critical user flows needed',
        'Mock strategies for external services required'
      ]
    };
  }

  /**
   * Generate improvement roadmap
   */
  generateImprovementRoadmap(report: ComprehensiveAuditReport): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    
    // Categorize recommendations based on priority and effort
    report.recommendations.forEach(rec => {
      const lowerTitle = rec.title.toLowerCase();
      const lowerDesc = rec.description.toLowerCase();
      
      if (rec.priority === 'HIGH' || lowerTitle.includes('critical') || lowerTitle.includes('security') || lowerDesc.includes('vulnerability')) {
        immediate.push(rec.title);
      } else if (rec.priority === 'MEDIUM' || lowerTitle.includes('test') || lowerTitle.includes('coverage') || lowerTitle.includes('fix')) {
        shortTerm.push(rec.title);
      } else {
        longTerm.push(rec.title);
      }
    });
    
    // Add general improvements if categories are empty
    if (immediate.length === 0) {
      immediate.push('Review and address any critical security issues');
      immediate.push('Ensure all dependencies are up to date');
    }
    
    if (shortTerm.length === 0) {
      shortTerm.push('Improve test coverage to 80%+');
      shortTerm.push('Optimize bundle size and performance');
      shortTerm.push('Enhance error handling and logging');
    }
    
    if (longTerm.length === 0) {
      longTerm.push('Implement comprehensive monitoring and alerting');
      longTerm.push('Add advanced accessibility features');
      longTerm.push('Create comprehensive documentation');
    }
    
    return {
      immediate: immediate.slice(0, 5),
      shortTerm: shortTerm.slice(0, 8),
      longTerm: longTerm.slice(0, 5)
    };
  }

  /**
   * Run audit with configuration
   */
  async runAudit(): Promise<ComprehensiveAuditReport> {
    const result = await this.runComprehensiveAudit();
    return result.report;
  }

  /**
   * Generate reports for a given audit report
   */
  async generateReports(auditReport: ComprehensiveAuditReport): Promise<{ jsonPath?: string; htmlPath?: string }> {
    const reportGenerator = new ReportGenerator({
      outputPath: this.options.outputPath!,
      format: 'both',
      includeDetails: true,
      includeCharts: true,
      theme: 'light'
    });

    return await reportGenerator.generateReport(auditReport);
  }
}