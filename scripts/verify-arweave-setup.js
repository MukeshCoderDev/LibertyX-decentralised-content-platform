#!/usr/bin/env node

/**
 * 🔍 ARWEAVE SETUP VERIFICATION SCRIPT
 * 
 * Quick verification that Arweave is properly configured
 * for enterprise deployment
 */

import { getWalletAddress, getWalletBalance, arweave } from './arweave-utils.js';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function verifySetup() {
    log('\n🔍 ARWEAVE SETUP VERIFICATION', colors.bright + colors.cyan);
    log('=' * 40, colors.cyan);
    
    const checks = [];
    
    try {
        // Check 1: Wallet file exists and is valid
        log('\n1. Checking wallet configuration...', colors.cyan);
        const address = await getWalletAddress();
        log(`   ✅ Wallet address: ${address}`, colors.green);
        checks.push({ name: 'Wallet Configuration', status: 'PASS' });
        
        // Check 2: Network connectivity
        log('\n2. Testing Arweave network connectivity...', colors.cyan);
        const networkInfo = await arweave.network.getInfo();
        log(`   ✅ Network height: ${networkInfo.height}`, colors.green);
        log(`   ✅ Network version: ${networkInfo.release}`, colors.green);
        checks.push({ name: 'Network Connectivity', status: 'PASS' });
        
        // Check 3: Wallet balance
        log('\n3. Checking wallet balance...', colors.cyan);
        const balance = await getWalletBalance();
        log(`   💰 Balance: ${balance.ar} AR`, balance.ar > 0 ? colors.green : colors.yellow);
        
        if (parseFloat(balance.ar) > 0) {
            checks.push({ name: 'Wallet Balance', status: 'PASS' });
        } else {
            log(`   ⚠️  No funds available - uploads will fail`, colors.yellow);
            log(`   💡 Get free AR: https://faucet.arweave.net/`, colors.yellow);
            checks.push({ name: 'Wallet Balance', status: 'WARN' });
        }
        
        // Check 4: Transaction cost estimation
        log('\n4. Testing cost estimation...', colors.cyan);
        const testSize = 1024 * 100; // 100KB
        const cost = await arweave.transactions.getPrice(testSize);
        const costAR = arweave.ar.winstonToAr(cost);
        log(`   💰 Cost for 100KB: ${costAR} AR`, colors.green);
        checks.push({ name: 'Cost Estimation', status: 'PASS' });
        
        // Summary
        log('\n📊 VERIFICATION SUMMARY', colors.bright + colors.cyan);
        log('=' * 40, colors.cyan);
        
        const passed = checks.filter(c => c.status === 'PASS').length;
        const warnings = checks.filter(c => c.status === 'WARN').length;
        const failed = checks.filter(c => c.status === 'FAIL').length;
        
        checks.forEach(check => {
            const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
            const color = check.status === 'PASS' ? colors.green : check.status === 'WARN' ? colors.yellow : colors.red;
            log(`${icon} ${check.name}: ${check.status}`, color);
        });
        
        log(`\n📈 Results: ${passed} passed, ${warnings} warnings, ${failed} failed`, colors.cyan);
        
        if (failed === 0) {
            log('\n🎉 ARWEAVE SETUP VERIFIED!', colors.bright + colors.green);
            log('🚀 Ready for content uploads', colors.green);
            
            if (warnings > 0) {
                log('⚠️  Note: Some warnings need attention for full functionality', colors.yellow);
            }
        } else {
            log('\n❌ SETUP ISSUES DETECTED', colors.bright + colors.red);
            log('🔧 Please fix the failed checks before proceeding', colors.red);
            process.exit(1);
        }
        
    } catch (error) {
        log(`\n❌ VERIFICATION FAILED: ${error.message}`, colors.bright + colors.red);
        process.exit(1);
    }
}

verifySetup();