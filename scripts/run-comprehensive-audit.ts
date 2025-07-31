#!/usr/bin/env tsx

// Script to run comprehensive audit on LibertyX platform

import { ComprehensiveAuditRunner } from '../src/audit/runner/ComprehensiveAuditRunner.js';
import * as path from 'path';

async function main() {
  console.log('🚀 LibertyX Platform - Comprehensive Audit Execution');
  console.log('=' .repeat(70));
  console.log('');

  try {
    // Create audit runner
    const runner = new ComprehensiveAuditRunner({
      configPath: './audit.config.json',
      outputPath: './audit-reports',
      generateDashboard: true,
      verbose: true,
      saveResults: true
    });

    // Run comprehensive audit
    const results = await runner.runComprehensiveAudit();

    // Analyze specific concerns
    console.log('\\n🔍 Analyzing specific platform concerns...');
    const concerns = await runner.analyzeSpecificConcerns();

    console.log('\\n📋 PLATFORM-SPECIFIC ANALYSIS:');
    console.log('\\n🔒 Security Concerns:');
    concerns.securityConcerns.forEach((concern, index) => {
      console.log(`   ${index + 1}. ${concern}`);
    });

    console.log('\\n⚡ Performance Concerns:');
    concerns.performanceConcerns.forEach((concern, index) => {
      console.log(`   ${index + 1}. ${concern}`);
    });

    console.log('\\n🔧 Quality Concerns:');
    concerns.qualityConcerns.forEach((concern, index) => {
      console.log(`   ${index + 1}. ${concern}`);
    });

    console.log('\\n🧪 Testing Concerns:');
    concerns.testingConcerns.forEach((concern, index) => {
      console.log(`   ${index + 1}. ${concern}`);
    });

    // Generate improvement roadmap
    console.log('\\n🗺️  IMPROVEMENT ROADMAP:');
    const roadmap = runner.generateImprovementRoadmap(results.report);

    console.log('\\n🚨 Immediate Actions (Next 1-2 weeks):');
    roadmap.immediate.forEach((action, index) => {
      console.log(`   ${index + 1}. ${action}`);
    });

    console.log('\\n📅 Short-term Goals (Next 1-2 months):');
    roadmap.shortTerm.forEach((goal, index) => {
      console.log(`   ${index + 1}. ${goal}`);
    });

    console.log('\\n🎯 Long-term Objectives (Next 3-6 months):');
    roadmap.longTerm.forEach((objective, index) => {
      console.log(`   ${index + 1}. ${objective}`);
    });

    // Final recommendations
    console.log('\\n' + '=' .repeat(70));
    console.log('🎯 FINAL RECOMMENDATIONS FOR LIBERTYX PLATFORM:');
    console.log('=' .repeat(70));

    if (results.report.productionReadiness === 'NOT_READY') {
      console.log('🚫 CRITICAL: Platform is NOT READY for production deployment');
      console.log('   • Address all critical security vulnerabilities immediately');
      console.log('   • Increase test coverage to minimum 70%');
      console.log('   • Implement comprehensive error handling');
      console.log('   • Conduct security audit with external experts');
    } else if (results.report.productionReadiness === 'NEEDS_WORK') {
      console.log('⚠️  CAUTION: Platform needs work before production deployment');
      console.log('   • Address high-priority security issues');
      console.log('   • Improve test coverage and quality');
      console.log('   • Optimize performance bottlenecks');
      console.log('   • Consider staged deployment with monitoring');
    } else if (results.report.productionReadiness === 'READY') {
      console.log('✅ GOOD: Platform is ready for production deployment');
      console.log('   • Implement comprehensive monitoring');
      console.log('   • Plan rollback strategy');
      console.log('   • Monitor key metrics post-deployment');
      console.log('   • Continue improving test coverage');
    } else {
      console.log('🌟 EXCELLENT: Platform is production-ready with high quality');
      console.log('   • Consider this as reference implementation');
      console.log('   • Document best practices for other projects');
      console.log('   • Implement automated deployment pipeline');
      console.log('   • Share learnings with development team');
    }

    console.log('\\n📄 Generated Files:');
    if (results.reportPaths.jsonPath) {
      console.log(`   📊 JSON Report: ${results.reportPaths.jsonPath}`);
    }
    if (results.reportPaths.htmlPath) {
      console.log(`   📋 HTML Report: ${results.reportPaths.htmlPath}`);
    }
    if (results.dashboardPath) {
      console.log(`   🎨 Interactive Dashboard: ${results.dashboardPath}`);
    }

    console.log('\\n🎉 Comprehensive audit completed successfully!');
    console.log('=' .repeat(70));

    // Exit with appropriate code
    const exitCode = results.report.overallStatus === 'failed' ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error('\\n❌ Audit execution failed:');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.stack) {
      console.error('\\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\\n⚠️  Audit interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\\n⚠️  Audit terminated');
  process.exit(143);
});

// Run the audit
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});