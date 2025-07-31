// Audit Configuration Management

import { AuditConfiguration } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';

export class AuditConfigurationManager {
  private static readonly DEFAULT_CONFIG: AuditConfiguration = {
    codeQuality: {
      enableTypeScriptCheck: true,
      enableESLint: true,
      maxComplexity: 10,
      maxFunctionLength: 20
    },
    security: {
      enableContractAudit: true,
      enableDependencyScan: true,
      enableInputValidation: true,
      riskThreshold: 'MEDIUM'
    },
    testing: {
      minCoverageThreshold: 80,
      enableUnitTests: true,
      enableIntegrationTests: true,
      enableE2ETests: true
    },
    performance: {
      maxBundleSize: 1024 * 1024, // 1MB
      maxLoadTime: 3000, // 3 seconds
      enableGasOptimization: true
    },
    accessibility: {
      wcagLevel: 'AA',
      enableKeyboardTesting: true,
      enableScreenReaderTesting: true
    },
    documentation: {
      minAPIDocCoverage: 80,
      requireArchitectureDocs: true,
      requireDeploymentDocs: true
    }
  };

  /**
   * Load audit configuration from file or use defaults
   */
  static async loadConfiguration(configPath?: string): Promise<AuditConfiguration> {
    if (!configPath) {
      return { ...this.DEFAULT_CONFIG };
    }

    try {
      // In a real implementation, this would read from a file
      // For now, return default configuration
      return { ...this.DEFAULT_CONFIG };
    } catch (error) {
      throw new AuditError(
        `Failed to load audit configuration from ${configPath}`,
        'CODE_QUALITY',
        'HIGH',
        'Ensure the configuration file exists and is valid JSON'
      );
    }
  }

  /**
   * Validate audit configuration
   */
  static validateConfiguration(config: AuditConfiguration): void {
    const errors: string[] = [];

    // Validate code quality settings
    if (config.codeQuality.maxComplexity <= 0) {
      errors.push('maxComplexity must be greater than 0');
    }
    if (config.codeQuality.maxFunctionLength <= 0) {
      errors.push('maxFunctionLength must be greater than 0');
    }

    // Validate testing settings
    if (config.testing.minCoverageThreshold < 0 || config.testing.minCoverageThreshold > 100) {
      errors.push('minCoverageThreshold must be between 0 and 100');
    }

    // Validate performance settings
    if (config.performance.maxBundleSize <= 0) {
      errors.push('maxBundleSize must be greater than 0');
    }
    if (config.performance.maxLoadTime <= 0) {
      errors.push('maxLoadTime must be greater than 0');
    }

    // Validate documentation settings
    if (config.documentation.minAPIDocCoverage < 0 || config.documentation.minAPIDocCoverage > 100) {
      errors.push('minAPIDocCoverage must be between 0 and 100');
    }

    if (errors.length > 0) {
      throw new AuditError(
        `Invalid audit configuration: ${errors.join(', ')}`,
        'CODE_QUALITY',
        'HIGH',
        'Fix the configuration errors and try again'
      );
    }
  }

  /**
   * Merge user configuration with defaults
   */
  static mergeWithDefaults(userConfig: Partial<AuditConfiguration>): AuditConfiguration {
    return {
      codeQuality: {
        ...this.DEFAULT_CONFIG.codeQuality,
        ...userConfig.codeQuality
      },
      security: {
        ...this.DEFAULT_CONFIG.security,
        ...userConfig.security
      },
      testing: {
        ...this.DEFAULT_CONFIG.testing,
        ...userConfig.testing
      },
      performance: {
        ...this.DEFAULT_CONFIG.performance,
        ...userConfig.performance
      },
      accessibility: {
        ...this.DEFAULT_CONFIG.accessibility,
        ...userConfig.accessibility
      },
      documentation: {
        ...this.DEFAULT_CONFIG.documentation,
        ...userConfig.documentation
      }
    };
  }

  /**
   * Get default configuration
   */
  static getDefaultConfiguration(): AuditConfiguration {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * Create a production-ready configuration
   */
  static getProductionConfiguration(): AuditConfiguration {
    return {
      ...this.DEFAULT_CONFIG,
      codeQuality: {
        ...this.DEFAULT_CONFIG.codeQuality,
        maxComplexity: 8,
        maxFunctionLength: 15
      },
      security: {
        ...this.DEFAULT_CONFIG.security,
        riskThreshold: 'LOW'
      },
      testing: {
        ...this.DEFAULT_CONFIG.testing,
        minCoverageThreshold: 90
      },
      performance: {
        ...this.DEFAULT_CONFIG.performance,
        maxBundleSize: 512 * 1024, // 512KB
        maxLoadTime: 2000 // 2 seconds
      },
      documentation: {
        ...this.DEFAULT_CONFIG.documentation,
        minAPIDocCoverage: 95
      }
    };
  }

  /**
   * Create a development configuration with relaxed rules
   */
  static getDevelopmentConfiguration(): AuditConfiguration {
    return {
      ...this.DEFAULT_CONFIG,
      codeQuality: {
        ...this.DEFAULT_CONFIG.codeQuality,
        maxComplexity: 15,
        maxFunctionLength: 30
      },
      security: {
        ...this.DEFAULT_CONFIG.security,
        riskThreshold: 'HIGH'
      },
      testing: {
        ...this.DEFAULT_CONFIG.testing,
        minCoverageThreshold: 60
      },
      performance: {
        ...this.DEFAULT_CONFIG.performance,
        maxBundleSize: 2 * 1024 * 1024, // 2MB
        maxLoadTime: 5000 // 5 seconds
      },
      documentation: {
        ...this.DEFAULT_CONFIG.documentation,
        minAPIDocCoverage: 60,
        requireArchitectureDocs: false,
        requireDeploymentDocs: false
      }
    };
  }

  /**
   * Export configuration to JSON string
   */
  static exportConfiguration(config: AuditConfiguration): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  static importConfiguration(jsonString: string): AuditConfiguration {
    try {
      const config = JSON.parse(jsonString);
      const mergedConfig = this.mergeWithDefaults(config);
      this.validateConfiguration(mergedConfig);
      return mergedConfig;
    } catch (error) {
      throw new AuditError(
        `Failed to import audit configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CODE_QUALITY',
        'HIGH',
        'Ensure the JSON is valid and contains proper configuration values'
      );
    }
  }
}