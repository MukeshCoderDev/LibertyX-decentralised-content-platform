// Import Usage Analysis Module

import * as ts from 'typescript';
import { UnusedImport } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import * as path from 'path';

export interface ImportInfo {
  name: string;
  source: string;
  file: string;
  line: number;
  isDefault: boolean;
  isNamespace: boolean;
  isUsed: boolean;
}

export interface CircularDependency {
  files: string[];
  cycle: string[];
}

export interface ImportAnalysisResult {
  unusedImports: UnusedImport[];
  circularDependencies: CircularDependency[];
  duplicateImports: Array<{
    name: string;
    files: string[];
    sources: string[];
  }>;
  importStatistics: {
    totalImports: number;
    unusedImports: number;
    externalImports: number;
    internalImports: number;
    averageImportsPerFile: number;
  };
  recommendations: string[];
  score: number;
}

export class ImportAnalyzer {
  private program: ts.Program | null = null;
  private sourceFiles: ts.SourceFile[] = [];
  private importMap: Map<string, ImportInfo[]> = new Map();
  private usageMap: Map<string, Set<string>> = new Map();

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
      this.sourceFiles = this.program.getSourceFiles().filter(
        file => !file.isDeclarationFile && !file.fileName.includes('node_modules')
      );
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
   * Extract all imports from source files
   */
  private extractImports(): void {
    this.importMap.clear();

    for (const sourceFile of this.sourceFiles) {
      const imports: ImportInfo[] = [];

      const visit = (node: ts.Node) => {
        if (ts.isImportDeclaration(node)) {
          const moduleSpecifier = node.moduleSpecifier;
          if (ts.isStringLiteral(moduleSpecifier)) {
            const source = moduleSpecifier.text;
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

            if (node.importClause) {
              // Default import
              if (node.importClause.name) {
                imports.push({
                  name: node.importClause.name.text,
                  source,
                  file: sourceFile.fileName,
                  line: line + 1,
                  isDefault: true,
                  isNamespace: false,
                  isUsed: false
                });
              }

              // Named imports
              if (node.importClause.namedBindings) {
                if (ts.isNamedImports(node.importClause.namedBindings)) {
                  for (const element of node.importClause.namedBindings.elements) {
                    imports.push({
                      name: element.name.text,
                      source,
                      file: sourceFile.fileName,
                      line: line + 1,
                      isDefault: false,
                      isNamespace: false,
                      isUsed: false
                    });
                  }
                } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                  // Namespace import (import * as name)
                  imports.push({
                    name: node.importClause.namedBindings.name.text,
                    source,
                    file: sourceFile.fileName,
                    line: line + 1,
                    isDefault: false,
                    isNamespace: true,
                    isUsed: false
                  });
                }
              }
            }
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
      this.importMap.set(sourceFile.fileName, imports);
    }
  }

  /**
   * Analyze usage of imported symbols
   */
  private analyzeUsage(): void {
    this.usageMap.clear();

    for (const sourceFile of this.sourceFiles) {
      const usedSymbols = new Set<string>();

      const visit = (node: ts.Node) => {
        if (ts.isIdentifier(node)) {
          usedSymbols.add(node.text);
        }

        // Handle property access (namespace.member)
        if (ts.isPropertyAccessExpression(node)) {
          if (ts.isIdentifier(node.expression)) {
            usedSymbols.add(node.expression.text);
          }
        }

        // Handle JSX elements
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const tagName = node.tagName;
          if (ts.isIdentifier(tagName)) {
            usedSymbols.add(tagName.text);
          } else if (ts.isPropertyAccessExpression(tagName) && ts.isIdentifier(tagName.expression)) {
            usedSymbols.add(tagName.expression.text);
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
      this.usageMap.set(sourceFile.fileName, usedSymbols);
    }

    // Mark imports as used based on usage analysis
    for (const [fileName, imports] of this.importMap) {
      const usedSymbols = this.usageMap.get(fileName) || new Set();
      
      for (const importInfo of imports) {
        importInfo.isUsed = usedSymbols.has(importInfo.name);
      }
    }
  }

  /**
   * Find unused imports
   */
  private findUnusedImports(): UnusedImport[] {
    const unusedImports: UnusedImport[] = [];

    for (const [fileName, imports] of this.importMap) {
      for (const importInfo of imports) {
        if (!importInfo.isUsed) {
          unusedImports.push({
            file: importInfo.file,
            line: importInfo.line,
            column: 1,
            name: importInfo.name,
            source: importInfo.source,
            type: importInfo.isDefault ? 'default' : importInfo.isNamespace ? 'namespace' : 'named'
          });
        }
      }
    }

    return unusedImports;
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(): CircularDependency[] {
    const dependencyGraph = new Map<string, Set<string>>();
    const circularDependencies: CircularDependency[] = [];

    // Build dependency graph
    for (const [fileName, imports] of this.importMap) {
      const dependencies = new Set<string>();
      
      for (const importInfo of imports) {
        // Only track internal dependencies (relative imports)
        if (importInfo.source.startsWith('./') || importInfo.source.startsWith('../')) {
          const resolvedPath = path.resolve(path.dirname(fileName), importInfo.source);
          dependencies.add(resolvedPath);
        }
      }
      
      dependencyGraph.set(fileName, dependencies);
    }

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];

    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = currentPath.indexOf(node);
        const cycle = currentPath.slice(cycleStart);
        cycle.push(node); // Complete the cycle
        
        circularDependencies.push({
          files: [...new Set(cycle)],
          cycle
        });
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);
      currentPath.push(node);

      const dependencies = dependencyGraph.get(node) || new Set();
      for (const dependency of dependencies) {
        if (hasCycle(dependency)) {
          return true;
        }
      }

      recursionStack.delete(node);
      currentPath.pop();
      return false;
    };

    for (const fileName of dependencyGraph.keys()) {
      if (!visited.has(fileName)) {
        hasCycle(fileName);
      }
    }

    return circularDependencies;
  }

  /**
   * Find duplicate imports
   */
  private findDuplicateImports(): Array<{
    name: string;
    files: string[];
    sources: string[];
  }> {
    const importsByName = new Map<string, { files: Set<string>; sources: Set<string> }>();

    for (const [fileName, imports] of this.importMap) {
      for (const importInfo of imports) {
        if (!importsByName.has(importInfo.name)) {
          importsByName.set(importInfo.name, {
            files: new Set(),
            sources: new Set()
          });
        }

        const entry = importsByName.get(importInfo.name)!;
        entry.files.add(fileName);
        entry.sources.add(importInfo.source);
      }
    }

    const duplicates: Array<{
      name: string;
      files: string[];
      sources: string[];
    }> = [];

    for (const [name, { files, sources }] of importsByName) {
      if (sources.size > 1) {
        duplicates.push({
          name,
          files: Array.from(files),
          sources: Array.from(sources)
        });
      }
    }

    return duplicates;
  }

  /**
   * Calculate import statistics
   */
  private calculateStatistics(): {
    totalImports: number;
    unusedImports: number;
    externalImports: number;
    internalImports: number;
    averageImportsPerFile: number;
  } {
    let totalImports = 0;
    let unusedImports = 0;
    let externalImports = 0;
    let internalImports = 0;

    for (const [fileName, imports] of this.importMap) {
      totalImports += imports.length;
      
      for (const importInfo of imports) {
        if (!importInfo.isUsed) {
          unusedImports++;
        }

        if (importInfo.source.startsWith('./') || importInfo.source.startsWith('../')) {
          internalImports++;
        } else {
          externalImports++;
        }
      }
    }

    const averageImportsPerFile = this.sourceFiles.length > 0 
      ? totalImports / this.sourceFiles.length 
      : 0;

    return {
      totalImports,
      unusedImports,
      externalImports,
      internalImports,
      averageImportsPerFile: Math.round(averageImportsPerFile * 100) / 100
    };
  }

  /**
   * Analyze import usage across the codebase
   */
  async analyzeImports(): Promise<ImportAnalysisResult> {
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

    // Extract imports and analyze usage
    this.extractImports();
    this.analyzeUsage();

    // Perform various analyses
    const unusedImports = this.findUnusedImports();
    const circularDependencies = this.detectCircularDependencies();
    const duplicateImports = this.findDuplicateImports();
    const importStatistics = this.calculateStatistics();

    // Calculate score
    let score = 100;
    score -= unusedImports.length * 2;
    score -= circularDependencies.length * 15;
    score -= duplicateImports.length * 5;

    // Penalty for high unused import ratio
    const unusedRatio = importStatistics.totalImports > 0 
      ? importStatistics.unusedImports / importStatistics.totalImports 
      : 0;
    if (unusedRatio > 0.1) {
      score -= (unusedRatio - 0.1) * 100;
    }

    score = Math.max(0, Math.min(100, score));

    // Generate recommendations
    const recommendations: string[] = [];

    if (unusedImports.length > 0) {
      recommendations.push(`Remove ${unusedImports.length} unused imports to clean up the codebase`);
    }

    if (circularDependencies.length > 0) {
      recommendations.push(`Resolve ${circularDependencies.length} circular dependencies to improve maintainability`);
    }

    if (duplicateImports.length > 0) {
      recommendations.push(`Consolidate ${duplicateImports.length} duplicate imports from different sources`);
    }

    if (unusedRatio > 0.2) {
      recommendations.push(`High unused import ratio (${(unusedRatio * 100).toFixed(1)}%) - consider regular cleanup`);
    }

    if (importStatistics.averageImportsPerFile > 20) {
      recommendations.push(`High average imports per file (${importStatistics.averageImportsPerFile}) - consider code organization`);
    }

    return {
      unusedImports,
      circularDependencies,
      duplicateImports,
      importStatistics,
      recommendations,
      score: Math.round(score)
    };
  }

  /**
   * Analyze imports for specific files
   */
  async analyzeFiles(filePaths: string[]): Promise<ImportAnalysisResult> {
    // Filter to only analyze specified files
    const originalSourceFiles = this.sourceFiles;
    
    try {
      if (!this.program) {
        await this.initializeProgram();
      }

      this.sourceFiles = this.sourceFiles.filter(file => 
        filePaths.some(filePath => file.fileName.includes(filePath))
      );

      return await this.analyzeImports();
    } finally {
      this.sourceFiles = originalSourceFiles;
    }
  }

  /**
   * Get import optimization suggestions
   */
  getOptimizationSuggestions(analysisResult: ImportAnalysisResult): string[] {
    const suggestions: string[] = [];

    // Suggest removing unused imports
    if (analysisResult.unusedImports.length > 0) {
      const fileGroups = new Map<string, string[]>();
      for (const unusedImport of analysisResult.unusedImports) {
        if (!fileGroups.has(unusedImport.file)) {
          fileGroups.set(unusedImport.file, []);
        }
        fileGroups.get(unusedImport.file)!.push(unusedImport.name);
      }

      for (const [file, imports] of fileGroups) {
        suggestions.push(`Remove unused imports in ${path.basename(file)}: ${imports.join(', ')}`);
      }
    }

    // Suggest resolving circular dependencies
    for (const circular of analysisResult.circularDependencies) {
      suggestions.push(`Break circular dependency: ${circular.cycle.map(f => path.basename(f)).join(' → ')}`);
    }

    // Suggest consolidating duplicate imports
    for (const duplicate of analysisResult.duplicateImports) {
      suggestions.push(`Consolidate '${duplicate.name}' imported from: ${duplicate.sources.join(', ')}`);
    }

    return suggestions;
  }
}