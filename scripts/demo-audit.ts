// Demo script to show audit functionality

import { AuditConfigManager } from '../src/audit/config/AuditConfigManager.js';
import { CodeQualityAnalyzer } from '../src/audit/analyzers/CodeQualityAnalyzer.js';
import { TestCoverageAnalyzer } from '../src/audit/analyzers/TestCoverageAnalyzer.js';
import { ReportGenerator } from '../src/audit/reporting/ReportGenerator.js';
import { ScoringEngine } from '../src/audit/scoring/ScoringEngine.js';

async function runDemoAudit() {
  console.log('🔍 LibertyX Audit System - Demo');
  console.log('=' .repeat(50));

  try {
    // 1. Test Configuration Manager
    console.log('\\n1️⃣  Testing Configuration Manager...');
    const configManager = new AuditConfigManager();
    const config = await configManager.loadConfig();
    console.log('✅ Configuration loaded successfully');
    console.log(`   Phases enabled: ${Object.entries(config.phases).filter(([, enabled]) => enabled).length}/6`);

    // 2. Test Code Quality Analyzer
    console.log('\\n2️⃣  Testing Code Quality Analyzer...');
    const codeAnalyzer = new CodeQualityAnalyzer();
    const codeQualityReport = await codeAnalyzer.analyzeCodeQuality();
    console.log('✅ Code quality analysis completed');
    console.log(`   Score: ${codeQualityReport.score}/100`);
    console.log(`   Issues found: ${codeQualityReport.issues?.length || 0}`);

    // 3. Test Coverage Analyzer
    console.log('\\n3️⃣  Testing Test Coverage Analyzer...');
    const testAnalyzer = new TestCoverageAnalyzer();
    const testReport = await testAnalyzer.analyzeUnitTestCoverage();
    console.log('✅ Test coverage analysis completed');
    console.log(`   Score: ${testReport.score}/100`);
    console.log(`   Coverage: ${testReport.coverageData.statements.percentage.toFixed(1)}%`);
    console.log(`   Test files: ${testReport.testFiles.length}`);

    // 4. Test Scoring Engine
    console.log('\\n4️⃣  Testing Scoring Engine...');
    const scoringEngine = new ScoringEngine();
    
    // Create mock comprehensive report
    const mockReport = {
      timestamp: new Date(),
      executionTime: 5000,
      overallScore: Math.round((codeQualityReport.score + testReport.score) / 2),
      overallStatus: 'passed' as const,
      productionReadiness: 'READY' as const,
      phasesExecuted: ['CODE_QUALITY', 'TESTING'] as const,
      phasesPassed: ['CODE_QUALITY', 'TESTING'] as const,
      phasesFailed: [] as const,
      reports: {
        CODE_QUALITY: {
          phase: 'CODE_QUALITY' as const,
          timestamp: new Date(),
          score: codeQualityReport.score,
          status: 'passed' as const,
          summary: 'Code quality analysis completed',
          details: codeQualityReport,
          recommendations: codeQualityReport.recommendations || []
        },
        TESTING: {
          phase: 'TESTING' as const,
          timestamp: new Date(),
          score: testReport.score,
          status: 'passed' as const,
          summary: 'Test coverage analysis completed',
          details: testReport,
          recommendations: testReport.recommendations || []
        }
      },
      errors: [],
      recommendations: [
        ...(codeQualityReport.recommendations || []),
        ...(testReport.recommendations || [])
      ],
      summary: {
        totalPhases: 2,
        passedPhases: 2,
        failedPhases: 0,
        errorCount: 0,
        averageScore: Math.round((codeQualityReport.score + testReport.score) / 2),
        executionTimeMs: 5000
      },
      config
    };

    const readinessAssessment = scoringEngine.assessProductionReadiness(mockReport);
    console.log('✅ Production readiness assessment completed');
    console.log(`   Level: ${readinessAssessment.level}`);
    console.log(`   Score: ${readinessAssessment.score}/100`);
    console.log(`   Confidence: ${readinessAssessment.confidence}%`);

    // 5. Test Report Generator
    console.log('\\n5️⃣  Testing Report Generator...');
    const reportGenerator = new ReportGenerator({
      outputPath: './demo-reports',
      format: 'both',
      includeDetails: true,
      includeCharts: true,
      theme: 'light'
    });

    const reportPaths = await reportGenerator.generateReport(mockReport);
    console.log('✅ Reports generated successfully');
    if (reportPaths.jsonPath) {
      console.log(`   JSON Report: ${reportPaths.jsonPath}`);
    }
    if (reportPaths.htmlPath) {
      console.log(`   HTML Report: ${reportPaths.htmlPath}`);
    }

    // 6. Display Summary
    console.log('\\n' + '=' .repeat(50));
    console.log('📊 DEMO AUDIT SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Overall Score: ${mockReport.overallScore}/100`);
    console.log(`Production Readiness: ${readinessAssessment.level}`);
    console.log(`Phases Analyzed: ${mockReport.phasesExecuted.length}`);
    console.log(`Total Recommendations: ${mockReport.recommendations.length}`);
    
    if (readinessAssessment.blockers.length > 0) {
      console.log('\\n🚫 Blockers:');
      readinessAssessment.blockers.forEach(blocker => {
        console.log(`   • ${blocker}`);
      });
    }
    
    if (readinessAssessment.strengths.length > 0) {
      console.log('\\n✅ Strengths:');
      readinessAssessment.strengths.slice(0, 3).forEach(strength => {
        console.log(`   • ${strength}`);
      });
    }

    console.log('\\n🎉 Demo audit completed successfully!');
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('\\n❌ Demo audit failed:');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.stack) {
      console.error('\\nStack trace:');
      console.error(error.stack);
    }
  }
}

// Run the demo
runDemoAudit().catch(console.error);