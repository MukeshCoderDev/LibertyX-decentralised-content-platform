// Private Key Security Analysis Module

import * as ts from 'typescript';
import { PrivateKeyExposure, PrivateKeyAuditReport } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import * as fs from 'fs/promises';

export interface KeyExposurePattern {
  name: string;
  pattern: RegExp;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  recommendation: string;
}

export interface SecureStorageCheck {
  location: string;
  isSecure: boolean;
  method: string;
  recommendations: string[];
}

export class PrivateKeySecurityAnalyzer {
  private program: ts.Program | null = null;
  private keyExposurePatterns: KeyExposurePattern[] = [];

  constructor() {
    this.initializeKeyExposurePatterns();
  }

  /**
   * Initialize patterns for detecting private key exposures
   */
  private initializeKeyExposurePatterns(): void {
    this.keyExposurePatterns = [
      {
        name: 'Hardcoded Private Key',
        pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
        severity: 'CRITICAL',
        description: 'Private key directly embedded in source code',
        recommendation: 'Move private keys to secure environment variables or key management systems'
      },
      {
        name: 'Private Key Variable',
        pattern: /(private[_\s]*key|privatekey|privkey)\s*[=:]\s*['"]/gi,
        severity: 'HIGH',
        description: 'Variable containing private key data',
        recommendation: 'Use secure key storage and avoid hardcoding keys in variables'
      },
      {
        name: 'Mnemonic Phrase',
        pattern: /(mnemonic|seed[_\s]*phrase)\s*[=:]\s*['"][^'"]{50,}['"]/gi,
        severity: 'CRITICAL',
        description: 'Cryptocurrency mnemonic phrase in source code',
        recommendation: 'Never store mnemonic phrases in code, use secure wallet management'
      },
      {
        name: 'API Secret Key',
        pattern: /(api[_\s]*secret|secret[_\s]*key|access[_\s]*token)\s*[=:]\s*['"][a-zA-Z0-9+/=]{20,}['"]/gi,
        severity: 'HIGH',
        description: 'API secret key or access token in source code',
        recommendation: 'Use environment variables or secure configuration management'
      },
      {
        name: 'JWT Secret',
        pattern: /(jwt[_\s]*secret|token[_\s]*secret)\s*[=:]\s*['"][^'"]{16,}['"]/gi,
        severity: 'HIGH',
        description: 'JWT signing secret in source code',
        recommendation: 'Store JWT secrets in secure environment variables'
      },
      {
        name: 'Database Password',
        pattern: /(db[_\s]*password|database[_\s]*password|mysql[_\s]*password|postgres[_\s]*password)\s*[=:]\s*['"][^'"]+['"]/gi,
        severity: 'HIGH',
        description: 'Database password in source code',
        recommendation: 'Use environment variables or secure configuration for database credentials'
      },
      {
        name: 'Console Log Exposure',
        pattern: /console\.log\s*\([^)]*(?:private|secret|key|password|token)[^)]*\)/gi,
        severity: 'MEDIUM',
        description: 'Potential private data logged to console',
        recommendation: 'Remove console.log statements containing sensitive data'
      },
      {
        name: 'Environment Variable Exposure',
        pattern: /process\.env\.[A-Z_]*(?:PRIVATE|SECRET|KEY|PASSWORD|TOKEN)[A-Z_]*/g,
        severity: 'LOW',
        description: 'Environment variable containing sensitive data referenced in code',
        recommendation: 'Ensure environment variables are properly secured and not logged'
      },
      {
        name: 'Wallet Private Key',
        pattern: /(wallet[_\s]*private[_\s]*key|eth[_\s]*private[_\s]*key)\s*[=:]\s*['"]0x[a-fA-F0-9]{64}['"]/gi,
        severity: 'CRITICAL',
        description: 'Cryptocurrency wallet private key in source code',
        recommendation: 'Use secure wallet management and hardware security modules'
      },
      {
        name: 'SSH Private Key',
        pattern: /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+OPENSSH\s+PRIVATE\s+KEY-----/gi,
        severity: 'CRITICAL',
        description: 'SSH private key embedded in source code',
        recommendation: 'Remove SSH keys from code and use proper key management'
      }
    ];
  }

  /**
   * Initialize TypeScript program for analysis
   */
  private async initializeProgram(): Promise<void> {
    try {
      const configFile = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
      
      if (!configFile) {
        throw new AuditError(
          'TypeScript config file not found',
          'SECURITY',
          'HIGH',
          'Create a tsconfig.json file in your project root'
        );
      }

      const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
      const { options, fileNames, errors } = ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        './'
      );

      if (errors.length > 0) {
        throw new AuditError(
          `TypeScript configuration errors: ${errors.map(e => e.messageText).join(', ')}`,
          'SECURITY',
          'HIGH',
          'Fix TypeScript configuration errors'
        );
      }

      this.program = ts.createProgram(fileNames, options);
    } catch (error) {
      if (error instanceof AuditError) {
        throw error;
      }
      throw new AuditError(
        `Failed to initialize TypeScript program: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SECURITY',
        'HIGH',
        'Check TypeScript installation and configuration'
      );
    }
  }

  /**
   * Scan for private key exposures using pattern matching
   */
  private async scanForKeyExposures(sourceFiles: ts.SourceFile[]): Promise<PrivateKeyExposure[]> {
    const exposures: PrivateKeyExposure[] = [];

    for (const sourceFile of sourceFiles) {
      const sourceText = sourceFile.getFullText();
      const lines = sourceText.split('\n');

      for (const pattern of this.keyExposurePatterns) {
        let match;
        pattern.pattern.lastIndex = 0; // Reset regex state

        while ((match = pattern.pattern.exec(sourceText)) !== null) {
          const position = sourceFile.getLineAndCharacterOfPosition(match.index);
          
          exposures.push({
            type: pattern.name,
            severity: pattern.severity,
            file: sourceFile.fileName,
            line: position.line + 1,
            column: position.character + 1,
            description: pattern.description,
            exposedData: this.sanitizeExposedData(match[0]),
            recommendation: pattern.recommendation,
            riskLevel: this.calculateRiskLevel(pattern.severity, match[0])
          });
        }
      }
    }

    return exposures;
  }

  /**
   * Sanitize exposed data for reporting (hide actual sensitive values)
   */
  private sanitizeExposedData(data: string): string {
    // Replace actual sensitive data with placeholders
    return data
      .replace(/-----BEGIN[\s\S]*?-----END[^-]*-----/gi, '[PRIVATE_KEY_REDACTED]')
      .replace(/['"][a-zA-Z0-9+/=]{20,}['"]/g, '"[SECRET_REDACTED]"')
      .replace(/0x[a-fA-F0-9]{64}/g, '0x[PRIVATE_KEY_REDACTED]')
      .replace(/['"][^'"]{50,}['"]/g, '"[LONG_SECRET_REDACTED]"')
      .substring(0, 100) + (data.length > 100 ? '...' : '');
  }

  /**
   * Calculate risk level based on severity and content
   */
  private calculateRiskLevel(severity: string, content: string): number {
    let baseRisk = 0;
    
    switch (severity) {
      case 'CRITICAL': baseRisk = 10; break;
      case 'HIGH': baseRisk = 7; break;
      case 'MEDIUM': baseRisk = 4; break;
      case 'LOW': baseRisk = 1; break;
    }

    // Increase risk for production-like environments
    if (content.toLowerCase().includes('prod') || content.toLowerCase().includes('main')) {
      baseRisk += 2;
    }

    // Increase risk for blockchain-related keys
    if (content.toLowerCase().includes('eth') || content.toLowerCase().includes('bitcoin') || 
        content.toLowerCase().includes('wallet')) {
      baseRisk += 3;
    }

    return Math.min(baseRisk, 10);
  }

  /**
   * Check for secure storage practices
   */
  private checkSecureStorage(sourceFiles: ts.SourceFile[]): SecureStorageCheck[] {
    const checks: SecureStorageCheck[] = [];

    for (const sourceFile of sourceFiles) {
      const sourceText = sourceFile.getFullText();

      // Check for environment variable usage (good practice)
      const envVarMatches = sourceText.match(/process\.env\.[A-Z_]+/g);
      if (envVarMatches) {
        checks.push({
          location: sourceFile.fileName,
          isSecure: true,
          method: 'Environment Variables',
          recommendations: [
            'Ensure environment variables are properly secured',
            'Use .env files for development and secure systems for production',
            'Never commit .env files to version control'
          ]
        });
      }

      // Check for key management service usage
      const kmsPatterns = [
        /aws[_\s]*kms/gi,
        /azure[_\s]*key[_\s]*vault/gi,
        /google[_\s]*cloud[_\s]*kms/gi,
        /hashicorp[_\s]*vault/gi
      ];

      for (const pattern of kmsPatterns) {
        if (pattern.test(sourceText)) {
          checks.push({
            location: sourceFile.fileName,
            isSecure: true,
            method: 'Key Management Service',
            recommendations: [
              'Excellent use of managed key services',
              'Ensure proper IAM permissions are configured',
              'Regularly rotate keys and audit access'
            ]
          });
          break;
        }
      }

      // Check for insecure storage patterns
      const insecurePatterns = [
        /localStorage\.setItem.*(?:key|secret|password)/gi,
        /sessionStorage\.setItem.*(?:key|secret|password)/gi,
        /document\.cookie.*(?:key|secret|password)/gi
      ];

      for (const pattern of insecurePatterns) {
        if (pattern.test(sourceText)) {
          checks.push({
            location: sourceFile.fileName,
            isSecure: false,
            method: 'Browser Storage',
            recommendations: [
              'Avoid storing sensitive data in browser storage',
              'Use secure HTTP-only cookies for session management',
              'Consider server-side session storage'
            ]
          });
          break;
        }
      }
    }

    return checks;
  }

  /**
   * Audit private key handling and storage
   */
  async auditPrivateKeyHandling(): Promise<PrivateKeyAuditReport> {
    if (!this.program) {
      await this.initializeProgram();
    }

    if (!this.program) {
      throw new AuditError(
        'TypeScript program not initialized',
        'SECURITY',
        'HIGH',
        'Ensure TypeScript is properly configured'
      );
    }

    const sourceFiles = this.program.getSourceFiles().filter(
      file => !file.isDeclarationFile && !file.fileName.includes('node_modules')
    );

    // Scan for key exposures
    const exposures = await this.scanForKeyExposures(sourceFiles);

    // Check secure storage practices
    const storageChecks = this.checkSecureStorage(sourceFiles);

    // Calculate statistics
    const criticalExposures = exposures.filter(e => e.severity === 'CRITICAL').length;
    const highExposures = exposures.filter(e => e.severity === 'HIGH').length;
    const mediumExposures = exposures.filter(e => e.severity === 'MEDIUM').length;
    const lowExposures = exposures.filter(e => e.severity === 'LOW').length;

    const secureStorageCount = storageChecks.filter(c => c.isSecure).length;
    const insecureStorageCount = storageChecks.filter(c => !c.isSecure).length;

    // Determine overall risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (criticalExposures > 0) riskLevel = 'CRITICAL';
    else if (highExposures > 2) riskLevel = 'HIGH';
    else if (highExposures > 0 || mediumExposures > 3) riskLevel = 'MEDIUM';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (criticalExposures > 0) {
      recommendations.push(`URGENT: Remove ${criticalExposures} critical private key exposures immediately`);
    }
    if (highExposures > 0) {
      recommendations.push(`Address ${highExposures} high-risk private key exposures`);
    }
    if (insecureStorageCount > 0) {
      recommendations.push(`Improve ${insecureStorageCount} insecure storage implementations`);
    }
    if (exposures.some(e => e.type.includes('Console Log'))) {
      recommendations.push('Remove all console.log statements that may expose sensitive data');
    }
    if (exposures.some(e => e.type.includes('Hardcoded'))) {
      recommendations.push('Implement proper key management system for all hardcoded secrets');
    }
    if (secureStorageCount === 0 && exposures.length > 0) {
      recommendations.push('Implement secure key storage using environment variables or key management services');
    }

    // Security best practices
    const bestPractices = [
      'Use environment variables for all sensitive configuration',
      'Implement key rotation policies',
      'Use hardware security modules (HSMs) for production keys',
      'Never commit secrets to version control',
      'Implement proper access controls and audit logging',
      'Use managed key services (AWS KMS, Azure Key Vault, etc.)',
      'Encrypt sensitive data at rest and in transit',
      'Regularly scan code for exposed secrets'
    ];

    return {
      exposures,
      storageChecks,
      riskLevel,
      statistics: {
        totalExposures: exposures.length,
        criticalExposures,
        highExposures,
        mediumExposures,
        lowExposures,
        secureStorageCount,
        insecureStorageCount,
        filesScanned: sourceFiles.length
      },
      recommendations,
      bestPractices,
      timestamp: new Date()
    };
  }

  /**
   * Validate secure storage implementation
   */
  async validateSecureStorage(filePaths?: string[]): Promise<{
    secureImplementations: SecureStorageCheck[];
    insecureImplementations: SecureStorageCheck[];
    recommendations: string[];
  }> {
    if (!this.program) {
      await this.initializeProgram();
    }

    let sourceFiles = this.program!.getSourceFiles().filter(
      file => !file.isDeclarationFile && !file.fileName.includes('node_modules')
    );

    if (filePaths) {
      sourceFiles = sourceFiles.filter(file => 
        filePaths.some(path => file.fileName.includes(path))
      );
    }

    const storageChecks = this.checkSecureStorage(sourceFiles);
    
    const secureImplementations = storageChecks.filter(c => c.isSecure);
    const insecureImplementations = storageChecks.filter(c => !c.isSecure);

    const recommendations: string[] = [];
    
    if (insecureImplementations.length > 0) {
      recommendations.push(`Fix ${insecureImplementations.length} insecure storage implementations`);
      recommendations.push('Avoid storing sensitive data in browser storage');
      recommendations.push('Use secure server-side session management');
    }
    
    if (secureImplementations.length === 0) {
      recommendations.push('Implement secure key storage mechanisms');
      recommendations.push('Use environment variables or key management services');
    }

    return {
      secureImplementations,
      insecureImplementations,
      recommendations
    };
  }

  /**
   * Generate security recommendations based on findings
   */
  generateSecurityRecommendations(auditReport: PrivateKeyAuditReport): string[] {
    const recommendations: string[] = [];

    // Critical issues first
    if (auditReport.statistics.criticalExposures > 0) {
      recommendations.push('🚨 CRITICAL: Immediately remove all hardcoded private keys and secrets');
      recommendations.push('🚨 CRITICAL: Rotate all exposed keys and credentials');
      recommendations.push('🚨 CRITICAL: Audit all systems that may have been compromised');
    }

    // High priority issues
    if (auditReport.statistics.highExposures > 0) {
      recommendations.push('⚠️ HIGH: Move all API keys and secrets to environment variables');
      recommendations.push('⚠️ HIGH: Implement proper secret management system');
    }

    // General improvements
    if (auditReport.statistics.insecureStorageCount > 0) {
      recommendations.push('📋 Improve insecure storage implementations');
      recommendations.push('📋 Use secure HTTP-only cookies instead of browser storage');
    }

    // Best practices
    recommendations.push('✅ Implement automated secret scanning in CI/CD pipeline');
    recommendations.push('✅ Use managed key services (AWS KMS, Azure Key Vault, etc.)');
    recommendations.push('✅ Implement key rotation policies');
    recommendations.push('✅ Add .env files to .gitignore');
    recommendations.push('✅ Use pre-commit hooks to prevent secret commits');

    return recommendations;
  }
}