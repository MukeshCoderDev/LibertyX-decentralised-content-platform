// Code Complexity Analysis Module

import * as ts from 'typescript';
import { ComplexityViolation } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  functionLength: number;
  nestingLevel: number;
  parameterCount: number;
  cognitiveComplexity: number;
}

export interface FunctionComplexity {
  name: string;
  file: string;
  line: number;
  metrics: ComplexityMetrics;
  violations: string[];
}

export interface ComplexityReport {
  functions: FunctionComplexity[];
  violations: ComplexityViolation[];
  averageComplexity: number;
  maxComplexity: number;
  totalFunctions: number;
  violatingFunctions: number;
  score: number;
  recommendations: string[];
}

export class ComplexityAnalyzer {
  private program: ts.Program | null = null;
  private maxComplexity: number;
  private maxFunctionLength: number;
  private maxNestingLevel: number;
  private maxParameters: number;

  constructor(
    maxComplexity: number = 10,
    maxFunctionLength: number = 50,
    maxNestingLevel: number = 3,
    maxParameters: number = 5
  ) {
    this.maxComplexity = maxComplexity;
    this.maxFunctionLength = maxFunctionLength;
    this.maxNestingLevel = maxNestingLevel;
    this.maxParameters = maxParameters;
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
          'CODE_QUALITY',
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
          'CODE_QUALITY',
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
        'CODE_QUALITY',
        'HIGH',
        'Check TypeScript installation and configuration'
      );
    }
  }

  /**
   * Calculate cyclomatic complexity for a function
   */
  private calculateCyclomaticComplexity(node: ts.FunctionLikeDeclaration): number {
    let complexity = 1; // Base complexity

    const visit = (node: ts.Node) => {
      switch (node.kind) {
        case ts.SyntaxKind.IfStatement:
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.DoStatement:
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
        case ts.SyntaxKind.SwitchStatement:
        case ts.SyntaxKind.CatchClause:
        case ts.SyntaxKind.ConditionalExpression:
          complexity++;
          break;
        case ts.SyntaxKind.CaseClause:
          // Don't count default case
          if ((node as ts.CaseClause).expression) {
            complexity++;
          }
          break;
        case ts.SyntaxKind.BinaryExpression:
          const binaryExpr = node as ts.BinaryExpression;
          if (binaryExpr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
              binaryExpr.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
            complexity++;
          }
          break;
      }

      ts.forEachChild(node, visit);
    };

    if (node.body) {
      visit(node.body);
    }

    return complexity;
  }

  /**
   * Calculate cognitive complexity (more human-readable complexity metric)
   */
  private calculateCognitiveComplexity(node: ts.FunctionLikeDeclaration): number {
    let complexity = 0;
    let nestingLevel = 0;

    const visit = (node: ts.Node, isNested: boolean = false) => {
      const increment = isNested ? nestingLevel + 1 : 1;

      switch (node.kind) {
        case ts.SyntaxKind.IfStatement:
          complexity += increment;
          nestingLevel++;
          ts.forEachChild(node, (child) => visit(child, true));
          nestingLevel--;
          return;
        
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.DoStatement:
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
          complexity += increment;
          nestingLevel++;
          ts.forEachChild(node, (child) => visit(child, true));
          nestingLevel--;
          return;

        case ts.SyntaxKind.SwitchStatement:
          complexity += increment;
          break;

        case ts.SyntaxKind.CatchClause:
          complexity += increment;
          break;

        case ts.SyntaxKind.ConditionalExpression:
          complexity += increment;
          break;

        case ts.SyntaxKind.BinaryExpression:
          const binaryExpr = node as ts.BinaryExpression;
          if (binaryExpr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
              binaryExpr.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
            complexity += 1;
          }
          break;
      }

      ts.forEachChild(node, (child) => visit(child, isNested));
    };

    if (node.body) {
      visit(node.body);
    }

    return complexity;
  }

  /**
   * Calculate function length in lines
   */
  private calculateFunctionLength(node: ts.FunctionLikeDeclaration, sourceFile: ts.SourceFile): number {
    if (!node.body) return 0;

    const start = sourceFile.getLineAndCharacterOfPosition(node.body.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.body.getEnd());
    
    return end.line - start.line + 1;
  }

  /**
   * Calculate maximum nesting level in a function
   */
  private calculateNestingLevel(node: ts.FunctionLikeDeclaration): number {
    let maxNesting = 0;
    let currentNesting = 0;

    const visit = (node: ts.Node) => {
      const isNestingNode = 
        ts.isIfStatement(node) ||
        ts.isWhileStatement(node) ||
        ts.isDoStatement(node) ||
        ts.isForStatement(node) ||
        ts.isForInStatement(node) ||
        ts.isForOfStatement(node) ||
        ts.isSwitchStatement(node) ||
        ts.isTryStatement(node) ||
        ts.isBlock(node);

      if (isNestingNode) {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      }

      ts.forEachChild(node, visit);

      if (isNestingNode) {
        currentNesting--;
      }
    };

    if (node.body) {
      visit(node.body);
    }

    return maxNesting;
  }

  /**
   * Get parameter count for a function
   */
  private getParameterCount(node: ts.FunctionLikeDeclaration): number {
    return node.parameters.length;
  }

  /**
   * Get function name
   */
  private getFunctionName(node: ts.FunctionLikeDeclaration): string {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    }
    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
      return node.name.text;
    }
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      // Try to get name from variable declaration
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
      }
      if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
      }
      return '<anonymous>';
    }
    return '<unknown>';
  }

  /**
   * Analyze complexity for all functions in the codebase
   */
  async analyzeComplexity(): Promise<ComplexityReport> {
    if (!this.program) {
      await this.initializeProgram();
    }

    if (!this.program) {
      throw new AuditError(
        'TypeScript program not initialized',
        'CODE_QUALITY',
        'HIGH',
        'Ensure TypeScript is properly configured'
      );
    }

    const functions: FunctionComplexity[] = [];
    const violations: ComplexityViolation[] = [];
    const sourceFiles = this.program.getSourceFiles().filter(
      file => !file.isDeclarationFile && !file.fileName.includes('node_modules')
    );

    for (const sourceFile of sourceFiles) {
      const visit = (node: ts.Node) => {
        if (ts.isFunctionDeclaration(node) || 
            ts.isMethodDeclaration(node) || 
            ts.isArrowFunction(node) || 
            ts.isFunctionExpression(node)) {
          
          const functionNode = node as ts.FunctionLikeDeclaration;
          const functionName = this.getFunctionName(functionNode);
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

          const metrics: ComplexityMetrics = {
            cyclomaticComplexity: this.calculateCyclomaticComplexity(functionNode),
            functionLength: this.calculateFunctionLength(functionNode, sourceFile),
            nestingLevel: this.calculateNestingLevel(functionNode),
            parameterCount: this.getParameterCount(functionNode),
            cognitiveComplexity: this.calculateCognitiveComplexity(functionNode)
          };

          const functionViolations: string[] = [];

          // Check for violations
          if (metrics.cyclomaticComplexity > this.maxComplexity) {
            functionViolations.push(`Cyclomatic complexity (${metrics.cyclomaticComplexity}) exceeds limit (${this.maxComplexity})`);
            violations.push({
              file: sourceFile.fileName,
              line: line + 1,
              column: 1,
              type: 'complexity',
              message: `Function '${functionName}' has cyclomatic complexity of ${metrics.cyclomaticComplexity}`,
              severity: metrics.cyclomaticComplexity > this.maxComplexity * 2 ? 'high' : 'medium',
              actualValue: metrics.cyclomaticComplexity,
              expectedValue: this.maxComplexity
            });
          }

          if (metrics.functionLength > this.maxFunctionLength) {
            functionViolations.push(`Function length (${metrics.functionLength}) exceeds limit (${this.maxFunctionLength})`);
            violations.push({
              file: sourceFile.fileName,
              line: line + 1,
              column: 1,
              type: 'length',
              message: `Function '${functionName}' has ${metrics.functionLength} lines`,
              severity: metrics.functionLength > this.maxFunctionLength * 2 ? 'high' : 'medium',
              actualValue: metrics.functionLength,
              expectedValue: this.maxFunctionLength
            });
          }

          if (metrics.nestingLevel > this.maxNestingLevel) {
            functionViolations.push(`Nesting level (${metrics.nestingLevel}) exceeds limit (${this.maxNestingLevel})`);
            violations.push({
              file: sourceFile.fileName,
              line: line + 1,
              column: 1,
              type: 'nesting',
              message: `Function '${functionName}' has nesting level of ${metrics.nestingLevel}`,
              severity: metrics.nestingLevel > this.maxNestingLevel * 2 ? 'high' : 'medium',
              actualValue: metrics.nestingLevel,
              expectedValue: this.maxNestingLevel
            });
          }

          if (metrics.parameterCount > this.maxParameters) {
            functionViolations.push(`Parameter count (${metrics.parameterCount}) exceeds limit (${this.maxParameters})`);
            violations.push({
              file: sourceFile.fileName,
              line: line + 1,
              column: 1,
              type: 'parameters',
              message: `Function '${functionName}' has ${metrics.parameterCount} parameters`,
              severity: metrics.parameterCount > this.maxParameters * 2 ? 'high' : 'medium',
              actualValue: metrics.parameterCount,
              expectedValue: this.maxParameters
            });
          }

          functions.push({
            name: functionName,
            file: sourceFile.fileName,
            line: line + 1,
            metrics,
            violations: functionViolations
          });
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    // Calculate statistics
    const totalFunctions = functions.length;
    const violatingFunctions = functions.filter(f => f.violations.length > 0).length;
    const averageComplexity = totalFunctions > 0 
      ? functions.reduce((sum, f) => sum + f.metrics.cyclomaticComplexity, 0) / totalFunctions 
      : 0;
    const maxComplexity = totalFunctions > 0 
      ? Math.max(...functions.map(f => f.metrics.cyclomaticComplexity)) 
      : 0;

    // Calculate score
    let score = 100;
    score -= violations.filter(v => v.severity === 'high').length * 10;
    score -= violations.filter(v => v.severity === 'medium').length * 5;
    score -= violations.filter(v => v.severity === 'low').length * 2;

    if (averageComplexity > this.maxComplexity) {
      score -= (averageComplexity - this.maxComplexity) * 2;
    }

    score = Math.max(0, Math.min(100, score));

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (violatingFunctions > 0) {
      recommendations.push(`${violatingFunctions} functions exceed complexity thresholds`);
    }
    
    if (averageComplexity > this.maxComplexity) {
      recommendations.push(`Average complexity (${averageComplexity.toFixed(1)}) exceeds recommended limit (${this.maxComplexity})`);
    }
    
    if (maxComplexity > this.maxComplexity * 2) {
      recommendations.push(`Consider breaking down the most complex function (complexity: ${maxComplexity})`);
    }

    const highComplexityFunctions = functions.filter(f => f.metrics.cyclomaticComplexity > this.maxComplexity * 1.5);
    if (highComplexityFunctions.length > 0) {
      recommendations.push(`${highComplexityFunctions.length} functions have very high complexity and should be refactored`);
    }

    return {
      functions,
      violations,
      averageComplexity: Math.round(averageComplexity * 100) / 100,
      maxComplexity,
      totalFunctions,
      violatingFunctions,
      score: Math.round(score),
      recommendations
    };
  }

  /**
   * Analyze complexity for specific files
   */
  async analyzeFiles(filePaths: string[]): Promise<ComplexityReport> {
    // Filter the program to only include specified files
    const originalProgram = this.program;
    
    try {
      // Create a new program with only the specified files
      const configFile = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
      if (!configFile) {
        throw new AuditError('TypeScript config file not found', 'CODE_QUALITY', 'HIGH', 'Create tsconfig.json');
      }

      const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
      const { options } = ts.parseJsonConfigFileContent(config, ts.sys, './');
      
      this.program = ts.createProgram(filePaths, options);
      
      return await this.analyzeComplexity();
    } finally {
      this.program = originalProgram;
    }
  }
}