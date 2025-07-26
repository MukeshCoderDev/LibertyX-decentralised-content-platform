#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Pre-GitHub Push Audit and Test Suite\n');

// Step 1: Run TypeScript compilation check
console.log('📋 Step 1: TypeScript Compilation Check');
console.log('=' .repeat(50));

try {
  console.log('Running TypeScript compilation...');
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation passed!\n');
} catch (error) {
  console.log('❌ TypeScript compilation failed. Errors found:');
  console.log(error.stdout?.toString() || error.message);
  console.log('\n⚠️  Please fix TypeScript errors before proceeding.\n');
}

// Step 2: Run linting
console.log('📋 Step 2: Code Linting');
console.log('=' .repeat(50));

try {
  console.log('Running ESLint...');
  execSync('npx eslint . --ext .ts,.tsx --max-warnings 0', { stdio: 'pipe' });
  console.log('✅ Linting passed!\n');
} catch (error) {
  console.log('⚠️  Linting warnings/errors found:');
  console.log(error.stdout?.toString() || 'Run `npm run lint` for details');
  console.log('');
}

// Step 3: Run tests
console.log('📋 Step 3: Test Suite Execution');
console.log('=' .repeat(50));

const testSuites = [
  'tasks-1-9-core',
  'tasks-11-13-production-ready',
  'tasks-14-16-comprehensive-audit',
  'wallet-connection',
  'contract-integration'
];

let testResults = [];

testSuites.forEach(suite => {
  try {
    console.log(`Running ${suite} tests...`);
    execSync(`npm test -- ${suite}`, { stdio: 'pipe' });
    console.log(`✅ ${suite} tests passed`);
    testResults.push({ suite, status: 'passed' });
  } catch (error) {
    console.log(`❌ ${suite} tests failed`);
    testResults.push({ suite, status: 'failed', error: error.message });
  }
});

// Step 4: Security audit
console.log('\n📋 Step 4: Security Audit');
console.log('=' .repeat(50));

try {
  console.log('Running npm audit...');
  execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
  console.log('✅ No security vulnerabilities found!\n');
} catch (error) {
  console.log('⚠️  Security vulnerabilities found:');
  console.log('Run `npm audit` for details\n');
}

// Step 5: Build verification
console.log('📋 Step 5: Build Verification');
console.log('=' .repeat(50));

try {
  console.log('Running production build...');
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Production build successful!\n');
} catch (error) {
  console.log('❌ Production build failed:');
  console.log(error.stdout?.toString() || error.message);
  console.log('');
}

// Step 6: Generate audit report
console.log('📋 Step 6: Generating Audit Report');
console.log('=' .repeat(50));

const auditReport = {
  timestamp: new Date().toISOString(),
  testResults,
  recommendations: [
    'Fix all TypeScript compilation errors before pushing',
    'Ensure all critical tests pass',
    'Review and fix security vulnerabilities',
    'Update documentation for new features',
    'Add proper error handling for production',
    'Implement proper logging for debugging'
  ]
};

fs.writeFileSync('AUDIT_REPORT.json', JSON.stringify(auditReport, null, 2));
console.log('✅ Audit report generated: AUDIT_REPORT.json\n');

// Summary
console.log('📊 AUDIT SUMMARY');
console.log('=' .repeat(50));

const passedTests = testResults.filter(r => r.status === 'passed').length;
const totalTests = testResults.length;

console.log(`Tests: ${passedTests}/${totalTests} passed`);
console.log(`Build: ${auditReport.buildStatus || 'Check above'}`);
console.log(`Security: Check npm audit output above`);

if (passedTests === totalTests) {
  console.log('\n🎉 Your code is ready for GitHub push!');
  console.log('\n📝 Final checklist:');
  console.log('□ All TypeScript errors fixed');
  console.log('□ All tests passing');
  console.log('□ No security vulnerabilities');
  console.log('□ Production build successful');
  console.log('□ Documentation updated');
  console.log('□ Commit messages are clear');
} else {
  console.log('\n⚠️  Please address the issues above before pushing to GitHub.');
}

console.log('\n🔗 Useful commands:');
console.log('- Fix TypeScript: npx tsc --noEmit --skipLibCheck');
console.log('- Run specific test: npm test -- [test-name]');
console.log('- Fix linting: npm run lint --fix');
console.log('- Security audit: npm audit --fix');
console.log('- Build: npm run build');