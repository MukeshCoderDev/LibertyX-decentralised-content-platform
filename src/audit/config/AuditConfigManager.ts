// Audit Configuration Management Module

import { AuditConfig, AuditPhase, AuditThresholds } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ConfigOverrides {
  phases?: Partial<Record<AuditPhase, boolean>>;
  thresholds?: Partial<AuditThresholds>;
  outputFormat?: 'json' | 'html' | 'both';
  outputPath?: string;
  parallel?: boolean;
  verbose?: boolean;
}

export class AuditConfigManager {
  private config: AuditConfig;
  private configPath: string;

  constructor(configPath: string = './audit.config.json') {
    this.configPath = configPath;
    this.config = this.getDefaultConfig();
  }

  /**
   * Get default audit configuration
   */
  private getDefaultConfig(): AuditConfig {
    return {
      phases: {
        CODE_QUALITY: true,
        SECURITY: true,
        TESTING: true,
        PERFORMANCE: true,
        ACCESSIBILITY: true,
        DOCUMENTATION: true
      },
      thresholds: {
        codeQuality: {
          complexity: 10,
          duplicateLines: 5,
          maintainabilityIndex: 70
        },
        security: {
          vulnerabilityCount: 0,
          criticalIssues: 0,
          highIssues: 2
        },
        testing: {
          coverage: 80,
          unitTests: 50,
          integrationTests: 10
        },
        performance: {
          bundleSize: 5,
          loadTime: 3000,
          gasLimit: 500000
        },
        accessibility: {
          wcagLevel: 'AA',
          contrastRatio: 4.5,
          keyboardNavigation: 100
        },
        documentation: {
          apiCoverage: 80,
          codeCoverage: 60,
          architectureScore: 70
        }
      },
      outputFormat: 'both',
      outputPath: './audit-reports',
      parallel: true,
      verbose: false,
      excludePatterns: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}'
      ],
      includePatterns: [
        'src/**/*.{ts,tsx,js,jsx}',
        '**/*.sol',
        '**/*.md'
      ]
    };
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<AuditConfig> {
    try {
      const configExists = await this.fileExists(this.configPath);
      
      if (configExists) {
        const configContent = await fs.readFile(this.configPath, 'utf-8');
        const userConfig = JSON.parse(configContent);
        
        // Merge with default config
        this.config = this.mergeConfigs(this.config, userConfig);
        
        // Validate configuration
        this.validateConfig(this.config);
      } else {
        // Create default config file
        await this.saveConfig();
      }

      return this.config;
    } catch (error) {
      throw new AuditError(
        `Failed to load audit configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONFIG',
        'HIGH',
        'Check audit configuration file format and permissions'
      );
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config?: AuditConfig): Promise<void> {
    try {
      const configToSave = config || this.config;
      
      // Ensure output directory exists
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });
      
      // Write configuration
      await fs.writeFile(
        this.configPath, 
        JSON.stringify(configToSave, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new AuditError(
        `Failed to save audit configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONFIG',
        'MEDIUM',
        'Check file permissions and disk space'
      );
    }
  }

  /**
   * Apply configuration overrides
   */
  applyOverrides(overrides: ConfigOverrides): AuditConfig {
    const updatedConfig = { ...this.config };

    if (overrides.phases) {
      updatedConfig.phases = { ...updatedConfig.phases, ...overrides.phases };
    }

    if (overrides.thresholds) {
      updatedConfig.thresholds = this.mergeThresholds(updatedConfig.thresholds, overrides.thresholds);
    }

    if (overrides.outputFormat) {
      updatedConfig.outputFormat = overrides.outputFormat;
    }

    if (overrides.outputPath) {
      updatedConfig.outputPath = overrides.outputPath;
    }

    if (overrides.parallel !== undefined) {
      updatedConfig.parallel = overrides.parallel;
    }

    if (overrides.verbose !== undefined) {
      updatedConfig.verbose = overrides.verbose;
    }

    this.config = updatedConfig;
    return updatedConfig;
  }

  /**
   * Merge threshold configurations
   */
  private mergeThresholds(base: AuditThresholds, overrides: Partial<AuditThresholds>): AuditThresholds {
    return {
      codeQuality: { ...base.codeQuality, ...overrides.codeQuality },
      security: { ...base.security, ...overrides.security },
      testing: { ...base.testing, ...overrides.testing },
      performance: { ...base.performance, ...overrides.performance },
      accessibility: { ...base.accessibility, ...overrides.accessibility },
      documentation: { ...base.documentation, ...overrides.documentation }
    };
  }

  /**
   * Merge configurations deeply
   */
  private mergeConfigs(base: AuditConfig, override: any): AuditConfig {
    const merged = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof AuditConfig] = { 
          ...merged[key as keyof AuditConfig] as any, 
          ...value 
        };
      } else {
        merged[key as keyof AuditConfig] = value;
      }
    }

    return merged;
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: AuditConfig): void {
    const errors: string[] = [];

    // Validate phases
    if (!config.phases || typeof config.phases !== 'object') {
      errors.push('Invalid phases configuration');
    }

    // Validate thresholds
    if (!config.thresholds || typeof config.thresholds !== 'object') {
      errors.push('Invalid thresholds configuration');
    } else {
      // Validate threshold values
      const { codeQuality, security, testing, performance, accessibility, documentation } = config.thresholds;
      
      if (codeQuality?.complexity && (codeQuality.complexity < 1 || codeQuality.complexity > 50)) {
        errors.push('Code quality complexity threshold must be between 1 and 50');
      }
      
      if (testing?.coverage && (testing.coverage < 0 || testing.coverage > 100)) {
        errors.push('Testing coverage threshold must be between 0 and 100');
      }
      
      if (performance?.bundleSize && performance.bundleSize < 0) {
        errors.push('Performance bundle size threshold must be positive');
      }
      
      if (accessibility?.contrastRatio && accessibility.contrastRatio < 1) {
        errors.push('Accessibility contrast ratio must be at least 1');
      }
    }

    // Validate output format
    if (config.outputFormat && !['json', 'html', 'both'].includes(config.outputFormat)) {
      errors.push('Output format must be json, html, or both');
    }

    // Validate patterns
    if (config.excludePatterns && !Array.isArray(config.excludePatterns)) {
      errors.push('Exclude patterns must be an array');
    }
    
    if (config.includePatterns && !Array.isArray(config.includePatterns)) {
      errors.push('Include patterns must be an array');
    }

    if (errors.length > 0) {
      throw new AuditError(
        `Configuration validation failed: ${errors.join(', ')}`,
        'CONFIG',
        'HIGH',
        'Fix configuration errors and try again'
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AuditConfig {
    return { ...this.config };
  }

  /**
   * Get configuration for specific phase
   */
  getPhaseConfig(phase: AuditPhase): boolean {
    return this.config.phases[phase] || false;
  }

  /**
   * Get thresholds for specific category
   */
  getThresholds(category: keyof AuditThresholds): any {
    return this.config.thresholds[category];
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
   * Create configuration template
   */
  async createConfigTemplate(templatePath?: string): Promise<void> {
    const template = {
      $schema: "https://raw.githubusercontent.com/libertyx/audit-schema/main/audit-config.schema.json",
      phases: {
        CODE_QUALITY: true,
        SECURITY: true,
        TESTING: true,
        PERFORMANCE: true,
        ACCESSIBILITY: true,
        DOCUMENTATION: true
      },
      thresholds: {
        codeQuality: {
          complexity: 10,
          duplicateLines: 5,
          maintainabilityIndex: 70
        },
        security: {
          vulnerabilityCount: 0,
          criticalIssues: 0,
          highIssues: 2
        },
        testing: {
          coverage: 80,
          unitTests: 50,
          integrationTests: 10
        },
        performance: {
          bundleSize: 5,
          loadTime: 3000,
          gasLimit: 500000
        },
        accessibility: {
          wcagLevel: "AA",
          contrastRatio: 4.5,
          keyboardNavigation: 100
        },
        documentation: {
          apiCoverage: 80,
          codeCoverage: 60,
          architectureScore: 70
        }
      },
      outputFormat: "both",
      outputPath: "./audit-reports",
      parallel: true,
      verbose: false,
      excludePatterns: [
        "node_modules/**",
        "dist/**",
        "build/**",
        "**/*.test.{ts,tsx,js,jsx}",
        "**/*.spec.{ts,tsx,js,jsx}"
      ],
      includePatterns: [
        "src/**/*.{ts,tsx,js,jsx}",
        "**/*.sol",
        "**/*.md"
      ]
    };

    const outputPath = templatePath || './audit.config.template.json';
    await fs.writeFile(outputPath, JSON.stringify(template, null, 2), 'utf-8');
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): AuditConfig {
    this.config = this.getDefaultConfig();
    return this.config;
  }

  /**
   * Export configuration for sharing
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from string
   */
  importConfig(configString: string): AuditConfig {
    try {
      const importedConfig = JSON.parse(configString);
      this.config = this.mergeConfigs(this.getDefaultConfig(), importedConfig);
      this.validateConfig(this.config);
      return this.config;
    } catch (error) {
      throw new AuditError(
        `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONFIG',
        'HIGH',
        'Check configuration format and try again'
      );
    }
  }
}