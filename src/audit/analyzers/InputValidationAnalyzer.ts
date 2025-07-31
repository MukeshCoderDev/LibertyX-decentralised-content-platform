// Input Validation Security Analysis Module

import * as ts from 'typescript';
import { ValidationIssue, InputValidationReport } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';

export interface InputSource {
  type: 'user_input' | 'url_param' | 'form_data' | 'api_request' | 'file_upload' | 'query_param';
  location: string;
  variable: string;
  file: string;
  line: number;
  isValidated: boolean;
  isSanitized: boolean;
  validationMethods: string[];
  sanitizationMethods: string[];
}

export interface SecurityVulnerability {
  type: 'XSS' | 'SQL_INJECTION' | 'COMMAND_INJECTION' | 'PATH_TRAVERSAL' | 'LDAP_INJECTION' | 'NOSQL_INJECTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  file: string;
  line: number;
  code: string;
  recommendation: string;
}

export class InputValidationAnalyzer {
  private program: ts.Program | null = null;
  private inputSources: InputSource[] = [];
  private vulnerabilities: SecurityVulnerability[] = [];

  // Common validation patterns
  private validationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/.+/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    numeric: /^\d+$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  };

  // Dangerous patterns that indicate potential vulnerabilities
  private dangerousPatterns = [
    {
      name: 'XSS',
      patterns: [
        /innerHTML\s*=\s*[^;]+(?!\.replace|\.escape|\.sanitize)/g,
        /outerHTML\s*=\s*[^;]+(?!\.replace|\.escape|\.sanitize)/g,
        /document\.write\s*\([^)]*[^)]*\)/g,
        /eval\s*\([^)]*\)/g,
        /Function\s*\([^)]*\)/g,
        /setTimeout\s*\(\s*[^,)]*[^,)]*,/g,
        /setInterval\s*\(\s*[^,)]*[^,)]*,/g
      ],
      severity: 'HIGH' as const,
      description: 'Potential Cross-Site Scripting (XSS) vulnerability',
      recommendation: 'Sanitize user input before rendering in DOM or use safe DOM manipulation methods'
    },
    {
      name: 'SQL_INJECTION',
      patterns: [
        /query\s*\(\s*[^)]*\+[^)]*\)/g,
        /execute\s*\(\s*[^)]*\+[^)]*\)/g,
        /SELECT\s+.*\+.*FROM/gi,
        /INSERT\s+.*\+.*INTO/gi,
        /UPDATE\s+.*\+.*SET/gi,
        /DELETE\s+.*\+.*FROM/gi
      ],
      severity: 'CRITICAL' as const,
      description: 'Potential SQL Injection vulnerability',
      recommendation: 'Use parameterized queries or prepared statements instead of string concatenation'
    },
    {
      name: 'COMMAND_INJECTION',
      patterns: [
        /exec\s*\([^)]*\+[^)]*\)/g,
        /spawn\s*\([^)]*\+[^)]*\)/g,
        /system\s*\([^)]*\+[^)]*\)/g,
        /shell_exec\s*\([^)]*\+[^)]*\)/g
      ],
      severity: 'CRITICAL' as const,
      description: 'Potential Command Injection vulnerability',
      recommendation: 'Validate and sanitize input before executing system commands, or use safe alternatives'
    },
    {
      name: 'PATH_TRAVERSAL',
      patterns: [
        /readFile\s*\([^)]*\.\.[^)]*\)/g,
        /writeFile\s*\([^)]*\.\.[^)]*\)/g,
        /require\s*\([^)]*\+[^)]*\)/g,
        /import\s*\([^)]*\+[^)]*\)/g
      ],
      severity: 'HIGH' as const,
      description: 'Potential Path Traversal vulnerability',
      recommendation: 'Validate file paths and restrict access to allowed directories'
    },
    {
      name: 'NOSQL_INJECTION',
      patterns: [
        /find\s*\(\s*\{[^}]*\$[^}]*\}\s*\)/g,
        /findOne\s*\(\s*\{[^}]*\$[^}]*\}\s*\)/g,
        /update\s*\(\s*\{[^}]*\$[^}]*\}\s*\)/g,
        /remove\s*\(\s*\{[^}]*\$[^}]*\}\s*\)/g
      ],
      severity: 'HIGH' as const,
      description: 'Potential NoSQL Injection vulnerability',
      recommendation: 'Validate and sanitize input before using in database queries'
    }
  ];

  // Common validation and sanitization methods
  private validationMethods = [
    'validate', 'isValid', 'check', 'verify', 'test', 'match',
    'isEmail', 'isURL', 'isNumeric', 'isAlphanumeric', 'isLength',
    'trim', 'escape', 'sanitize', 'clean', 'filter', 'normalize'
  ];

  private sanitizationMethods = [
    'escape', 'sanitize', 'clean', 'filter', 'normalize', 'encode',
    'htmlEscape', 'sqlEscape', 'trim', 'replace', 'removeHTML',
    'stripTags', 'encodeURIComponent', 'encodeHTML'
  ];

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
   * Identify input sources in the codebase
   */
  private identifyInputSources(sourceFiles: ts.SourceFile[]): void {
    this.inputSources = [];

    for (const sourceFile of sourceFiles) {
      const visit = (node: ts.Node) => {
        // Look for common input sources
        if (ts.isPropertyAccessExpression(node)) {
          const inputSource = this.analyzePropertyAccess(node, sourceFile);
          if (inputSource) {
            this.inputSources.push(inputSource);
          }
        }

        // Look for function parameters that might be user input
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
          this.analyzeFunctionParameters(node, sourceFile);
        }

        // Look for variable assignments from input sources
        if (ts.isVariableDeclaration(node)) {
          const inputSource = this.analyzeVariableDeclaration(node, sourceFile);
          if (inputSource) {
            this.inputSources.push(inputSource);
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }
  }

  /**
   * Analyze property access expressions for input sources
   */
  private analyzePropertyAccess(node: ts.PropertyAccessExpression, sourceFile: ts.SourceFile): InputSource | null {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const text = node.getText();

    // Common input source patterns
    const inputPatterns = [
      { pattern: /req\.body/, type: 'api_request' as const },
      { pattern: /req\.params/, type: 'url_param' as const },
      { pattern: /req\.query/, type: 'query_param' as const },
      { pattern: /req\.files/, type: 'file_upload' as const },
      { pattern: /window\.location/, type: 'url_param' as const },
      { pattern: /document\.cookie/, type: 'user_input' as const },
      { pattern: /localStorage\.getItem/, type: 'user_input' as const },
      { pattern: /sessionStorage\.getItem/, type: 'user_input' as const },
      { pattern: /form\.get/, type: 'form_data' as const },
      { pattern: /formData\.get/, type: 'form_data' as const }
    ];

    for (const { pattern, type } of inputPatterns) {
      if (pattern.test(text)) {
        return {
          type,
          location: text,
          variable: this.extractVariableName(node),
          file: sourceFile.fileName,
          line: line + 1,
          isValidated: false,
          isSanitized: false,
          validationMethods: [],
          sanitizationMethods: []
        };
      }
    }

    return null;
  }

  /**
   * Analyze function parameters for potential input sources
   */
  private analyzeFunctionParameters(node: ts.FunctionLikeDeclaration, sourceFile: ts.SourceFile): void {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

    for (const param of node.parameters) {
      if (ts.isIdentifier(param.name)) {
        const paramName = param.name.text;
        
        // Check if parameter name suggests user input
        const inputParamPatterns = [
          'input', 'data', 'body', 'params', 'query', 'form', 'request',
          'userInput', 'userData', 'payload', 'content', 'value'
        ];

        if (inputParamPatterns.some(pattern => 
          paramName.toLowerCase().includes(pattern.toLowerCase())
        )) {
          this.inputSources.push({
            type: 'user_input',
            location: `function parameter: ${paramName}`,
            variable: paramName,
            file: sourceFile.fileName,
            line: line + 1,
            isValidated: false,
            isSanitized: false,
            validationMethods: [],
            sanitizationMethods: []
          });
        }
      }
    }
  }

  /**
   * Analyze variable declarations for input sources
   */
  private analyzeVariableDeclaration(node: ts.VariableDeclaration, sourceFile: ts.SourceFile): InputSource | null {
    if (!node.initializer || !ts.isIdentifier(node.name)) {
      return null;
    }

    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const variableName = node.name.text;
    const initializerText = node.initializer.getText();

    // Check if initialized from an input source
    const inputPatterns = [
      'req.body', 'req.params', 'req.query', 'req.files',
      'window.location', 'document.cookie', 'localStorage',
      'sessionStorage', 'form.get', 'formData.get'
    ];

    for (const pattern of inputPatterns) {
      if (initializerText.includes(pattern)) {
        return {
          type: this.determineInputType(pattern),
          location: initializerText,
          variable: variableName,
          file: sourceFile.fileName,
          line: line + 1,
          isValidated: false,
          isSanitized: false,
          validationMethods: [],
          sanitizationMethods: []
        };
      }
    }

    return null;
  }

  /**
   * Determine input type from pattern
   */
  private determineInputType(pattern: string): InputSource['type'] {
    if (pattern.includes('body')) return 'api_request';
    if (pattern.includes('params')) return 'url_param';
    if (pattern.includes('query')) return 'query_param';
    if (pattern.includes('files')) return 'file_upload';
    if (pattern.includes('form')) return 'form_data';
    return 'user_input';
  }

  /**
   * Extract variable name from property access
   */
  private extractVariableName(node: ts.PropertyAccessExpression): string {
    if (ts.isIdentifier(node.name)) {
      return node.name.text;
    }
    return '<unknown>';
  }

  /**
   * Analyze validation and sanitization of input sources
   */
  private analyzeValidationAndSanitization(sourceFiles: ts.SourceFile[]): void {
    for (const sourceFile of sourceFiles) {
      const sourceText = sourceFile.getFullText();
      
      // Check each input source for validation/sanitization
      for (const inputSource of this.inputSources) {
        if (inputSource.file === sourceFile.fileName) {
          this.checkValidationMethods(inputSource, sourceText);
          this.checkSanitizationMethods(inputSource, sourceText);
        }
      }
    }
  }

  /**
   * Check for validation methods applied to input
   */
  private checkValidationMethods(inputSource: InputSource, sourceText: string): void {
    const variableName = inputSource.variable;
    
    for (const method of this.validationMethods) {
      const patterns = [
        new RegExp(`${variableName}\\.${method}\\(`, 'g'),
        new RegExp(`${method}\\(${variableName}`, 'g'),
        new RegExp(`validate\\(.*${variableName}`, 'g')
      ];

      for (const pattern of patterns) {
        if (pattern.test(sourceText)) {
          inputSource.validationMethods.push(method);
          inputSource.isValidated = true;
        }
      }
    }
  }

  /**
   * Check for sanitization methods applied to input
   */
  private checkSanitizationMethods(inputSource: InputSource, sourceText: string): void {
    const variableName = inputSource.variable;
    
    for (const method of this.sanitizationMethods) {
      const patterns = [
        new RegExp(`${variableName}\\.${method}\\(`, 'g'),
        new RegExp(`${method}\\(${variableName}`, 'g'),
        new RegExp(`sanitize\\(.*${variableName}`, 'g')
      ];

      for (const pattern of patterns) {
        if (pattern.test(sourceText)) {
          inputSource.sanitizationMethods.push(method);
          inputSource.isSanitized = true;
        }
      }
    }
  }

  /**
   * Scan for security vulnerabilities
   */
  private scanForVulnerabilities(sourceFiles: ts.SourceFile[]): void {
    this.vulnerabilities = [];

    for (const sourceFile of sourceFiles) {
      const sourceText = sourceFile.getFullText();
      const lines = sourceText.split('\n');

      for (const dangerousPattern of this.dangerousPatterns) {
        for (const pattern of dangerousPattern.patterns) {
          let match;
          pattern.lastIndex = 0; // Reset regex state

          while ((match = pattern.exec(sourceText)) !== null) {
            const position = sourceFile.getLineAndCharacterOfPosition(match.index);
            
            this.vulnerabilities.push({
              type: dangerousPattern.name as SecurityVulnerability['type'],
              severity: dangerousPattern.severity,
              description: dangerousPattern.description,
              file: sourceFile.fileName,
              line: position.line + 1,
              code: lines[position.line]?.trim() || '',
              recommendation: dangerousPattern.recommendation
            });
          }
        }
      }
    }
  }

  /**
   * Validate input sanitization across the codebase
   */
  async validateInputSanitization(): Promise<InputValidationReport> {
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

    // Identify input sources
    this.identifyInputSources(sourceFiles);

    // Analyze validation and sanitization
    this.analyzeValidationAndSanitization(sourceFiles);

    // Scan for vulnerabilities
    this.scanForVulnerabilities(sourceFiles);

    // Generate validation issues
    const validationIssues: ValidationIssue[] = [];

    // Add issues for unvalidated inputs
    for (const inputSource of this.inputSources) {
      if (!inputSource.isValidated) {
        validationIssues.push({
          type: 'missing_validation',
          severity: 'MEDIUM',
          file: inputSource.file,
          line: inputSource.line,
          column: 1,
          message: `Input '${inputSource.variable}' from ${inputSource.type} is not validated`,
          inputSource: inputSource.location,
          recommendation: 'Add input validation to prevent malicious data processing'
        });
      }

      if (!inputSource.isSanitized && inputSource.type !== 'file_upload') {
        validationIssues.push({
          type: 'missing_sanitization',
          severity: 'HIGH',
          file: inputSource.file,
          line: inputSource.line,
          column: 1,
          message: `Input '${inputSource.variable}' from ${inputSource.type} is not sanitized`,
          inputSource: inputSource.location,
          recommendation: 'Add input sanitization to prevent XSS and injection attacks'
        });
      }
    }

    // Add issues for detected vulnerabilities
    for (const vulnerability of this.vulnerabilities) {
      validationIssues.push({
        type: 'security_vulnerability',
        severity: vulnerability.severity,
        file: vulnerability.file,
        line: vulnerability.line,
        column: 1,
        message: `${vulnerability.type}: ${vulnerability.description}`,
        inputSource: vulnerability.code,
        recommendation: vulnerability.recommendation
      });
    }

    // Calculate statistics
    const totalInputs = this.inputSources.length;
    const validatedInputs = this.inputSources.filter(i => i.isValidated).length;
    const sanitizedInputs = this.inputSources.filter(i => i.isSanitized).length;
    const criticalIssues = validationIssues.filter(i => i.severity === 'CRITICAL').length;
    const highIssues = validationIssues.filter(i => i.severity === 'HIGH').length;

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (criticalIssues > 0) riskLevel = 'CRITICAL';
    else if (highIssues > 3) riskLevel = 'HIGH';
    else if (highIssues > 0 || (totalInputs > 0 && sanitizedInputs / totalInputs < 0.5)) riskLevel = 'MEDIUM';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (totalInputs - validatedInputs > 0) {
      recommendations.push(`Add validation to ${totalInputs - validatedInputs} unvalidated inputs`);
    }
    if (totalInputs - sanitizedInputs > 0) {
      recommendations.push(`Add sanitization to ${totalInputs - sanitizedInputs} unsanitized inputs`);
    }
    if (criticalIssues > 0) {
      recommendations.push(`Address ${criticalIssues} critical security vulnerabilities immediately`);
    }
    if (this.vulnerabilities.some(v => v.type === 'XSS')) {
      recommendations.push('Implement XSS protection by sanitizing user input before DOM manipulation');
    }
    if (this.vulnerabilities.some(v => v.type === 'SQL_INJECTION')) {
      recommendations.push('Use parameterized queries to prevent SQL injection attacks');
    }

    return {
      inputSources: this.inputSources,
      validationIssues,
      vulnerabilities: this.vulnerabilities,
      riskLevel,
      statistics: {
        totalInputs,
        validatedInputs,
        sanitizedInputs,
        validationCoverage: totalInputs > 0 ? (validatedInputs / totalInputs) * 100 : 100,
        sanitizationCoverage: totalInputs > 0 ? (sanitizedInputs / totalInputs) * 100 : 100
      },
      recommendations,
      timestamp: new Date()
    };
  }

  /**
   * Check for XSS and injection attack vulnerabilities
   */
  async detectXSSAndInjectionAttacks(filePaths?: string[]): Promise<{
    xssVulnerabilities: SecurityVulnerability[];
    injectionVulnerabilities: SecurityVulnerability[];
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

    this.scanForVulnerabilities(sourceFiles);

    const xssVulnerabilities = this.vulnerabilities.filter(v => v.type === 'XSS');
    const injectionVulnerabilities = this.vulnerabilities.filter(v => 
      ['SQL_INJECTION', 'COMMAND_INJECTION', 'NOSQL_INJECTION', 'LDAP_INJECTION'].includes(v.type)
    );

    const recommendations: string[] = [];
    
    if (xssVulnerabilities.length > 0) {
      recommendations.push(`Fix ${xssVulnerabilities.length} XSS vulnerabilities`);
      recommendations.push('Use safe DOM manipulation methods and sanitize user input');
    }
    
    if (injectionVulnerabilities.length > 0) {
      recommendations.push(`Fix ${injectionVulnerabilities.length} injection vulnerabilities`);
      recommendations.push('Use parameterized queries and input validation');
    }

    return {
      xssVulnerabilities,
      injectionVulnerabilities,
      recommendations
    };
  }
}