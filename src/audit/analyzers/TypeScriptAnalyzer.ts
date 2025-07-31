// TypeScript Analysis Module

import * as ts from 'typescript';
import { TypeScriptError, CodeQualityAnalyzer } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';

export class TypeScriptAnalyzer {
  private program: ts.Program | null = null;
  private configPath: string;

  constructor(configPath: string = './tsconfig.json') {
    this.configPath = configPath;
  }

  /**
   * Initialize TypeScript program with configuration
   */
  private initializeProgram(): void {
    try {
      const configFile = ts.findConfigFile('./', ts.sys.fileExists, this.configPath);
      
      if (!configFile) {
        throw new AuditError(
          `TypeScript config file not found: ${this.configPath}`,
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
   * Analyze TypeScript files for errors and issues
   */
  async analyzeTypeScript(): Promise<TypeScriptError[]> {
    if (!this.program) {
      this.initializeProgram();
    }

    if (!this.program) {
      throw new AuditError(
        'TypeScript program not initialized',
        'CODE_QUALITY',
        'HIGH',
        'Ensure TypeScript is properly configured'
      );
    }

    const errors: TypeScriptError[] = [];
    const diagnostics = [
      ...this.program.getSemanticDiagnostics(),
      ...this.program.getSyntacticDiagnostics(),
      ...this.program.getDeclarationDiagnostics()
    ];

    for (const diagnostic of diagnostics) {
      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        
        errors.push({
          file: diagnostic.file.fileName,
          line: line + 1,
          column: character + 1,
          message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          severity: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning'
        });
      }
    }

    return errors;
  }

  /**
   * Check for strict TypeScript compliance
   */
  async checkStrictCompliance(): Promise<{
    hasStrictMode: boolean;
    strictChecks: Record<string, boolean>;
    recommendations: string[];
  }> {
    if (!this.program) {
      this.initializeProgram();
    }

    const options = this.program!.getCompilerOptions();
    const recommendations: string[] = [];

    const strictChecks = {
      strict: !!options.strict,
      noImplicitAny: !!options.noImplicitAny,
      strictNullChecks: !!options.strictNullChecks,
      strictFunctionTypes: !!options.strictFunctionTypes,
      strictBindCallApply: !!options.strictBindCallApply,
      strictPropertyInitialization: !!options.strictPropertyInitialization,
      noImplicitReturns: !!options.noImplicitReturns,
      noImplicitThis: !!options.noImplicitThis,
      noUnusedLocals: !!options.noUnusedLocals,
      noUnusedParameters: !!options.noUnusedParameters
    };

    if (!strictChecks.strict) {
      recommendations.push('Enable strict mode for better type safety');
    }
    if (!strictChecks.noImplicitAny) {
      recommendations.push('Enable noImplicitAny to catch untyped variables');
    }
    if (!strictChecks.strictNullChecks) {
      recommendations.push('Enable strictNullChecks to prevent null/undefined errors');
    }
    if (!strictChecks.noUnusedLocals) {
      recommendations.push('Enable noUnusedLocals to catch unused variables');
    }

    return {
      hasStrictMode: strictChecks.strict,
      strictChecks,
      recommendations
    };
  }

  /**
   * Analyze type coverage across the codebase
   */
  async analyzeTypeCoverage(): Promise<{
    totalSymbols: number;
    typedSymbols: number;
    coverage: number;
    untypedFiles: string[];
  }> {
    if (!this.program) {
      this.initializeProgram();
    }

    const checker = this.program!.getTypeChecker();
    const sourceFiles = this.program!.getSourceFiles().filter(
      file => !file.isDeclarationFile && !file.fileName.includes('node_modules')
    );

    let totalSymbols = 0;
    let typedSymbols = 0;
    const untypedFiles: string[] = [];

    for (const sourceFile of sourceFiles) {
      let fileHasUntypedSymbols = false;

      const visit = (node: ts.Node) => {
        if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isFunctionDeclaration(node)) {
          totalSymbols++;
          
          const type = checker.getTypeAtLocation(node);
          const typeString = checker.typeToString(type);
          
          if (typeString === 'any' || typeString.includes('any')) {
            fileHasUntypedSymbols = true;
          } else {
            typedSymbols++;
          }
        }
        
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);

      if (fileHasUntypedSymbols) {
        untypedFiles.push(sourceFile.fileName);
      }
    }

    const coverage = totalSymbols > 0 ? (typedSymbols / totalSymbols) * 100 : 100;

    return {
      totalSymbols,
      typedSymbols,
      coverage: Math.round(coverage * 100) / 100,
      untypedFiles
    };
  }

  /**
   * Find unused exports across the codebase
   */
  async findUnusedExports(): Promise<Array<{
    file: string;
    export: string;
    line: number;
  }>> {
    if (!this.program) {
      this.initializeProgram();
    }

    const checker = this.program!.getTypeChecker();
    const sourceFiles = this.program!.getSourceFiles().filter(
      file => !file.isDeclarationFile && !file.fileName.includes('node_modules')
    );

    const exports = new Map<string, { file: string; line: number }>();
    const imports = new Set<string>();

    // Collect all exports
    for (const sourceFile of sourceFiles) {
      const visit = (node: ts.Node) => {
        if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const element of node.exportClause.elements) {
            const exportName = element.name.text;
            const { line } = sourceFile.getLineAndCharacterOfPosition(element.getStart());
            exports.set(exportName, { file: sourceFile.fileName, line: line + 1 });
          }
        } else if (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
          if (node.name) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            exports.set(node.name.text, { file: sourceFile.fileName, line: line + 1 });
          }
        } else if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
          for (const declaration of node.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name)) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());
              exports.set(declaration.name.text, { file: sourceFile.fileName, line: line + 1 });
            }
          }
        }
        
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    // Collect all imports
    for (const sourceFile of sourceFiles) {
      const visit = (node: ts.Node) => {
        if (ts.isImportDeclaration(node) && node.importClause) {
          if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
            for (const element of node.importClause.namedBindings.elements) {
              imports.add(element.name.text);
            }
          }
          if (node.importClause.name) {
            imports.add(node.importClause.name.text);
          }
        }
        
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    // Find unused exports
    const unusedExports: Array<{ file: string; export: string; line: number }> = [];
    
    for (const [exportName, exportInfo] of exports) {
      if (!imports.has(exportName)) {
        unusedExports.push({
          file: exportInfo.file,
          export: exportName,
          line: exportInfo.line
        });
      }
    }

    return unusedExports;
  }

  /**
   * Generate comprehensive TypeScript analysis report
   */
  async generateTypeScriptReport(): Promise<{
    errors: TypeScriptError[];
    strictCompliance: any;
    typeCoverage: any;
    unusedExports: any[];
    score: number;
    recommendations: string[];
  }> {
    const errors = await this.analyzeTypeScript();
    const strictCompliance = await this.checkStrictCompliance();
    const typeCoverage = await this.analyzeTypeCoverage();
    const unusedExports = await this.findUnusedExports();

    // Calculate score based on various factors
    let score = 100;
    
    // Deduct points for errors
    score -= errors.filter(e => e.severity === 'error').length * 5;
    score -= errors.filter(e => e.severity === 'warning').length * 2;
    
    // Deduct points for poor type coverage
    if (typeCoverage.coverage < 90) {
      score -= (90 - typeCoverage.coverage) * 2;
    }
    
    // Deduct points for unused exports
    score -= unusedExports.length * 1;
    
    // Bonus for strict mode
    if (strictCompliance.hasStrictMode) {
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    const recommendations = [
      ...strictCompliance.recommendations,
      ...(typeCoverage.coverage < 95 ? ['Improve type coverage by adding explicit types'] : []),
      ...(unusedExports.length > 0 ? ['Remove unused exports to clean up the codebase'] : []),
      ...(errors.length > 0 ? ['Fix TypeScript errors and warnings'] : [])
    ];

    return {
      errors,
      strictCompliance,
      typeCoverage,
      unusedExports,
      score: Math.round(score),
      recommendations
    };
  }
}