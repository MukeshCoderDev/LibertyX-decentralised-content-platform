// Audit Execution Pipeline Orchestrator

import { AuditConfig, AuditPhase, AuditReport, ComprehensiveAuditReport } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import { AuditConfigManager } from '../config/AuditConfigManager.js';

// Import all analyzers
import { CodeQualityAnalyzer } from '../analyzers/CodeQualityAnalyzer.js';
import { SecurityAuditor } from '../analyzers/SecurityAuditor.js';
import { TestCoverageAnalyzer } from '../analyzers/TestCoverageAnalyzer.js';
import { PerformanceProfiler } from '../analyzers/PerformanceProfiler.js';
import { AccessibilityValidator } from '../analyzers/AccessibilityValidator.js';
import { DocumentationAuditor } from '../analyzers/DocumentationAuditor.js';

export interface AuditProgress {
  phase: AuditPhase;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  startTime?: Date;
  endTime?: Date;
  error?: Error;
}

export interface AuditExecutionOptions {
  configPath?: string;
  overrides?: any;
  onProgress?: (progress: AuditProgress) => void;
  onPhaseComplete?: (phase: AuditPhase, report: AuditReport) => void;
  stopOnError?: boolean;
}

export class AuditOrchestrator {
  private configManager: AuditConfigManager;
  private config: AuditConfig;
  private progress: Map<AuditPhase, AuditProgress>;

  constructor(configPath?: string) {
    this.configManager = new AuditConfigManager(configPath);
    this.progress = new Map();
    this.config = this.configManager.getConfig();
  }

  /**
   * Initialize audit orchestrator
   */
  async initialize(options: AuditExecutionOptions = {}): Promise<void> {
    try {
      // Load configuration
      this.config = await this.configManager.loadConfig();

      // Apply overrides if provided
      if (options.overrides) {
        this.config = { ...this.config, ...options.overrides };
      }

      // Initialize progress tracking
      this.initializeProgress();

    } catch (error) {
      throw new AuditError(
        `Failed to initialize audit orchestrator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ORCHESTRATOR',
        'HIGH',
        'Check audit configuration and dependencies'
      );
    }
  }

  /**
   * Initialize progress tracking for all phases
   */
  private initializeProgress(): void {
    const phases: AuditPhase[] = ['CODE_QUALITY', 'SECURITY', 'TESTING', 'PERFORMANCE', 'ACCESSIBILITY', 'DOCUMENTATION'];
    
    for (const phase of phases) {
      if (this.config.phases[phase]) {
        this.progress.set(phase, {
          phase,
          status: 'pending',
          progress: 0,
          message: `${phase} audit pending`
        });
      }
    }
  }

  /**
   * Execute comprehensive audit
   */
  async executeAudit(options: AuditExecutionOptions = {}): Promise<ComprehensiveAuditReport> {
    const startTime = new Date();
    const reports: Partial<Record<AuditPhase, AuditReport>> = {};
    const errors: Array<{ phase: AuditPhase; error: Error }> = [];

    try {
      await this.initialize(options);

      if (this.config.parallel) {
        // Execute phases in parallel where possible
        await this.executeParallelAudit(reports, errors, options);
      } else {
        // Execute phases sequentially
        await this.executeSequentialAudit(reports, errors, options);
      }

      // Generate comprehensive report
      const comprehensiveReport = await this.generateComprehensiveReport(
        reports,
        errors,
        startTime,
        new Date()
      );

      return comprehensiveReport;

    } catch (error) {
      throw new AuditError(
        `Audit execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ORCHESTRATOR',
        'HIGH',
        'Check audit configuration and system requirements'
      );
    }
  }

  /**
   * Execute audit phases in parallel
   */
  private async executeParallelAudit(
    reports: Partial<Record<AuditPhase, AuditReport>>,
    errors: Array<{ phase: AuditPhase; error: Error }>,
    options: AuditExecutionOptions
  ): Promise<void> {
    // Group phases by dependencies
    const independentPhases: AuditPhase[] = ['CODE_QUALITY', 'SECURITY', 'DOCUMENTATION'];
    const dependentPhases: AuditPhase[] = ['TESTING', 'PERFORMANCE', 'ACCESSIBILITY'];

    // Execute independent phases in parallel
    const independentPromises = independentPhases
      .filter(phase => this.config.phases[phase])
      .map(phase => this.executePhase(phase, options));

    const independentResults = await Promise.allSettled(independentPromises);
    
    // Process independent results
    independentPhases.forEach((phase, index) => {
      if (this.config.phases[phase]) {
        const result = independentResults[index];
        if (result.status === 'fulfilled') {
          reports[phase] = result.value;
        } else {
          errors.push({ phase, error: result.reason });
          if (options.stopOnError) {
            throw result.reason;
          }
        }
      }
    });

    // Execute dependent phases in parallel (they may depend on code analysis)
    const dependentPromises = dependentPhases
      .filter(phase => this.config.phases[phase])
      .map(phase => this.executePhase(phase, options));

    const dependentResults = await Promise.allSettled(dependentPromises);
    
    // Process dependent results
    dependentPhases.forEach((phase, index) => {
      if (this.config.phases[phase]) {
        const result = dependentResults[index];
        if (result.status === 'fulfilled') {
          reports[phase] = result.value;
        } else {
          errors.push({ phase, error: result.reason });
          if (options.stopOnError) {
            throw result.reason;
          }
        }
      }
    });
  }

  /**
   * Execute audit phases sequentially
   */
  private async executeSequentialAudit(
    reports: Partial<Record<AuditPhase, AuditReport>>,
    errors: Array<{ phase: AuditPhase; error: Error }>,
    options: AuditExecutionOptions
  ): Promise<void> {
    const phases: AuditPhase[] = ['CODE_QUALITY', 'SECURITY', 'TESTING', 'PERFORMANCE', 'ACCESSIBILITY', 'DOCUMENTATION'];

    for (const phase of phases) {
      if (this.config.phases[phase]) {
        try {
          const report = await this.executePhase(phase, options);
          reports[phase] = report;
        } catch (error) {
          errors.push({ phase, error: error as Error });
          if (options.stopOnError) {
            throw error;
          }
        }
      }
    }
  }

  /**
   * Execute individual audit phase
   */
  private async executePhase(phase: AuditPhase, options: AuditExecutionOptions): Promise<AuditReport> {
    const progress = this.progress.get(phase);
    if (!progress) {
      throw new AuditError(`Phase ${phase} not initialized`, 'ORCHESTRATOR', 'HIGH', 'Initialize audit orchestrator');
    }

    try {
      // Update progress
      progress.status = 'running';
      progress.startTime = new Date();
      progress.message = `Running ${phase} audit`;
      options.onProgress?.(progress);

      let report: AuditReport;

      // Execute phase-specific analyzer
      switch (phase) {
        case 'CODE_QUALITY':
          report = await this.executeCodeQualityAudit();
          break;
        case 'SECURITY':
          report = await this.executeSecurityAudit();
          break;
        case 'TESTING':
          report = await this.executeTestingAudit();
          break;
        case 'PERFORMANCE':
          report = await this.executePerformanceAudit();
          break;
        case 'ACCESSIBILITY':
          report = await this.executeAccessibilityAudit();
          break;
        case 'DOCUMENTATION':
          report = await this.executeDocumentationAudit();
          break;
        default:
          throw new AuditError(`Unknown audit phase: ${phase}`, 'ORCHESTRATOR', 'HIGH', 'Check phase configuration');
      }

      // Update progress
      progress.status = 'completed';
      progress.progress = 100;
      progress.endTime = new Date();
      progress.message = `${phase} audit completed`;
      options.onProgress?.(progress);
      options.onPhaseComplete?.(phase, report);

      return report;

    } catch (error) {
      // Update progress
      progress.status = 'failed';
      progress.endTime = new Date();
      progress.error = error as Error;
      progress.message = `${phase} audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      options.onProgress?.(progress);

      throw error;
    }
  }

  /**
   * Execute code quality audit
   */
  private async executeCodeQualityAudit(): Promise<AuditReport> {
    const analyzer = new CodeQualityAnalyzer();
    const thresholds = this.configManager.getThresholds('codeQuality');
    
    const codeQualityReport = await analyzer.analyzeCodeQuality();
    
    return {
      phase: 'CODE_QUALITY',
      timestamp: new Date(),
      score: codeQualityReport.score,
      status: codeQualityReport.score >= thresholds.maintainabilityIndex ? 'passed' : 'failed',
      summary: `Code quality analysis completed with score ${codeQualityReport.score}`,
      details: codeQualityReport,
      recommendations: codeQualityReport.recommendations || []
    };
  }

  /**
   * Execute security audit
   */
  private async executeSecurityAudit(): Promise<AuditReport> {
    const auditor = new SecurityAuditor();
    const thresholds = this.configManager.getThresholds('security');
    
    const securityReport = await auditor.auditSecurity();
    
    const criticalCount = securityReport.vulnerabilities?.filter(v => v.severity === 'CRITICAL').length || 0;
    const highCount = securityReport.vulnerabilities?.filter(v => v.severity === 'HIGH').length || 0;
    
    const passed = criticalCount <= thresholds.criticalIssues && highCount <= thresholds.highIssues;
    
    return {
      phase: 'SECURITY',
      timestamp: new Date(),
      score: securityReport.score,
      status: passed ? 'passed' : 'failed',
      summary: `Security audit found ${criticalCount} critical and ${highCount} high severity issues`,
      details: securityReport,
      recommendations: securityReport.recommendations || []
    };
  }

  /**
   * Execute testing audit
   */
  private async executeTestingAudit(): Promise<AuditReport> {
    const analyzer = new TestCoverageAnalyzer();
    const thresholds = this.configManager.getThresholds('testing');
    
    const testingReport = await analyzer.analyzeUnitTestCoverage();
    
    const coveragePassed = testingReport.coverageData.statements.percentage >= thresholds.coverage;
    
    return {
      phase: 'TESTING',
      timestamp: new Date(),
      score: testingReport.score,
      status: coveragePassed ? 'passed' : 'failed',
      summary: `Test coverage: ${testingReport.coverageData.statements.percentage.toFixed(1)}%`,
      details: testingReport,
      recommendations: testingReport.recommendations || []
    };
  }

  /**
   * Execute performance audit
   */
  private async executePerformanceAudit(): Promise<AuditReport> {
    const profiler = new PerformanceProfiler();
    const thresholds = this.configManager.getThresholds('performance');
    
    const bundleAnalysis = await profiler.analyzeBundleSize();
    const loadTimeProfile = await profiler.profilePageLoadTimes();
    
    const bundlePassed = bundleAnalysis.totalSize <= thresholds.bundleSize * 1024 * 1024;
    const loadTimePassed = loadTimeProfile.averageLoadTime <= thresholds.loadTime;
    
    const overallScore = (bundleAnalysis.score + loadTimeProfile.score) / 2;
    
    return {
      phase: 'PERFORMANCE',
      timestamp: new Date(),
      score: Math.round(overallScore),
      status: bundlePassed && loadTimePassed ? 'passed' : 'failed',
      summary: `Bundle: ${(bundleAnalysis.totalSize / 1024 / 1024).toFixed(1)}MB, Load time: ${loadTimeProfile.averageLoadTime}ms`,
      details: { bundleAnalysis, loadTimeProfile },
      recommendations: [...bundleAnalysis.recommendations, ...loadTimeProfile.recommendations]
    };
  }

  /**
   * Execute accessibility audit
   */
  private async executeAccessibilityAudit(): Promise<AuditReport> {
    const validator = new AccessibilityValidator();
    const thresholds = this.configManager.getThresholds('accessibility');
    
    const accessibilityReport = await validator.validateAccessibility();
    
    return {
      phase: 'ACCESSIBILITY',
      timestamp: new Date(),
      score: accessibilityReport.score,
      status: accessibilityReport.score >= 80 ? 'passed' : 'failed',
      summary: `Accessibility compliance: ${accessibilityReport.complianceLevel}`,
      details: accessibilityReport,
      recommendations: accessibilityReport.recommendations || []
    };
  }

  /**
   * Execute documentation audit
   */
  private async executeDocumentationAudit(): Promise<AuditReport> {
    const auditor = new DocumentationAuditor();
    const thresholds = this.configManager.getThresholds('documentation');
    
    const documentationReport = await auditor.auditDocumentation();
    
    return {
      phase: 'DOCUMENTATION',
      timestamp: new Date(),
      score: documentationReport.score,
      status: documentationReport.score >= thresholds.architectureScore ? 'passed' : 'failed',
      summary: `Documentation coverage: ${documentationReport.score}%`,
      details: documentationReport,
      recommendations: documentationReport.recommendations || []
    };
  }

  /**
   * Generate comprehensive audit report
   */
  private async generateComprehensiveReport(
    reports: Partial<Record<AuditPhase, AuditReport>>,
    errors: Array<{ phase: AuditPhase; error: Error }>,
    startTime: Date,
    endTime: Date
  ): Promise<ComprehensiveAuditReport> {
    const executedPhases = Object.keys(reports) as AuditPhase[];
    const totalScore = executedPhases.reduce((sum, phase) => sum + (reports[phase]?.score || 0), 0);
    const averageScore = executedPhases.length > 0 ? Math.round(totalScore / executedPhases.length) : 0;
    
    const passedPhases = executedPhases.filter(phase => reports[phase]?.status === 'passed');
    const failedPhases = executedPhases.filter(phase => reports[phase]?.status === 'failed');
    
    // Determine overall status
    let overallStatus: 'passed' | 'failed' | 'warning' = 'passed';
    if (failedPhases.length > 0 || errors.length > 0) {
      overallStatus = errors.length > 0 ? 'failed' : 'warning';
    }
    
    // Calculate production readiness
    let productionReadiness: 'NOT_READY' | 'NEEDS_WORK' | 'READY' | 'EXCELLENT' = 'NOT_READY';
    if (averageScore >= 90 && failedPhases.length === 0) productionReadiness = 'EXCELLENT';
    else if (averageScore >= 80 && failedPhases.length <= 1) productionReadiness = 'READY';
    else if (averageScore >= 70) productionReadiness = 'NEEDS_WORK';
    
    // Collect all recommendations
    const allRecommendations = executedPhases.flatMap(phase => reports[phase]?.recommendations || []);
    
    return {
      timestamp: new Date(),
      executionTime: endTime.getTime() - startTime.getTime(),
      overallScore: averageScore,
      overallStatus,
      productionReadiness,
      phasesExecuted: executedPhases,
      phasesPassed: passedPhases,
      phasesFailed: failedPhases,
      reports,
      errors: errors.map(e => ({
        phase: e.phase,
        message: e.error.message,
        stack: e.error.stack
      })),
      recommendations: allRecommendations,
      summary: {
        totalPhases: executedPhases.length,
        passedPhases: passedPhases.length,
        failedPhases: failedPhases.length,
        errorCount: errors.length,
        averageScore,
        executionTimeMs: endTime.getTime() - startTime.getTime()
      },
      config: this.config
    };
  }

  /**
   * Get current progress
   */
  getProgress(): AuditProgress[] {
    return Array.from(this.progress.values());
  }

  /**
   * Cancel running audit
   */
  async cancelAudit(): Promise<void> {
    // Update all running phases to failed
    for (const progress of this.progress.values()) {
      if (progress.status === 'running') {
        progress.status = 'failed';
        progress.message = 'Audit cancelled by user';
        progress.endTime = new Date();
      }
    }
  }
}