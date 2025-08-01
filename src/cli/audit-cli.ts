#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
// import ora from 'ora';
import { promises as fs } from 'fs';
import { ComprehensiveAuditRunner } from '../audit/runner/ComprehensiveAuditRunner.js';
import { AuditConfigManager } from '../audit/config/AuditConfigManager.js';
// import { AuditProgress } from '../audit/types/index.js';

const program = new Command();
let currentSpinner: any = null;
const phaseSpinners = new Map<string, any>();

program
  .name('audit')
  .description('LibertyX Comprehensive Audit Tool')
  .version('1.0.0');

/**
 * Main audit command
 */
program
  .command('run')
  .description('Run comprehensive audit')
  .option('-c, --config <path>', 'Path to audit configuration file', './audit.config.json')
  .option('-o, --output <path>', 'Output directory for reports', './audit-reports')
  .option('-f, --format <format>', 'Report format (json, html, both)', 'both')
  .option('--include-phases <phases>', 'Comma-separated list of phases to include')
  .option('--exclude-phases <phases>', 'Comma-separated list of phases to exclude')
  .option('--parallel', 'Run phases in parallel where possible', false)
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    const startTime = Date.now();
    
    try {
      console.log(chalk.blue.bold('🔍 LibertyX Comprehensive Audit'));
      console.log(chalk.gray('='.repeat(50)));
      
      // Load configuration
      const configManager = new AuditConfigManager(options.config);
      const config = await configManager.loadConfig();
      
      // Apply command line overrides
      if (options.output) config.outputPath = options.output;
      if (options.format) config.outputFormat = options.format;
      if (options.parallel !== undefined) config.parallel = options.parallel;
      if (options.verbose !== undefined) config.verbose = options.verbose;
      
      // Parse phase options
      const phaseOverrides = parsePhaseOptions(options.includePhases, options.excludePhases);
      if (Object.keys(phaseOverrides).length > 0) {
        config.phases = { ...config.phases, ...phaseOverrides };
      }
      
      // Initialize audit runner
      const auditRunner = new ComprehensiveAuditRunner(config);
      
      // Set up progress handlers
      auditRunner.on('progress', handleProgress);
      auditRunner.on('phaseComplete', handlePhaseComplete);
      
      console.log(chalk.blue('🚀 Starting comprehensive audit...\n'));
      
      // Run audit
      const auditReport = await auditRunner.runAudit();
      const executionTime = Date.now() - startTime;
      
      // Clean up spinners
      cleanupSpinners();
      
      // Generate reports
      console.log(chalk.blue('\n📄 Generating reports...'));
      const reportPaths = await auditRunner.generateReports(auditReport);
      
      // Display results
      displayAuditResults(auditReport, reportPaths, executionTime);
      
    } catch (error) {
      cleanupSpinners();
      console.error(chalk.red('\n❌ Audit failed:'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      
      if (options.verbose && error instanceof Error) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }
      
      process.exit(1);
    }
  });

/**
 * Initialize audit configuration
 */
program
  .command('init')
  .description('Initialize audit configuration')
  .option('-f, --force', 'Overwrite existing configuration', false)
  .option('--template', 'Create template configuration with comments', false)
  .action(async (options) => {
    try {
      const configPath = './audit.config.json';
      const templatePath = './audit.config.template.json';
      
      // Check if config already exists
      const configExists = await fileExists(configPath);
      
      if (configExists && !options.force) {
        console.log(chalk.yellow('⚠️  Configuration file already exists.'));
        console.log(chalk.gray('Use --force to overwrite or --template to create template.'));
        return;
      }
      
      const configManager = new AuditConfigManager();
      
      if (options.template) {
        await configManager.createConfigTemplate(templatePath);
        console.log(chalk.green('✅ Template configuration created:'));
        console.log(chalk.blue(`   ${templatePath}`));
      } else {
        await configManager.saveConfig();
        console.log(chalk.green('✅ Default configuration created:'));
        console.log(chalk.blue(`   ${configPath}`));
      }
      
      console.log(chalk.gray('\nEdit the configuration file to customize audit settings.'));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize configuration:'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

/**
 * Validate audit configuration
 */
program
  .command('validate')
  .description('Validate audit configuration')
  .option('-c, --config <path>', 'Path to audit configuration file', './audit.config.json')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔧 Validating audit configuration...'));
      
      const configManager = new AuditConfigManager(options.config);
      const config = await configManager.loadConfig();
      
      console.log(chalk.green('✅ Configuration is valid'));
      console.log(chalk.gray('\nConfiguration summary:'));
      console.log(chalk.blue(`   Phases enabled: ${Object.entries(config.phases).filter(([, enabled]) => enabled).map(([phase]) => phase).join(', ')}`));
      console.log(chalk.blue(`   Output format: ${config.outputFormat}`));
      console.log(chalk.blue(`   Output path: ${config.outputPath}`));
      console.log(chalk.blue(`   Parallel execution: ${config.parallel ? 'enabled' : 'disabled'}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Configuration validation failed:'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

/**
 * Show audit scoring information
 */
program
  .command('scoring')
  .description('Show audit scoring methodology and weights')
  .action(() => {
    console.log(chalk.blue.bold('📊 LibertyX Audit Scoring Methodology\n'));
    
    const weights = {
      codeQuality: 0.20,
      security: 0.25,
      testing: 0.20,
      performance: 0.15,
      accessibility: 0.10,
      documentation: 0.10
    };
    
    console.log(chalk.yellow('Phase Weights:'));
    console.log(chalk.blue(`  Code Quality:    ${(weights.codeQuality * 100).toFixed(1)}%`));
    console.log(chalk.blue(`  Security:        ${(weights.security * 100).toFixed(1)}%`));
    console.log(chalk.blue(`  Testing:         ${(weights.testing * 100).toFixed(1)}%`));
    console.log(chalk.blue(`  Performance:     ${(weights.performance * 100).toFixed(1)}%`));
    console.log(chalk.blue(`  Accessibility:   ${(weights.accessibility * 100).toFixed(1)}%`));
    console.log(chalk.blue(`  Documentation:   ${(weights.documentation * 100).toFixed(1)}%`));
    
    console.log(chalk.yellow('\nProduction Readiness Levels:'));
    console.log(chalk.green('  EXCELLENT:   90+ score, comprehensive coverage'));
    console.log(chalk.blue('  READY:       80+ score, good coverage'));
    console.log(chalk.yellow('  NEEDS_WORK:  60+ score, some issues'));
    console.log(chalk.red('  NOT_READY:   <60 score or critical issues'));
    
    console.log(chalk.yellow('\nScoring Factors:'));
    console.log(chalk.gray('  • Critical security issues: -25 points each'));
    console.log(chalk.gray('  • High security issues: -10 points each'));
    console.log(chalk.gray('  • Test coverage below 80%: -0.5 points per %'));
    console.log(chalk.gray('  • Security score below 80%: -0.3 points per point'));
    console.log(chalk.gray('  • Performance score below 70%: -0.2 points per point'));
  });

/**
 * Analyze specific report
 */
program
  .command('analyze <reportPath>')
  .description('Analyze existing audit report')
  .option('--summary', 'Show summary only', false)
  .action(async (reportPath, options) => {
    try {
      console.log(chalk.blue(`🔍 Analyzing report: ${reportPath}`));
      
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      const auditReport = JSON.parse(reportContent);
      
      if (options.summary) {
        displaySummaryOnly(auditReport);
      } else {
        displayDetailedAnalysis(auditReport);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to analyze report:'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

/**
 * Handle progress updates
 */
function handleProgress(progress: AuditProgress): void {
  const phase = progress.phase.replace('_', ' ').toLowerCase();
  
  if (progress.status === 'running') {
    if (!phaseSpinners.has(progress.phase)) {
      const spinner = ora({
        text: chalk.blue(`Running ${phase} audit...`),
        color: 'blue'
      }).start();
      phaseSpinners.set(progress.phase, spinner);
    }
  } else if (progress.status === 'completed') {
    const spinner = phaseSpinners.get(progress.phase);
    if (spinner) {
      spinner.succeed(chalk.green(`${phase} audit completed`));
      phaseSpinners.delete(progress.phase);
    }
  } else if (progress.status === 'failed') {
    const spinner = phaseSpinners.get(progress.phase);
    if (spinner) {
      spinner.fail(chalk.red(`${phase} audit failed: ${progress.message}`));
      phaseSpinners.delete(progress.phase);
    }
  }
}

/**
 * Handle phase completion
 */
function handlePhaseComplete(phase: string, report: any): void {
  // const phaseName = phase.replace('_', ' ').toLowerCase();
  const scoreColor = report.score >= 80 ? 'green' : report.score >= 60 ? 'yellow' : 'red';
  console.log(chalk.gray(`  Score: ${chalk[scoreColor](report.score + '/100')}`));
}

/**
 * Parse phase options
 */
function parsePhaseOptions(includePhases?: string, excludePhases?: string): any {
  const allPhases = ['CODE_QUALITY', 'SECURITY', 'TESTING', 'PERFORMANCE', 'ACCESSIBILITY', 'DOCUMENTATION'];
  const phaseOverrides: any = {};

  // Start with all phases enabled
  allPhases.forEach(phase => {
    phaseOverrides[phase] = true;
  });

  // Handle exclusions
  if (excludePhases) {
    const excluded = excludePhases.split(',').map(p => p.trim().toUpperCase());
    excluded.forEach(phase => {
      if (allPhases.includes(phase)) {
        phaseOverrides[phase] = false;
      }
    });
  }

  // Handle inclusions (overrides exclusions)
  if (includePhases) {
    // First disable all
    allPhases.forEach(phase => {
      phaseOverrides[phase] = false;
    });
    
    // Then enable specified
    const included = includePhases.split(',').map(p => p.trim().toUpperCase());
    included.forEach(phase => {
      if (allPhases.includes(phase)) {
        phaseOverrides[phase] = true;
      }
    });
  }

  return phaseOverrides;
}

/**
 * Display audit results
 */
function displayAuditResults(auditReport: any, reportPaths: any, executionTime: number): void {
  console.log(chalk.blue.bold('\n📋 Audit Results Summary'));
  console.log(chalk.gray('='.repeat(50)));
  
  // Overall score
  const scoreColor = auditReport.overallScore >= 80 ? 'green' :
                    auditReport.overallScore >= 60 ? 'yellow' : 'red';
  console.log(chalk.blue(`Overall Score: ${chalk[scoreColor].bold(auditReport.overallScore + '/100')}`));
  
  // Status
  const statusColor = auditReport.overallStatus === 'passed' ? 'green' :
                     auditReport.overallStatus === 'warning' ? 'yellow' : 'red';
  console.log(chalk.blue(`Status: ${chalk[statusColor].bold(auditReport.overallStatus.toUpperCase())}`));
  
  // Production readiness
  const readinessColor = auditReport.productionReadiness === 'EXCELLENT' ? 'green' :
                        auditReport.productionReadiness === 'READY' ? 'blue' :
                        auditReport.productionReadiness === 'NEEDS_WORK' ? 'yellow' : 'red';
  console.log(chalk.blue(`Production Readiness: ${chalk[readinessColor].bold(auditReport.productionReadiness.replace('_', ' '))}`));
  
  // Phase results
  console.log(chalk.blue(`\nPhases: ${auditReport.phasesPassed.length}/${auditReport.phasesExecuted.length} passed`));
  
  // Execution info
  console.log(chalk.gray(`Execution time: ${(executionTime / 1000).toFixed(2)}s`));
  
  // Report files
  console.log(chalk.blue('\n📄 Generated Reports:'));
  if (reportPaths.jsonPath) {
    console.log(chalk.green(`   JSON: ${reportPaths.jsonPath}`));
  }
  if (reportPaths.htmlPath) {
    console.log(chalk.green(`   HTML: ${reportPaths.htmlPath}`));
  }
  
  // Top recommendations
  if (auditReport.recommendations && auditReport.recommendations.length > 0) {
    console.log(chalk.blue('\n💡 Top Recommendations:'));
    auditReport.recommendations.slice(0, 5).forEach((rec: string, index: number) => {
      console.log(chalk.yellow(`   ${index + 1}. ${rec}`));
    });
  }
  
  console.log(chalk.gray('\n' + '='.repeat(50)));
}

/**
 * Display summary only
 */
function displaySummaryOnly(auditReport: any): void {
  console.log(chalk.blue.bold('📊 Audit Summary'));
  console.log(chalk.blue(`Score: ${auditReport.overallScore}/100`));
  console.log(chalk.blue(`Status: ${auditReport.overallStatus}`));
  console.log(chalk.blue(`Readiness: ${auditReport.productionReadiness}`));
  console.log(chalk.blue(`Phases: ${auditReport.phasesPassed.length}/${auditReport.phasesExecuted.length} passed`));
}

/**
 * Display detailed analysis
 */
function displayDetailedAnalysis(auditReport: any): void {
  displaySummaryOnly(auditReport);
  
  console.log(chalk.blue('\n📋 Phase Details:'));
  auditReport.phasesExecuted.forEach((phase: string) => {
    const report = auditReport.reports[phase];
    if (report) {
      const scoreColor = report.score >= 80 ? 'green' : report.score >= 60 ? 'yellow' : 'red';
      console.log(chalk.blue(`   ${phase}: ${chalk[scoreColor](report.score + '/100')} - ${report.status}`));
    }
  });
  
  if (auditReport.errors && auditReport.errors.length > 0) {
    console.log(chalk.red('\n❌ Errors:'));
    auditReport.errors.forEach((error: any) => {
      console.log(chalk.red(`   ${error.phase}: ${error.message}`));
    });
  }
}

/**
 * Clean up all spinners
 */
function cleanupSpinners(): void {
  if (currentSpinner) {
    currentSpinner.stop();
    currentSpinner = null;
  }
  
  phaseSpinners.forEach(spinner => {
    spinner.stop();
  });
  phaseSpinners.clear();
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Handle process termination
process.on('SIGINT', () => {
  cleanupSpinners();
  console.log(chalk.yellow('\n⚠️  Audit interrupted by user'));
  process.exit(130);
});

process.on('SIGTERM', () => {
  cleanupSpinners();
  console.log(chalk.yellow('\n⚠️  Audit terminated'));
  process.exit(143);
});

// Parse command line arguments
program.parse();