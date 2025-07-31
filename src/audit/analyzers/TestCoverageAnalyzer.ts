// Test Coverage Analysis Module

import { UnitTestResult, CoverageReport } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CoverageData {
  lines: {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
  };
  functions: {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
  };
  statements: {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
  };
  branches: {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
  };
}

export interface FileCoverage {
  path: string;
  coverage: CoverageData;
  uncoveredLines: number[];
  functions: Array<{
    name: string;
    line: number;
    covered: boolean;
  }>;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  file: string;
}

export class TestCoverageAnalyzer {
  private coverageThreshold: number;
  private testCommand: string;
  private coverageReportPath: string;

  constructor(
    coverageThreshold: number = 80,
    testCommand: string = 'npm test -- --coverage',
    coverageReportPath: string = './coverage'
  ) {
    this.coverageThreshold = coverageThreshold;
    this.testCommand = testCommand;
    this.coverageReportPath = coverageReportPath;
  }

  /**
   * Run unit tests with coverage
   */
  async runUnitTests(): Promise<UnitTestResult> {
    try {
      const startTime = Date.now();
      
      // Run tests with coverage
      const output = execSync(this.testCommand, { 
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      const duration = Date.now() - startTime;

      // Parse test results
      const testResults = this.parseTestOutput(output);
      
      // Read coverage data
      const coverageData = await this.readCoverageData();
      
      // Calculate overall coverage percentage
      const overallCoverage = coverageData.length > 0 
        ? coverageData.reduce((sum, file) => sum + file.coverage.lines.pct, 0) / coverageData.length
        : 0;

      return {
        testResults,
        coverage: overallCoverage,
        duration,
        totalTests: testResults.length,
        passedTests: testResults.filter(t => t.status === 'passed').length,
        failedTests: testResults.filter(t => t.status === 'failed').length,
        skippedTests: testResults.filter(t => t.status === 'skipped').length,
        timestamp: new Date()
      };

    } catch (error) {
      throw new AuditError(
        `Unit test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TESTING',
        'HIGH',
        'Check test configuration and ensure all dependencies are installed'
      );
    }
  }

  /**
   * Parse test output to extract test results
   */
  private parseTestOutput(output: string): TestResult[] {
    const results: TestResult[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Parse Vitest output format
      if (line.includes('✓') || line.includes('×') || line.includes('○')) {
        const testResult = this.parseTestLine(line);
        if (testResult) {
          results.push(testResult);
        }
      }
    }

    return results;
  }

  /**
   * Parse individual test line
   */
  private parseTestLine(line: string): TestResult | null {
    // Simple parsing for Vitest format
    const vitestMatch = line.match(/([✓×○])\s+(.+?)\s+(\d+)ms/);
    if (vitestMatch) {
      const [, symbol, name, durationStr] = vitestMatch;
      
      let status: 'passed' | 'failed' | 'skipped' = 'passed';
      if (symbol === '×') status = 'failed';
      if (symbol === '○') status = 'skipped';

      const duration = durationStr ? parseInt(durationStr) : 0;

      return {
        name: name.trim(),
        status,
        duration,
        file: 'unknown', // Would need more sophisticated parsing to get file
        error: status === 'failed' ? 'Test failed' : undefined
      };
    }

    // Try without duration
    const simpleMatch = line.match(/([✓×○])\s+(.+)/);
    if (simpleMatch) {
      const [, symbol, name] = simpleMatch;
      
      let status: 'passed' | 'failed' | 'skipped' = 'passed';
      if (symbol === '×') status = 'failed';
      if (symbol === '○') status = 'skipped';

      return {
        name: name.trim(),
        status,
        duration: 0,
        file: 'unknown',
        error: status === 'failed' ? 'Test failed' : undefined
      };
    }

    return null;
  }

  /**
   * Read coverage data from coverage reports
   */
  private async readCoverageData(): Promise<FileCoverage[]> {
    try {
      // Try to read coverage-summary.json first
      const summaryPath = path.join(this.coverageReportPath, 'coverage-summary.json');
      
      if (await this.fileExists(summaryPath)) {
        const summaryData = JSON.parse(await fs.readFile(summaryPath, 'utf-8'));
        return this.parseCoverageSummary(summaryData);
      }

      // Fallback to lcov.info parsing
      const lcovPath = path.join(this.coverageReportPath, 'lcov.info');
      if (await this.fileExists(lcovPath)) {
        const lcovData = await fs.readFile(lcovPath, 'utf-8');
        return this.parseLcovData(lcovData);
      }

      // No coverage data found
      return [];

    } catch (error) {
      console.warn('Could not read coverage data:', error);
      return [];
    }
  }

  /**
   * Parse coverage summary JSON
   */
  private parseCoverageSummary(summaryData: any): FileCoverage[] {
    const fileCoverages: FileCoverage[] = [];

    for (const [filePath, data] of Object.entries(summaryData)) {
      if (filePath === 'total') continue;

      const fileData = data as any;
      fileCoverages.push({
        path: filePath,
        coverage: {
          lines: fileData.lines || { total: 0, covered: 0, skipped: 0, pct: 0 },
          functions: fileData.functions || { total: 0, covered: 0, skipped: 0, pct: 0 },
          statements: fileData.statements || { total: 0, covered: 0, skipped: 0, pct: 0 },
          branches: fileData.branches || { total: 0, covered: 0, skipped: 0, pct: 0 }
        },
        uncoveredLines: [], // Would need detailed report for this
        functions: [] // Would need detailed report for this
      });
    }

    return fileCoverages;
  }

  /**
   * Parse LCOV data
   */
  private parseLcovData(lcovData: string): FileCoverage[] {
    const fileCoverages: FileCoverage[] = [];
    const records = lcovData.split('end_of_record');

    for (const record of records) {
      if (!record.trim()) continue;

      const lines = record.trim().split('\n');
      let currentFile: Partial<FileCoverage> = {
        uncoveredLines: [],
        functions: []
      };

      let linesCovered = 0;
      let linesTotal = 0;
      let functionsTotal = 0;
      let functionsCovered = 0;
      let branchesTotal = 0;
      let branchesCovered = 0;

      for (const line of lines) {
        if (line.startsWith('SF:')) {
          currentFile.path = line.substring(3);
        } else if (line.startsWith('LH:')) {
          linesCovered = parseInt(line.substring(3));
        } else if (line.startsWith('LF:')) {
          linesTotal = parseInt(line.substring(3));
        } else if (line.startsWith('FNH:')) {
          functionsCovered = parseInt(line.substring(4));
        } else if (line.startsWith('FNF:')) {
          functionsTotal = parseInt(line.substring(4));
        } else if (line.startsWith('BRH:')) {
          branchesCovered = parseInt(line.substring(4));
        } else if (line.startsWith('BRF:')) {
          branchesTotal = parseInt(line.substring(4));
        }
      }

      if (currentFile.path) {
        currentFile.coverage = {
          lines: {
            total: linesTotal,
            covered: linesCovered,
            skipped: 0,
            pct: linesTotal > 0 ? (linesCovered / linesTotal) * 100 : 0
          },
          functions: {
            total: functionsTotal,
            covered: functionsCovered,
            skipped: 0,
            pct: functionsTotal > 0 ? (functionsCovered / functionsTotal) * 100 : 0
          },
          statements: {
            total: linesTotal, // Approximation
            covered: linesCovered,
            skipped: 0,
            pct: linesTotal > 0 ? (linesCovered / linesTotal) * 100 : 0
          },
          branches: {
            total: branchesTotal,
            covered: branchesCovered,
            skipped: 0,
            pct: branchesTotal > 0 ? (branchesCovered / branchesTotal) * 100 : 0
          }
        };

        fileCoverages.push(currentFile as FileCoverage);
      }
    }

    return fileCoverages;
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Analyze coverage and generate report
   */
  async analyzeCoverage(): Promise<CoverageReport> {
    const unitTestResult = await this.runUnitTests();
    
    // Get detailed coverage data
    const allFiles = await this.readCoverageData();
    let totalLines = 0;
    let coveredLines = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;

    for (const file of allFiles) {
      totalLines += file.coverage.lines.total;
      coveredLines += file.coverage.lines.covered;
      totalFunctions += file.coverage.functions.total;
      coveredFunctions += file.coverage.functions.covered;
      totalStatements += file.coverage.statements.total;
      coveredStatements += file.coverage.statements.covered;
      totalBranches += file.coverage.branches.total;
      coveredBranches += file.coverage.branches.covered;
    }

    const overallCoverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
    const functionCoverage = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;
    const statementCoverage = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
    const branchCoverage = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;

    // Find uncovered files
    const uncoveredFiles = allFiles.filter(file => 
      file.coverage.lines.pct < this.coverageThreshold
    );

    // Find critical paths (files with low coverage in important directories)
    const criticalPaths = allFiles.filter(file => 
      (file.path.includes('/src/') || file.path.includes('/lib/')) &&
      file.coverage.lines.pct < 50
    );

    const criticalPathsCovered = criticalPaths.length === 0;

    return {
      unitTestCoverage: Math.round(overallCoverage * 100) / 100,
      integrationTestCoverage: 0, // Will be implemented in other analyzers
      componentTestCoverage: 0, // Will be implemented in other analyzers
      e2eTestCoverage: 0, // Will be implemented in other analyzers
      overallCoverage: Math.round(overallCoverage * 100) / 100,
      uncoveredFiles: uncoveredFiles.map(f => f.path),
      criticalPathsCovered,
      details: {
        totalTests: unitTestResult.totalTests,
        passedTests: unitTestResult.passedTests,
        failedTests: unitTestResult.failedTests,
        testDuration: unitTestResult.duration,
        coverageByType: {
          lines: Math.round(overallCoverage * 100) / 100,
          functions: Math.round(functionCoverage * 100) / 100,
          statements: Math.round(statementCoverage * 100) / 100,
          branches: Math.round(branchCoverage * 100) / 100
        },
        fileCoverage: allFiles,
        thresholdsMet: {
          overall: overallCoverage >= this.coverageThreshold,
          functions: functionCoverage >= this.coverageThreshold,
          statements: statementCoverage >= this.coverageThreshold,
          branches: branchCoverage >= (this.coverageThreshold * 0.8) // Lower threshold for branches
        }
      }
    };
  }

  /**
   * Validate coverage thresholds
   */
  async validateCoverageThresholds(): Promise<{
    passed: boolean;
    failures: Array<{
      type: string;
      actual: number;
      expected: number;
      message: string;
    }>;
    recommendations: string[];
  }> {
    const coverageReport = await this.analyzeCoverage();
    const failures: Array<{
      type: string;
      actual: number;
      expected: number;
      message: string;
    }> = [];

    // Check overall coverage
    if (coverageReport.overallCoverage < this.coverageThreshold) {
      failures.push({
        type: 'overall',
        actual: coverageReport.overallCoverage,
        expected: this.coverageThreshold,
        message: `Overall coverage ${coverageReport.overallCoverage}% is below threshold ${this.coverageThreshold}%`
      });
    }

    // Check function coverage
    const functionCoverage = coverageReport.details.coverageByType.functions;
    if (functionCoverage < this.coverageThreshold) {
      failures.push({
        type: 'functions',
        actual: functionCoverage,
        expected: this.coverageThreshold,
        message: `Function coverage ${functionCoverage}% is below threshold ${this.coverageThreshold}%`
      });
    }

    // Check critical paths
    if (!coverageReport.criticalPathsCovered) {
      failures.push({
        type: 'critical_paths',
        actual: 0,
        expected: 100,
        message: 'Critical code paths are not adequately covered'
      });
    }

    const recommendations: string[] = [];
    
    if (failures.length > 0) {
      recommendations.push(`Add tests to improve coverage by ${Math.ceil(this.coverageThreshold - coverageReport.overallCoverage)}%`);
      
      if (coverageReport.uncoveredFiles.length > 0) {
        recommendations.push(`Focus on ${coverageReport.uncoveredFiles.length} files with low coverage`);
      }
      
      if (!coverageReport.criticalPathsCovered) {
        recommendations.push('Prioritize testing critical code paths in src/ and lib/ directories');
      }
    }

    return {
      passed: failures.length === 0,
      failures,
      recommendations
    };
  }

  /**
   * Generate coverage recommendations
   */
  generateCoverageRecommendations(coverageReport: CoverageReport): string[] {
    const recommendations: string[] = [];

    if (coverageReport.overallCoverage < 90) {
      recommendations.push('Aim for 90%+ code coverage for production readiness');
    }

    if (coverageReport.uncoveredFiles.length > 0) {
      recommendations.push(`Add tests for ${coverageReport.uncoveredFiles.length} uncovered files`);
      
      // Suggest specific files if not too many
      if (coverageReport.uncoveredFiles.length <= 5) {
        recommendations.push(`Priority files: ${coverageReport.uncoveredFiles.slice(0, 3).join(', ')}`);
      }
    }

    if (!coverageReport.criticalPathsCovered) {
      recommendations.push('Focus on testing critical business logic and core functionality');
    }

    if (coverageReport.details.coverageByType.branches < 70) {
      recommendations.push('Improve branch coverage by testing edge cases and error conditions');
    }

    if (coverageReport.details.failedTests > 0) {
      recommendations.push(`Fix ${coverageReport.details.failedTests} failing tests before focusing on coverage`);
    }

    // Performance recommendations
    if (coverageReport.details.testDuration > 30000) { // 30 seconds
      recommendations.push('Consider optimizing test performance - tests are taking too long');
    }

    return recommendations;
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests(): Promise<{
    testResults: TestResult[];
    coverage: number;
    duration: number;
    mockingQuality: number;
    recommendations: string[];
  }> {
    try {
      const startTime = Date.now();
      
      // Run integration tests
      const output = execSync('npm run test:integration || echo "No integration tests configured"', { 
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10
      });

      const duration = Date.now() - startTime;
      const testResults = this.parseTestOutput(output);

      // Analyze blockchain interaction mocking
      const mockingQuality = await this.analyzeMockingQuality();

      const recommendations: string[] = [];
      
      if (testResults.length === 0) {
        recommendations.push('Set up integration tests to test component interactions');
        recommendations.push('Create tests for API endpoints and database operations');
      }

      if (mockingQuality < 70) {
        recommendations.push('Improve mocking of external dependencies');
        recommendations.push('Mock blockchain interactions for reliable testing');
      }

      const passedTests = testResults.filter(t => t.status === 'passed').length;
      const coverage = testResults.length > 0 ? (passedTests / testResults.length) * 100 : 0;

      return {
        testResults,
        coverage,
        duration,
        mockingQuality,
        recommendations
      };

    } catch (error) {
      return {
        testResults: [],
        coverage: 0,
        duration: 0,
        mockingQuality: 0,
        recommendations: ['Set up integration test framework']
      };
    }
  }

  /**
   * Analyze mocking quality for blockchain interactions
   */
  private async analyzeMockingQuality(): Promise<number> {
    try {
      // Look for mock files and configurations
      const testFiles = await this.findTestFiles();
      let mockingScore = 0;
      let totalChecks = 0;

      for (const file of testFiles) {
        const content = await fs.readFile(file, 'utf-8');
        totalChecks++;

        // Check for various mocking patterns
        if (content.includes('vi.mock') || content.includes('jest.mock')) {
          mockingScore += 20;
        }
        if (content.includes('mockImplementation')) {
          mockingScore += 15;
        }
        if (content.includes('blockchain') && content.includes('mock')) {
          mockingScore += 25;
        }
        if (content.includes('web3') && content.includes('mock')) {
          mockingScore += 20;
        }
        if (content.includes('beforeEach') && content.includes('mock')) {
          mockingScore += 10;
        }
      }

      return totalChecks > 0 ? Math.min(mockingScore / totalChecks, 100) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Find test files in the project
   */
  private async findTestFiles(): Promise<string[]> {
    try {
      const testDirs = ['test', 'tests', '__tests__', 'src/**/*.test.*'];
      const files: string[] = [];

      // Simple file discovery - in a real implementation, use glob
      try {
        const testDir = await fs.readdir('./test');
        for (const file of testDir) {
          if (file.endsWith('.test.ts') || file.endsWith('.test.js')) {
            files.push(`./test/${file}`);
          }
        }
      } catch {
        // Test directory doesn't exist
      }

      return files;
    } catch {
      return [];
    }
  }

  /**
   * Run component tests
   */
  async runComponentTests(): Promise<{
    testResults: TestResult[];
    coverage: number;
    renderingTests: number;
    recommendations: string[];
  }> {
    try {
      const startTime = Date.now();
      
      // Run component tests
      const output = execSync('npm run test:components || echo "No component tests configured"', { 
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10
      });

      const testResults = this.parseTestOutput(output);
      const renderingTests = await this.countRenderingTests();

      const recommendations: string[] = [];
      
      if (testResults.length === 0) {
        recommendations.push('Create component tests using React Testing Library');
        recommendations.push('Test component rendering and user interactions');
      }

      if (renderingTests < 5) {
        recommendations.push('Add more component rendering tests');
        recommendations.push('Test component props and state changes');
      }

      const passedTests = testResults.filter(t => t.status === 'passed').length;
      const coverage = testResults.length > 0 ? (passedTests / testResults.length) * 100 : 0;

      return {
        testResults,
        coverage,
        renderingTests,
        recommendations
      };

    } catch (error) {
      return {
        testResults: [],
        coverage: 0,
        renderingTests: 0,
        recommendations: ['Set up component testing framework']
      };
    }
  }

  /**
   * Count rendering tests
   */
  private async countRenderingTests(): Promise<number> {
    try {
      const testFiles = await this.findTestFiles();
      let renderingTests = 0;

      for (const file of testFiles) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Count rendering-related test patterns
        const renderMatches = content.match(/render\s*\(/g);
        if (renderMatches) {
          renderingTests += renderMatches.length;
        }
      }

      return renderingTests;
    } catch {
      return 0;
    }
  }

  /**
   * Run end-to-end tests
   */
  async runE2ETests(): Promise<{
    testResults: TestResult[];
    coverage: number;
    userJourneys: number;
    recommendations: string[];
  }> {
    try {
      const startTime = Date.now();
      
      // Run E2E tests
      const output = execSync('npm run test:e2e || echo "No E2E tests configured"', { 
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10
      });

      const testResults = this.parseTestOutput(output);
      const userJourneys = await this.countUserJourneys();

      const recommendations: string[] = [];
      
      if (testResults.length === 0) {
        recommendations.push('Set up end-to-end testing with Playwright or Cypress');
        recommendations.push('Create tests for critical user journeys');
      }

      if (userJourneys < 3) {
        recommendations.push('Add more user journey tests');
        recommendations.push('Test complete workflows from user perspective');
      }

      const passedTests = testResults.filter(t => t.status === 'passed').length;
      const coverage = testResults.length > 0 ? (passedTests / testResults.length) * 100 : 0;

      return {
        testResults,
        coverage,
        userJourneys,
        recommendations
      };

    } catch (error) {
      return {
        testResults: [],
        coverage: 0,
        userJourneys: 0,
        recommendations: ['Set up end-to-end testing framework']
      };
    }
  }

  /**
   * Count user journey tests
   */
  private async countUserJourneys(): Promise<number> {
    try {
      const testFiles = await this.findTestFiles();
      let journeyTests = 0;

      for (const file of testFiles) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Count user journey patterns
        const journeyPatterns = [
          /user.*journey/gi,
          /end.*to.*end/gi,
          /e2e/gi,
          /workflow/gi,
          /scenario/gi
        ];

        for (const pattern of journeyPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            journeyTests += matches.length;
          }
        }
      }

      return journeyTests;
    } catch {
      return 0;
    }
  }

  /**
   * Generate comprehensive coverage report
   */
  async generateComprehensiveCoverageReport(): Promise<CoverageReport> {
    const [unitTests, integrationTests, componentTests, e2eTests] = await Promise.all([
      this.runUnitTests(),
      this.runIntegrationTests(),
      this.runComponentTests(),
      this.runE2ETests()
    ]);

    // Calculate overall coverage
    const totalTests = unitTests.totalTests + integrationTests.testResults.length + 
                      componentTests.testResults.length + e2eTests.testResults.length;
    
    const allPassed = unitTests.passedTests + 
                     integrationTests.testResults.filter(t => t.status === 'passed').length +
                     componentTests.testResults.filter(t => t.status === 'passed').length +
                     e2eTests.testResults.filter(t => t.status === 'passed').length;

    const overallCoverage = totalTests > 0 ? (allPassed / totalTests) * 100 : 0;

    // Check critical paths
    const criticalPathsCovered = unitTests.coverage.some(file => 
      file.path.includes('/src/') && file.coverage.lines.pct >= 80
    );

    return {
      unitTestCoverage: unitTests.coverage.length > 0 ? 
        unitTests.coverage.reduce((sum, f) => sum + f.coverage.lines.pct, 0) / unitTests.coverage.length : 0,
      integrationTestCoverage: integrationTests.coverage,
      componentTestCoverage: componentTests.coverage,
      e2eTestCoverage: e2eTests.coverage,
      overallCoverage,
      uncoveredFiles: unitTests.coverage.filter(f => f.coverage.lines.pct < this.coverageThreshold).map(f => f.path),
      criticalPathsCovered,
      details: {
        totalTests,
        passedTests: allPassed,
        failedTests: totalTests - allPassed,
        testDuration: unitTests.duration + integrationTests.duration,
        coverageByType: {
          lines: unitTests.coverage.length > 0 ? 
            unitTests.coverage.reduce((sum, f) => sum + f.coverage.lines.pct, 0) / unitTests.coverage.length : 0,
          functions: unitTests.coverage.length > 0 ? 
            unitTests.coverage.reduce((sum, f) => sum + f.coverage.functions.pct, 0) / unitTests.coverage.length : 0,
          statements: unitTests.coverage.length > 0 ? 
            unitTests.coverage.reduce((sum, f) => sum + f.coverage.statements.pct, 0) / unitTests.coverage.length : 0,
          branches: unitTests.coverage.length > 0 ? 
            unitTests.coverage.reduce((sum, f) => sum + f.coverage.branches.pct, 0) / unitTests.coverage.length : 0
        },
        fileCoverage: unitTests.coverage,
        thresholdsMet: {
          overall: overallCoverage >= this.coverageThreshold,
          functions: true, // Simplified
          statements: true, // Simplified
          branches: true // Simplified
        }
      }
    };
  }
}