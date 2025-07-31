// Smart Contract Security Analysis Module

import * as ts from 'typescript';
import { ContractVulnerability, ContractSecurityReport } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import * as fs from 'fs/promises';

export interface ContractCall {
  file: string;
  line: number;
  method: string;
  contract: string;
  hasErrorHandling: boolean;
  hasGasLimit: boolean;
  hasValueCheck: boolean;
  isPayable: boolean;
}

export interface SecurityPattern {
  name: string;
  pattern: RegExp;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  recommendation: string;
}

export class SmartContractSecurityAnalyzer {
  private program: ts.Program | null = null;
  private securityPatterns: SecurityPattern[] = [];

  constructor() {
    this.initializeSecurityPatterns();
  }

  /**
   * Initialize security patterns for smart contract analysis
   */
  private initializeSecurityPatterns(): void {
    this.securityPatterns = [
      {
        name: 'Unchecked External Call',
        pattern: /\.call\s*\(|\.send\s*\(|\.transfer\s*\(/g,
        severity: 'HIGH',
        description: 'External calls without proper error handling',
        recommendation: 'Always check return values of external calls and handle failures'
      },
      {
        name: 'Reentrancy Vulnerability',
        pattern: /msg\.sender\.call|address\(.*\)\.call/g,
        severity: 'CRITICAL',
        description: 'Potential reentrancy attack vector',
        recommendation: 'Use checks-effects-interactions pattern and reentrancy guards'
      },
      {
        name: 'Integer Overflow/Underflow',
        pattern: /\+\+|\-\-|\+\s*=|\-\s*=|[\+\-\*\/]\s*(?!\/\/)/g,
        severity: 'MEDIUM',
        description: 'Arithmetic operations without overflow protection',
        recommendation: 'Use SafeMath library or Solidity 0.8+ built-in overflow checks'
      },
      {
        name: 'Unprotected Ether Withdrawal',
        pattern: /withdraw|transfer.*balance/gi,
        severity: 'HIGH',
        description: 'Ether withdrawal without proper access control',
        recommendation: 'Implement proper access control and withdrawal patterns'
      },
      {
        name: 'Hardcoded Gas Limit',
        pattern: /gas:\s*\d+/g,
        severity: 'MEDIUM',
        description: 'Hardcoded gas limits can cause failures',
        recommendation: 'Use dynamic gas estimation or reasonable gas limits'
      },
      {
        name: 'Timestamp Dependence',
        pattern: /block\.timestamp|now\s/g,
        severity: 'MEDIUM',
        description: 'Reliance on block timestamp for critical logic',
        recommendation: 'Avoid using timestamps for critical business logic'
      },
      {
        name: 'Uninitialized Storage Pointer',
        pattern: /storage\s+\w+(?!\s*=)/g,
        severity: 'HIGH',
        description: 'Uninitialized storage pointers can corrupt state',
        recommendation: 'Always initialize storage pointers explicitly'
      },
      {
        name: 'Delegatecall to Untrusted Contract',
        pattern: /delegatecall/g,
        severity: 'CRITICAL',
        description: 'Delegatecall can execute malicious code in current context',
        recommendation: 'Only use delegatecall with trusted contracts and proper validation'
      },
      {
        name: 'Private Data Exposure',
        pattern: /private\s+.*password|private\s+.*key|private\s+.*secret/gi,
        severity: 'CRITICAL',
        description: 'Private data stored on blockchain is publicly visible',
        recommendation: 'Never store sensitive data on blockchain, use encryption or off-chain storage'
      },
      {
        name: 'Insufficient Access Control',
        pattern: /onlyOwner|require\s*\(\s*msg\.sender/g,
        severity: 'MEDIUM',
        description: 'Functions may lack proper access control',
        recommendation: 'Implement comprehensive access control mechanisms'
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
   * Scan for smart contract vulnerabilities using pattern matching
   */
  private async scanWithPatterns(sourceFiles: ts.SourceFile[]): Promise<ContractVulnerability[]> {
    const vulnerabilities: ContractVulnerability[] = [];

    for (const sourceFile of sourceFiles) {
      const sourceText = sourceFile.getFullText();
      const lines = sourceText.split('\n');

      for (const pattern of this.securityPatterns) {
        let match;
        pattern.pattern.lastIndex = 0; // Reset regex state

        while ((match = pattern.pattern.exec(sourceText)) !== null) {
          const position = sourceFile.getLineAndCharacterOfPosition(match.index);
          
          vulnerabilities.push({
            type: pattern.name,
            severity: pattern.severity,
            file: sourceFile.fileName,
            line: position.line + 1,
            column: position.character + 1,
            description: pattern.description,
            recommendation: pattern.recommendation,
            code: lines[position.line]?.trim() || '',
            riskScore: this.calculateRiskScore(pattern.severity)
          });
        }
      }
    }

    return vulnerabilities;
  }

  /**
   * Analyze contract calls for proper error handling
   */
  private analyzeContractCalls(sourceFiles: ts.SourceFile[]): ContractCall[] {
    const contractCalls: ContractCall[] = [];

    for (const sourceFile of sourceFiles) {
      const visit = (node: ts.Node) => {
        // Look for contract method calls
        if (ts.isCallExpression(node)) {
          const callInfo = this.extractCallInfo(node, sourceFile);
          if (callInfo) {
            contractCalls.push(callInfo);
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    return contractCalls;
  }

  /**
   * Extract contract call information
   */
  private extractCallInfo(node: ts.CallExpression, sourceFile: ts.SourceFile): ContractCall | null {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    
    // Check if this looks like a contract call
    if (ts.isPropertyAccessExpression(node.expression)) {
      const methodName = node.expression.name.text;
      const objectExpression = node.expression.expression;
      
      // Look for common contract interaction patterns
      const contractMethods = ['call', 'send', 'transfer', 'delegatecall', 'staticcall'];
      const isContractCall = contractMethods.includes(methodName) || 
                           methodName.includes('Contract') ||
                           this.looksLikeContractMethod(methodName);

      if (isContractCall) {
        const hasErrorHandling = this.hasErrorHandling(node);
        const hasGasLimit = this.hasGasLimit(node);
        const hasValueCheck = this.hasValueCheck(node);
        const isPayable = this.isPayableCall(node);

        return {
          file: sourceFile.fileName,
          line: line + 1,
          method: methodName,
          contract: this.extractContractName(objectExpression),
          hasErrorHandling,
          hasGasLimit,
          hasValueCheck,
          isPayable
        };
      }
    }

    return null;
  }

  /**
   * Check if method name looks like a contract method
   */
  private looksLikeContractMethod(methodName: string): boolean {
    const contractPatterns = [
      /^[a-z][a-zA-Z]*Contract$/,
      /^interact/i,
      /^execute/i,
      /^invoke/i
    ];

    return contractPatterns.some(pattern => pattern.test(methodName));
  }

  /**
   * Check if contract call has proper error handling
   */
  private hasErrorHandling(node: ts.CallExpression): boolean {
    let parent = node.parent;
    
    // Look for try-catch blocks
    while (parent) {
      if (ts.isTryStatement(parent)) {
        return true;
      }
      
      // Look for .catch() calls
      if (ts.isCallExpression(parent) && 
          ts.isPropertyAccessExpression(parent.expression) &&
          parent.expression.name.text === 'catch') {
        return true;
      }

      // Look for await with error handling
      if (ts.isAwaitExpression(parent) && 
          ts.isVariableDeclaration(parent.parent) &&
          this.hasSubsequentErrorCheck(parent.parent)) {
        return true;
      }

      parent = parent.parent;
    }

    return false;
  }

  /**
   * Check for subsequent error checking after variable declaration
   */
  private hasSubsequentErrorCheck(node: ts.VariableDeclaration): boolean {
    // This is a simplified check - in a real implementation,
    // we'd need more sophisticated control flow analysis
    return false;
  }

  /**
   * Check if call has gas limit specified
   */
  private hasGasLimit(node: ts.CallExpression): boolean {
    // Look for gas parameter in arguments
    return node.arguments.some(arg => {
      if (ts.isObjectLiteralExpression(arg)) {
        return arg.properties.some(prop => 
          ts.isPropertyAssignment(prop) &&
          ts.isIdentifier(prop.name) &&
          prop.name.text === 'gas'
        );
      }
      return false;
    });
  }

  /**
   * Check if call has value checking
   */
  private hasValueCheck(node: ts.CallExpression): boolean {
    // Look for value parameter or balance checks
    return node.arguments.some(arg => {
      if (ts.isObjectLiteralExpression(arg)) {
        return arg.properties.some(prop => 
          ts.isPropertyAssignment(prop) &&
          ts.isIdentifier(prop.name) &&
          (prop.name.text === 'value' || prop.name.text === 'amount')
        );
      }
      return false;
    });
  }

  /**
   * Check if this is a payable call
   */
  private isPayableCall(node: ts.CallExpression): boolean {
    return this.hasValueCheck(node) || 
           node.arguments.some(arg => 
             ts.isStringLiteral(arg) && arg.text.includes('payable')
           );
  }

  /**
   * Extract contract name from expression
   */
  private extractContractName(expression: ts.Expression): string {
    if (ts.isIdentifier(expression)) {
      return expression.text;
    }
    if (ts.isPropertyAccessExpression(expression) && expression.expression) {
      return this.extractContractName(expression.expression);
    }
    return '<unknown>';
  }

  /**
   * Calculate risk score based on severity
   */
  private calculateRiskScore(severity: string): number {
    switch (severity) {
      case 'CRITICAL': return 10;
      case 'HIGH': return 7;
      case 'MEDIUM': return 4;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  /**
   * Scan smart contracts for security vulnerabilities
   */
  async scanSmartContracts(): Promise<ContractSecurityReport> {
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
      file => !file.isDeclarationFile && 
              !file.fileName.includes('node_modules') &&
              (file.fileName.includes('contract') || 
               file.fileName.includes('blockchain') ||
               file.fileName.includes('web3'))
    );

    // Scan for vulnerabilities using patterns
    const vulnerabilities = await this.scanWithPatterns(sourceFiles);
    
    // Analyze contract calls
    const contractCalls = this.analyzeContractCalls(sourceFiles);

    // Add vulnerabilities for improper contract calls
    for (const call of contractCalls) {
      if (!call.hasErrorHandling) {
        vulnerabilities.push({
          type: 'Missing Error Handling',
          severity: 'HIGH',
          file: call.file,
          line: call.line,
          column: 1,
          description: `Contract call to ${call.method} lacks proper error handling`,
          recommendation: 'Add try-catch blocks or .catch() handlers for contract calls',
          code: `${call.contract}.${call.method}()`,
          riskScore: 7
        });
      }

      if (call.isPayable && !call.hasValueCheck) {
        vulnerabilities.push({
          type: 'Unchecked Value Transfer',
          severity: 'MEDIUM',
          file: call.file,
          line: call.line,
          column: 1,
          description: 'Payable contract call without value validation',
          recommendation: 'Validate transfer amounts and check balances before transactions',
          code: `${call.contract}.${call.method}()`,
          riskScore: 4
        });
      }
    }

    // Calculate statistics
    const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'LOW').length;

    const totalRiskScore = vulnerabilities.reduce((sum, v) => sum + v.riskScore, 0);
    const averageRiskScore = vulnerabilities.length > 0 ? totalRiskScore / vulnerabilities.length : 0;

    // Determine overall risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (criticalCount > 0) riskLevel = 'CRITICAL';
    else if (highCount > 2) riskLevel = 'HIGH';
    else if (highCount > 0 || mediumCount > 5) riskLevel = 'MEDIUM';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (criticalCount > 0) {
      recommendations.push(`Address ${criticalCount} critical security vulnerabilities immediately`);
    }
    if (highCount > 0) {
      recommendations.push(`Fix ${highCount} high-severity security issues`);
    }
    if (contractCalls.filter(c => !c.hasErrorHandling).length > 0) {
      recommendations.push('Implement proper error handling for all contract interactions');
    }
    if (vulnerabilities.some(v => v.type.includes('Reentrancy'))) {
      recommendations.push('Implement reentrancy guards and follow checks-effects-interactions pattern');
    }
    if (vulnerabilities.some(v => v.type.includes('Access Control'))) {
      recommendations.push('Review and strengthen access control mechanisms');
    }

    return {
      vulnerabilities,
      contractCalls,
      riskLevel,
      totalVulnerabilities: vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      recommendations,
      scannedFiles: sourceFiles.length,
      timestamp: new Date()
    };
  }

  /**
   * Validate contract interaction security
   */
  async validateContractInteractions(filePaths?: string[]): Promise<{
    secureInteractions: number;
    insecureInteractions: number;
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

    const contractCalls = this.analyzeContractCalls(sourceFiles);
    
    const secureInteractions = contractCalls.filter(call => 
      call.hasErrorHandling && (call.isPayable ? call.hasValueCheck : true)
    ).length;

    const insecureInteractions = contractCalls.length - secureInteractions;

    const recommendations: string[] = [];
    
    if (insecureInteractions > 0) {
      recommendations.push(`Secure ${insecureInteractions} contract interactions`);
      recommendations.push('Add error handling to all contract calls');
      recommendations.push('Validate all value transfers and balance checks');
    }

    return {
      secureInteractions,
      insecureInteractions,
      recommendations
    };
  }
}