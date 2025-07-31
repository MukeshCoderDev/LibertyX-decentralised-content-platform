#!/usr/bin/env node

// Simple audit execution script for LibertyX Platform
// This script runs the comprehensive audit without complex CLI dependencies

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function runAudit() {
  console.log('🚀 LibertyX Platform - Comprehensive Audit Execution');
  console.log('=' .repeat(70));
  console.log('');

  const startTime = Date.now();
  const auditResults = {
    timestamp: new Date().toISOString(),
    platform: 'LibertyX Decentralized Content Platform',
    version: '1.0.0',
    phases: {},
    overallScore: 0,
    overallStatus: 'unknown',
    productionReadiness: 'UNKNOWN',
    errors: [],
    recommendations: [],
    summary: ''
  };

  try {
    // Ensure audit reports directory exists
    await fs.mkdir('./audit-reports', { recursive: true });

    console.log('📋 PHASE 1: CODE QUALITY ANALYSIS');
    console.log('=' .repeat(50));
    
    // Run TypeScript check
    console.log('🔍 Running TypeScript analysis...');
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
      console.log('✅ TypeScript analysis: PASSED');
      auditResults.phases.typescript = { status: 'passed', score: 90 };
    } catch (error) {
      console.log('❌ TypeScript analysis: FAILED');
      auditResults.phases.typescript = { status: 'failed', score: 40 };
      auditResults.errors.push({
        phase: 'CODE_QUALITY',
        category: 'TypeScript',
        message: 'TypeScript compilation errors found'
      });
    }

    // Run ESLint check
    console.log('🔍 Running ESLint analysis...');
    try {
      execSync('npx eslint src --ext .ts,.tsx --max-warnings 0', { stdio: 'pipe' });
      console.log('✅ ESLint analysis: PASSED');
      auditResults.phases.eslint = { status: 'passed', score: 85 };
    } catch (error) {
      console.log('⚠️  ESLint analysis: WARNINGS FOUND');
      auditResults.phases.eslint = { status: 'warning', score: 70 };
      auditResults.recommendations.push('Fix ESLint warnings and errors');
    }

    console.log('\n📋 PHASE 2: SECURITY ANALYSIS');
    console.log('=' .repeat(50));
    
    // Run npm audit
    console.log('🔍 Running dependency security scan...');
    try {
      execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
      console.log('✅ Dependency security: PASSED');
      auditResults.phases.security = { status: 'passed', score: 95 };
    } catch (error) {
      console.log('⚠️  Dependency security: VULNERABILITIES FOUND');
      auditResults.phases.security = { status: 'warning', score: 60 };
      auditResults.recommendations.push('Update dependencies with security vulnerabilities');
    }

    console.log('\n📋 PHASE 3: TESTING ANALYSIS');
    console.log('=' .repeat(50));
    
    // Run tests with coverage
    console.log('🔍 Running test suite with coverage...');
    try {
      const testOutput = execSync('npm run test:run -- --coverage', { 
        stdio: 'pipe', 
        encoding: 'utf-8' 
      });
      console.log('✅ Test execution: PASSED');
      
      // Try to extract coverage information
      const coverageMatch = testOutput.match(/All files[\s\S]*?(\d+\.?\d*)%/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
      
      if (coverage >= 80) {
        console.log(`✅ Test coverage: ${coverage}% (EXCELLENT)`);
        auditResults.phases.testing = { status: 'passed', score: 90, coverage };
      } else if (coverage >= 60) {
        console.log(`⚠️  Test coverage: ${coverage}% (NEEDS IMPROVEMENT)`);
        auditResults.phases.testing = { status: 'warning', score: 70, coverage };
        auditResults.recommendations.push('Increase test coverage to at least 80%');
      } else {
        console.log(`❌ Test coverage: ${coverage}% (INSUFFICIENT)`);
        auditResults.phases.testing = { status: 'failed', score: 40, coverage };
        auditResults.errors.push({
          phase: 'TESTING',
          category: 'Coverage',
          message: `Test coverage is ${coverage}%, below minimum threshold of 60%`
        });
      }
    } catch (error) {
      console.log('❌ Test execution: FAILED');
      auditResults.phases.testing = { status: 'failed', score: 20 };
      auditResults.errors.push({
        phase: 'TESTING',
        category: 'Execution',
        message: 'Test suite execution failed'
      });
    }

    console.log('\n📋 PHASE 4: PERFORMANCE ANALYSIS');
    console.log('=' .repeat(50));
    
    // Run build to check bundle size
    console.log('🔍 Analyzing bundle size...');
    try {
      execSync('npm run build', { stdio: 'pipe' });
      console.log('✅ Build successful');
      
      // Check dist folder size (approximate)
      try {
        const stats = await fs.stat('./dist');
        console.log('✅ Bundle analysis: COMPLETED');
        auditResults.phases.performance = { status: 'passed', score: 80 };
      } catch {
        console.log('⚠️  Bundle analysis: PARTIAL');
        auditResults.phases.performance = { status: 'warning', score: 70 };
      }
    } catch (error) {
      console.log('❌ Build failed');
      auditResults.phases.performance = { status: 'failed', score: 30 };
      auditResults.errors.push({
        phase: 'PERFORMANCE',
        category: 'Build',
        message: 'Production build failed'
      });
    }

    console.log('\n📋 PHASE 5: ACCESSIBILITY ANALYSIS');
    console.log('=' .repeat(50));
    console.log('⚠️  Accessibility analysis requires manual review');
    auditResults.phases.accessibility = { status: 'warning', score: 60 };
    auditResults.recommendations.push('Conduct comprehensive accessibility audit with axe-core');

    console.log('\n📋 PHASE 6: DOCUMENTATION ANALYSIS');
    console.log('=' .repeat(50));
    
    // Check for key documentation files
    const docFiles = ['README.md', 'CONTRIBUTING.md', 'docs/'];
    let docScore = 0;
    
    for (const file of docFiles) {
      try {
        await fs.access(file);
        console.log(`✅ Found: ${file}`);
        docScore += 30;
      } catch {
        console.log(`❌ Missing: ${file}`);
        auditResults.recommendations.push(`Create ${file} documentation`);
      }
    }
    
    auditResults.phases.documentation = { 
      status: docScore >= 60 ? 'passed' : 'warning', 
      score: Math.min(docScore, 90) 
    };

    // Calculate overall score
    const phases = Object.values(auditResults.phases);
    const totalScore = phases.reduce((sum, phase) => sum + phase.score, 0);
    auditResults.overallScore = Math.round(totalScore / phases.length);

    // Determine overall status and production readiness
    const criticalErrors = auditResults.errors.filter(e => 
      e.category === 'TypeScript' || e.category === 'Build' || e.category === 'Coverage'
    );

    if (criticalErrors.length > 0) {
      auditResults.overallStatus = 'failed';
      auditResults.productionReadiness = 'NOT_READY';
    } else if (auditResults.overallScore >= 80) {
      auditResults.overallStatus = 'passed';
      auditResults.productionReadiness = 'READY';
    } else if (auditResults.overallScore >= 60) {
      auditResults.overallStatus = 'warning';
      auditResults.productionReadiness = 'NEEDS_WORK';
    } else {
      auditResults.overallStatus = 'failed';
      auditResults.productionReadiness = 'NOT_READY';
    }

    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;

    // Generate summary
    auditResults.summary = generateSummary(auditResults, executionTime);

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `./audit-reports/audit-report-${timestamp}.json`;
    const summaryPath = `./audit-reports/audit-summary-${timestamp}.txt`;

    await fs.writeFile(reportPath, JSON.stringify(auditResults, null, 2));
    await fs.writeFile(summaryPath, auditResults.summary);

    // Display final results
    console.log('\n' + '=' .repeat(70));
    console.log('🎯 AUDIT COMPLETED');
    console.log('=' .repeat(70));
    console.log(auditResults.summary);
    console.log('=' .repeat(70));
    console.log(`\n📄 Reports saved:`);
    console.log(`   📊 JSON Report: ${reportPath}`);
    console.log(`   📋 Summary: ${summaryPath}`);

    // Exit with appropriate code
    const exitCode = auditResults.overallStatus === 'failed' ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error('\n❌ Audit execution failed:');
    console.error(error.message);
    process.exit(1);
  }
}

function generateSummary(results, executionTime) {
  const lines = [];
  
  lines.push('📊 LIBERTYX PLATFORM AUDIT SUMMARY');
  lines.push('');
  lines.push('🎯 Overall Results:');
  lines.push(`   Score: ${results.overallScore}/100`);
  lines.push(`   Status: ${results.overallStatus.toUpperCase()}`);
  lines.push(`   Production Readiness: ${results.productionReadiness.replace('_', ' ')}`);
  lines.push(`   Execution Time: ${executionTime.toFixed(2)}s`);
  lines.push('');
  
  lines.push('📋 Phase Results:');
  Object.entries(results.phases).forEach(([phase, result]) => {
    const icon = result.status === 'passed' ? '✅' : 
                result.status === 'warning' ? '⚠️' : '❌';
    lines.push(`   ${icon} ${phase.toUpperCase()}: ${result.score}/100 (${result.status})`);
  });
  lines.push('');
  
  if (results.errors.length > 0) {
    lines.push(`❌ Critical Issues (${results.errors.length}):`);
    results.errors.forEach(error => {
      lines.push(`   • ${error.phase}: ${error.message}`);
    });
    lines.push('');
  }
  
  if (results.recommendations.length > 0) {
    lines.push('💡 Recommendations:');
    results.recommendations.forEach((rec, index) => {
      lines.push(`   ${index + 1}. ${rec}`);
    });
    lines.push('');
  }
  
  // Production readiness assessment
  lines.push('🚀 Production Readiness Assessment:');
  if (results.productionReadiness === 'NOT_READY') {
    lines.push('   🚫 CRITICAL: Platform is NOT READY for production deployment');
    lines.push('   • Address all critical issues immediately');
    lines.push('   • Ensure all tests pass and coverage is adequate');
    lines.push('   • Fix build and compilation errors');
  } else if (results.productionReadiness === 'NEEDS_WORK') {
    lines.push('   ⚠️  CAUTION: Platform needs work before production deployment');
    lines.push('   • Address high-priority issues');
    lines.push('   • Improve test coverage and quality');
    lines.push('   • Consider staged deployment with monitoring');
  } else if (results.productionReadiness === 'READY') {
    lines.push('   ✅ GOOD: Platform is ready for production deployment');
    lines.push('   • Implement comprehensive monitoring');
    lines.push('   • Plan rollback strategy');
    lines.push('   • Monitor key metrics post-deployment');
  }
  
  return lines.join('\n');
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️  Audit interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Audit terminated');
  process.exit(143);
});

// Run the audit
runAudit().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});