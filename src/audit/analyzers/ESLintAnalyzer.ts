// ESLint Integration Module

import { ESLint } from 'eslint';
import { LintingIssue, ESLintResult } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import * as fs from 'fs/promises';

export class ESLintAnalyzer {
  private eslint: ESLint | null = null;
  private configPath?: string;

  constructor(configPath?: string) {
    this.configPath = configPath;
  }

  /**
   * Initialize ESLint with configuration
   */
  private async initializeESLint(): Promise<void> {
    try {
      const eslintConfig = await this.getESLintConfig();
      
      this.eslint = new ESLint({
        baseConfig: eslintConfig,
        useEslintrc: true,
        fix: false,
        cache: false,
        cacheLocation: '.eslintcache'
      });
    } catch (error) {
      throw new AuditError(
        `Failed to initialize ESLint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CODE_QUALITY',
        'HIGH',
        'Check ESLint configuration and installation'
      );
    }
  }

  /**
   * Get ESLint configuration with strict rules
   */
  private async getESLintConfig(): Promise<any> {
    const strictConfig = {
      env: {
        browser: true,
        es2021: true,
        node: true
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      },
      plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks'
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        'no-console': 'warn',
        'no-debugger': 'error',
        'prefer-const': 'error',
        'eqeqeq': 'error',
        'curly': 'error',
        'complexity': ['warn', { max: 10 }]
      }
    };

    if (this.configPath) {
      try {
        const customConfig = JSON.parse(await fs.readFile(this.configPath, 'utf-8'));
        return { ...strictConfig, ...customConfig };
      } catch (error) {
        throw new AuditError(
          `Failed to load custom ESLint config from ${this.configPath}`,
          'CODE_QUALITY',
          'MEDIUM',
          'Check the custom ESLint configuration file path and format'
        );
      }
    }

    return strictConfig;
  }  /**
   * 
Run ESLint on specified files or patterns
   */
  async runESLint(patterns: string[] = ['src/**/*.{ts,tsx,js,jsx}']): Promise<ESLintResult> {
    if (!this.eslint) {
      await this.initializeESLint();
    }

    if (!this.eslint) {
      throw new AuditError(
        'ESLint not initialized',
        'CODE_QUALITY',
        'HIGH',
        'Ensure ESLint is properly configured'
      );
    }

    try {
      const results = await this.eslint.lintFiles(patterns);
      const issues: LintingIssue[] = [];
      let totalErrors = 0;
      let totalWarnings = 0;

      for (const result of results) {
        for (const message of result.messages) {
          const issue: LintingIssue = {
            file: result.filePath,
            line: message.line,
            column: message.column,
            severity: message.severity === 2 ? 'error' : 'warning',
            message: message.message,
            ruleId: message.ruleId || 'unknown',
            source: message.source || ''
          };

          issues.push(issue);

          if (message.severity === 2) {
            totalErrors++;
          } else {
            totalWarnings++;
          }
        }
      }

      return {
        issues,
        totalErrors,
        totalWarnings,
        totalFiles: results.length,
        filesWithIssues: results.filter(r => r.messages.length > 0).length
      };
    } catch (error) {
      throw new AuditError(
        `ESLint execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CODE_QUALITY',
        'HIGH',
        'Check file patterns and ESLint configuration'
      );
    }
  }

  /**
   * Validate rule configuration
   */
  async validateRuleConfiguration(): Promise<{
    configuredRules: Record<string, any>;
    missingRecommendedRules: string[];
    recommendations: string[];
  }> {
    if (!this.eslint) {
      await this.initializeESLint();
    }

    const config = await this.eslint!.calculateConfigForFile('dummy.ts');
    const configuredRules = config.rules || {};
    
    const recommendedRules = [
      '@typescript-eslint/no-explicit-any',
      '@typescript-eslint/no-unused-vars',
      'no-console',
      'no-debugger',
      'prefer-const',
      'eqeqeq',
      'curly'
    ];

    const missingRecommendedRules = recommendedRules.filter(
      rule => !configuredRules[rule] || configuredRules[rule] === 'off'
    );

    const recommendations: string[] = [];
    
    if (missingRecommendedRules.length > 0) {
      recommendations.push(`Enable recommended rules: ${missingRecommendedRules.join(', ')}`);
    }

    return {
      configuredRules,
      missingRecommendedRules,
      recommendations
    };
  }

  /**
   * Generate comprehensive ESLint report
   */
  async generateESLintReport(patterns: string[] = ['src/**/*.{ts,tsx,js,jsx}']): Promise<{
    lintResults: ESLintResult;
    ruleValidation: any;
    score: number;
    recommendations: string[];
  }> {
    const lintResults = await this.runESLint(patterns);
    const ruleValidation = await this.validateRuleConfiguration();

    // Calculate score based on various factors
    let score = 100;
    score -= lintResults.totalErrors * 5;
    score -= lintResults.totalWarnings * 2;
    score -= ruleValidation.missingRecommendedRules.length * 3;

    score = Math.max(0, Math.min(100, score));

    const recommendations = [
      ...ruleValidation.recommendations,
      ...(lintResults.totalErrors > 0 ? ['Fix all ESLint errors before proceeding'] : []),
      ...(lintResults.totalWarnings > 10 ? ['Address ESLint warnings to improve code quality'] : [])
    ];

    return {
      lintResults,
      ruleValidation,
      score: Math.round(score),
      recommendations
    };
  }
}