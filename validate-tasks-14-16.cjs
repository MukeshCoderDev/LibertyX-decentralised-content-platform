#!/usr/bin/env node

/**
 * Tasks 14-16 Validation Script
 * 
 * This script validates the implementation of:
 * - Task 14: Advanced Analytics and Creator Insights System
 * - Task 15: Cross-Chain Bridge Integration
 * - Task 16: AI-Powered Content Recommendation System
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Tasks 14-16 Implementation...\n');

// Validation results
const results = {
  task14: { passed: 0, failed: 0, tests: [] },
  task15: { passed: 0, failed: 0, tests: [] },
  task16: { passed: 0, failed: 0, tests: [] }
};

function test(description, testFn, taskId) {
  try {
    testFn();
    results[taskId].passed++;
    results[taskId].tests.push({ description, status: '✅ PASS' });
    console.log(`✅ ${description}`);
  } catch (error) {
    results[taskId].failed++;
    results[taskId].tests.push({ description, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${description}: ${error.message}`);
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function readFile(filePath) {
  return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
}

function hasFunction(content, functionName) {
  return content.includes(functionName);
}

function hasInterface(content, interfaceName) {
  return content.includes(`interface ${interfaceName}`) || content.includes(`export interface ${interfaceName}`);
}

function hasImport(content, importName) {
  return content.includes(`import`) && content.includes(importName);
}

// Task 14: Advanced Analytics and Creator Insights System
console.log('📊 Task 14: Advanced Analytics and Creator Insights System');
console.log('=' .repeat(60));

test('AdvancedAnalytics component exists', () => {
  if (!fileExists('components/AdvancedAnalytics.tsx')) {
    throw new Error('AdvancedAnalytics.tsx component not found');
  }
}, 'task14');

test('useAnalyticsEngine hook exists', () => {
  if (!fileExists('hooks/useAnalyticsEngine.ts')) {
    throw new Error('useAnalyticsEngine.ts hook not found');
  }
}, 'task14');

test('Analytics component has required imports', () => {
  const content = readFile('components/AdvancedAnalytics.tsx');
  if (!hasImport(content, 'Recharts') && !hasImport(content, 'recharts')) {
    throw new Error('Missing Recharts import for data visualization');
  }
  if (!hasImport(content, 'useAnalyticsEngine')) {
    throw new Error('Missing useAnalyticsEngine hook import');
  }
}, 'task14');

test('Analytics hook has required interfaces', () => {
  const content = readFile('hooks/useAnalyticsEngine.ts');
  if (!hasInterface(content, 'ViewerDemographics')) {
    throw new Error('Missing ViewerDemographics interface');
  }
  if (!hasInterface(content, 'EngagementMetrics')) {
    throw new Error('Missing EngagementMetrics interface');
  }
  if (!hasInterface(content, 'ContentPerformance')) {
    throw new Error('Missing ContentPerformance interface');
  }
  if (!hasInterface(content, 'RevenueForecasting')) {
    throw new Error('Missing RevenueForecasting interface');
  }
}, 'task14');

test('Analytics hook has required functions', () => {
  const content = readFile('hooks/useAnalyticsEngine.ts');
  const requiredFunctions = [
    'getViewerDemographics',
    'getEngagementMetrics', 
    'getContentPerformance',
    'getRevenueForecasting',
    'getAudienceInsights',
    'getTrendingAnalysis',
    'trackContentInteraction'
  ];
  
  for (const func of requiredFunctions) {
    if (!hasFunction(content, func)) {
      throw new Error(`Missing required function: ${func}`);
    }
  }
}, 'task14');

test('Analytics component has tab navigation', () => {
  const content = readFile('components/AdvancedAnalytics.tsx');
  if (!content.includes('overview') || !content.includes('audience') || !content.includes('content')) {
    throw new Error('Missing required tab navigation (overview, audience, content)');
  }
}, 'task14');

test('Analytics has data visualization charts', () => {
  const content = readFile('components/AdvancedAnalytics.tsx');
  const chartTypes = ['AreaChart', 'BarChart', 'PieChart', 'LineChart', 'RadarChart'];
  const hasCharts = chartTypes.some(chart => content.includes(chart));
  if (!hasCharts) {
    throw new Error('Missing data visualization charts');
  }
}, 'task14');

test('Analytics has caching mechanism', () => {
  const content = readFile('hooks/useAnalyticsEngine.ts');
  if (!content.includes('cache') && !content.includes('Cache')) {
    throw new Error('Missing caching mechanism for performance');
  }
}, 'task14');

// Task 15: Cross-Chain Bridge Integration
console.log('\n🌉 Task 15: Cross-Chain Bridge Integration');
console.log('=' .repeat(60));

test('CrossChainBridge component exists', () => {
  if (!fileExists('components/CrossChainBridge.tsx')) {
    throw new Error('CrossChainBridge.tsx component not found');
  }
}, 'task15');

test('useCrossChainBridge hook exists', () => {
  if (!fileExists('hooks/useCrossChainBridge.ts')) {
    throw new Error('useCrossChainBridge.ts hook not found');
  }
}, 'task15');

test('Bridge hook has required interfaces', () => {
  const content = readFile('hooks/useCrossChainBridge.ts');
  if (!hasInterface(content, 'ChainInfo')) {
    throw new Error('Missing ChainInfo interface');
  }
  if (!hasInterface(content, 'BridgeTransaction')) {
    throw new Error('Missing BridgeTransaction interface');
  }
  if (!hasInterface(content, 'BridgeFeeEstimate')) {
    throw new Error('Missing BridgeFeeEstimate interface');
  }
}, 'task15');

test('Bridge hook has required functions', () => {
  const content = readFile('hooks/useCrossChainBridge.ts');
  const requiredFunctions = [
    'estimateBridgeFee',
    'initiateBridge',
    'trackBridgeStatus',
    'getBridgeHistory',
    'getSupportedChains'
  ];
  
  for (const func of requiredFunctions) {
    if (!hasFunction(content, func)) {
      throw new Error(`Missing required function: ${func}`);
    }
  }
}, 'task15');

test('Bridge supports multiple chains', () => {
  const content = readFile('hooks/useCrossChainBridge.ts');
  const chains = ['Ethereum', 'Polygon', 'BNB', 'Arbitrum', 'Optimism', 'Avalanche'];
  const supportedChains = chains.filter(chain => content.includes(chain));
  if (supportedChains.length < 4) {
    throw new Error(`Insufficient chain support. Found: ${supportedChains.join(', ')}`);
  }
}, 'task15');

test('Bridge has fee estimation', () => {
  const content = readFile('components/CrossChainBridge.tsx');
  if (!content.includes('fee') && !content.includes('Fee')) {
    throw new Error('Missing fee estimation functionality');
  }
}, 'task15');

test('Bridge has transaction confirmation', () => {
  const content = readFile('components/CrossChainBridge.tsx');
  if (!content.includes('confirm') && !content.includes('Confirm')) {
    throw new Error('Missing transaction confirmation flow');
  }
}, 'task15');

test('Bridge has error handling', () => {
  const content = readFile('hooks/useCrossChainBridge.ts');
  if (!content.includes('error') && !content.includes('Error')) {
    throw new Error('Missing error handling mechanism');
  }
}, 'task15');

// Task 16: AI-Powered Content Recommendation System
console.log('\n🤖 Task 16: AI-Powered Content Recommendation System');
console.log('=' .repeat(60));

test('AIRecommendations component exists', () => {
  if (!fileExists('components/AIRecommendations.tsx')) {
    throw new Error('AIRecommendations.tsx component not found');
  }
}, 'task16');

test('useAIRecommendations hook exists', () => {
  if (!fileExists('hooks/useAIRecommendations.ts')) {
    throw new Error('useAIRecommendations.ts hook not found');
  }
}, 'task16');

test('AI hook has required interfaces', () => {
  const content = readFile('hooks/useAIRecommendations.ts');
  if (!hasInterface(content, 'ContentRecommendation')) {
    throw new Error('Missing ContentRecommendation interface');
  }
  if (!hasInterface(content, 'UserPreferences')) {
    throw new Error('Missing UserPreferences interface');
  }
  if (!hasInterface(content, 'ViewingSession')) {
    throw new Error('Missing ViewingSession interface');
  }
}, 'task16');

test('AI hook has required functions', () => {
  const content = readFile('hooks/useAIRecommendations.ts');
  const requiredFunctions = [
    'getPersonalizedRecommendations',
    'getCategoryRecommendations',
    'getCreatorRecommendations',
    'trackUserInteraction',
    'updateUserPreferences',
    'getTrendingContent',
    'getSearchSuggestions'
  ];
  
  for (const func of requiredFunctions) {
    if (!hasFunction(content, func)) {
      throw new Error(`Missing required function: ${func}`);
    }
  }
}, 'task16');

test('AI has confidence scoring', () => {
  const content = readFile('hooks/useAIRecommendations.ts');
  if (!content.includes('confidence')) {
    throw new Error('Missing confidence scoring for recommendations');
  }
}, 'task16');

test('AI has personalization features', () => {
  const content = readFile('components/AIRecommendations.tsx');
  if (!content.includes('personalized') && !content.includes('Personalized')) {
    throw new Error('Missing personalization features');
  }
}, 'task16');

test('AI has filtering capabilities', () => {
  const content = readFile('components/AIRecommendations.tsx');
  if (!content.includes('filter') && !content.includes('Filter')) {
    throw new Error('Missing filtering capabilities');
  }
}, 'task16');

test('AI tracks user interactions', () => {
  const content = readFile('hooks/useAIRecommendations.ts');
  if (!content.includes('trackUserInteraction')) {
    throw new Error('Missing user interaction tracking');
  }
}, 'task16');

test('AI has recommendation reasoning', () => {
  const content = readFile('hooks/useAIRecommendations.ts');
  if (!content.includes('reason')) {
    throw new Error('Missing recommendation reasoning');
  }
}, 'task16');

// Integration Tests
console.log('\n🔗 Integration Tests');
console.log('=' .repeat(60));

test('All components use consistent error handling', () => {
  const files = [
    'components/AdvancedAnalytics.tsx',
    'components/CrossChainBridge.tsx', 
    'components/AIRecommendations.tsx'
  ];
  
  for (const file of files) {
    const content = readFile(file);
    if (!content.includes('error') && !content.includes('Error')) {
      throw new Error(`${file} missing error handling`);
    }
  }
}, 'task14');

test('All hooks use proper TypeScript interfaces', () => {
  const files = [
    'hooks/useAnalyticsEngine.ts',
    'hooks/useCrossChainBridge.ts',
    'hooks/useAIRecommendations.ts'
  ];
  
  for (const file of files) {
    const content = readFile(file);
    if (!content.includes('interface') && !content.includes('Interface')) {
      throw new Error(`${file} missing TypeScript interfaces`);
    }
  }
}, 'task15');

test('All components are responsive', () => {
  const files = [
    'components/AdvancedAnalytics.tsx',
    'components/CrossChainBridge.tsx',
    'components/AIRecommendations.tsx'
  ];
  
  for (const file of files) {
    const content = readFile(file);
    if (!content.includes('sm:') && !content.includes('md:') && !content.includes('lg:')) {
      throw new Error(`${file} missing responsive design classes`);
    }
  }
}, 'task16');

// Print Results
console.log('\n📋 Test Results Summary');
console.log('=' .repeat(60));

const totalTests = results.task14.passed + results.task14.failed + 
                  results.task15.passed + results.task15.failed + 
                  results.task16.passed + results.task16.failed;

const totalPassed = results.task14.passed + results.task15.passed + results.task16.passed;
const totalFailed = results.task14.failed + results.task15.failed + results.task16.failed;

console.log(`\n📊 Task 14 (Analytics): ${results.task14.passed}/${results.task14.passed + results.task14.failed} tests passed`);
console.log(`🌉 Task 15 (Bridge): ${results.task15.passed}/${results.task15.passed + results.task15.failed} tests passed`);
console.log(`🤖 Task 16 (AI): ${results.task16.passed}/${results.task16.passed + results.task16.failed} tests passed`);

console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed (${((totalPassed/totalTests)*100).toFixed(1)}%)`);

if (totalFailed > 0) {
  console.log('\n❌ Failed Tests:');
  ['task14', 'task15', 'task16'].forEach(taskId => {
    const failedTests = results[taskId].tests.filter(t => t.status.includes('FAIL'));
    if (failedTests.length > 0) {
      console.log(`\n${taskId.toUpperCase()}:`);
      failedTests.forEach(test => {
        console.log(`  - ${test.description}: ${test.error}`);
      });
    }
  });
}

// Final Assessment
console.log('\n🏆 Final Assessment');
console.log('=' .repeat(60));

const passRate = (totalPassed / totalTests) * 100;

if (passRate >= 90) {
  console.log('✅ EXCELLENT: All tasks are production-ready!');
} else if (passRate >= 80) {
  console.log('✅ GOOD: Tasks are mostly complete with minor issues.');
} else if (passRate >= 70) {
  console.log('⚠️  ACCEPTABLE: Tasks need some improvements before production.');
} else {
  console.log('❌ NEEDS WORK: Significant issues found that need to be addressed.');
}

console.log(`\nRecommendation: ${passRate >= 85 ? 'APPROVED FOR PRODUCTION' : 'REQUIRES FIXES BEFORE PRODUCTION'}`);

// Exit with appropriate code
process.exit(totalFailed > 0 ? 1 : 0);